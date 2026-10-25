import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, KeyboardEvent, SyntheticEvent } from 'react'
import {
  MAX_FILES,
  MAX_FILE_SIZE_MB,
  AVATAR_MAX_SIZE_MB,
  exceedsAvatarSizeLimit,
  exceedsSizeLimit,
  formatSize,
  hasAllowedExtension,
  hasAllowedExtensionIgnoringCase,
  isTooLarge,
  isUploadFinished,
  nextProgress,
} from './uploadRules'
import { useBugTrigger } from '../../lib/bugTrigger'
import { useMediaQuery } from '../../lib/mediaQuery'
import './upload.css'

// Planted bugs are marked with "BUG UPL-xx". Keep them when refactoring:
// the catalog in bugs.json depends on them. trigger('UPL-xx') fires when a bug becomes observable.

interface UploadedFile {
  id: number
  name: string
  size: number
  progress: number
}

const PROGRESS_INTERVAL_MS = 150
const HTML_TAG_PATTERN = /<[a-z!/]/i

interface ExifData {
  orientation: number
}

// Only JPEG photos carry EXIF data.
async function readExif(file: File): Promise<ExifData | null> {
  if (file.type !== 'image/jpeg') {
    return null
  }
  return { orientation: 1 }
}

export function UploadApp() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const avatarOrientation = useRef(1)
  const [isAvatarDragOver, setIsAvatarDragOver] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draftName, setDraftName] = useState('')
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const nextIdRef = useRef(1)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const trigger = useBugTrigger()
  // Same query as in upload.css.
  const isShortLandscape = useMediaQuery('(orientation: landscape) and (max-height: 500px)')

  useEffect(() => {
    if (isShortLandscape) {
      // BUG UPL-15: on a phone in landscape the drop zone collapses, see .upl-dropzone.
      trigger('UPL-15')
    }
  }, [isShortLandscape, trigger])

  let isAnyUploading = false
  let isProgressOverflowing = false
  for (const file of files) {
    if (!isUploadFinished(file.progress)) {
      isAnyUploading = true
    }
    if (file.progress > 100) {
      isProgressOverflowing = true
    }
  }

  useEffect(() => {
    if (isProgressOverflowing) {
      trigger('UPL-07')
    }
  }, [isProgressOverflowing, trigger])

  useEffect(() => {
    if (!isAnyUploading) {
      return
    }
    const timer = window.setInterval(() => {
      setFiles((currentFiles) => {
        const updatedFiles: UploadedFile[] = []
        for (const file of currentFiles) {
          if (isUploadFinished(file.progress)) {
            updatedFiles.push(file)
          } else {
            updatedFiles.push({ ...file, progress: nextProgress(file.progress) })
          }
        }
        return updatedFiles
      })
    }, PROGRESS_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [isAnyUploading])

  useEffect(() => {
    return () => {
      if (avatarUrl) {
        URL.revokeObjectURL(avatarUrl)
      }
    }
  }, [avatarUrl])

  function setAvatar(file: File) {
    // BUG UPL-01: neither the type nor the size of the avatar is checked, accept="image/*" is the only guard.
    if (!file.type.startsWith('image/') || exceedsAvatarSizeLimit(file.size)) {
      trigger('UPL-01')
    }
    setAvatarUrl(URL.createObjectURL(file))
    // BUG UPL-14: null for a PNG or any non-JPEG file is not handled, the promise rejects uncaught.
    readExif(file).then((exif) => {
      if (exif === null) {
        trigger('UPL-14')
      }
      avatarOrientation.current = exif!.orientation
    })
  }

  function onAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = event.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      setAvatar(selectedFiles[0])
    }
    event.target.value = ''
  }

  function onAvatarDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsAvatarDragOver(false)
    if (event.dataTransfer.files.length > 0) {
      setAvatar(event.dataTransfer.files[0])
    }
  }

  function onAvatarLoad(event: SyntheticEvent<HTMLImageElement>) {
    // BUG UPL-02: the preview has fixed width and height without object-fit, see .upl-avatar-img.
    const image = event.currentTarget
    if (image.naturalWidth !== image.naturalHeight) {
      trigger('UPL-02')
    }
  }

  function addDocuments(selectedFiles: File[]) {
    const accepted: UploadedFile[] = []
    const newErrors: string[] = []
    for (const file of selectedFiles) {
      if (!hasAllowedExtension(file.name)) {
        if (hasAllowedExtensionIgnoringCase(file.name)) {
          trigger('UPL-04')
        }
        newErrors.push(file.name + ': only PDF, JPG or PNG files are allowed')
        continue
      }
      if (isTooLarge(file.size)) {
        newErrors.push(file.name + ': the file is larger than ' + MAX_FILE_SIZE_MB + ' MB')
        continue
      }
      if (exceedsSizeLimit(file.size)) {
        trigger('UPL-03')
      }
      if (HTML_TAG_PATTERN.test(file.name)) {
        trigger('UPL-05')
      }
      accepted.push({ id: nextIdRef.current, name: file.name, size: file.size, progress: 0 })
      nextIdRef.current = nextIdRef.current + 1
    }

    // BUG UPL-10: only the new selection is compared with the limit.
    if (accepted.length > MAX_FILES) {
      newErrors.push('You can upload up to ' + MAX_FILES + ' files')
      setErrors(newErrors)
      return
    }
    if (files.length + accepted.length > MAX_FILES) {
      trigger('UPL-10')
    }
    for (const file of accepted) {
      if (file.size >= 1024) {
        trigger('UPL-06')
      }
    }
    setErrors(newErrors)
    setSavedMessage(null)
    setFiles((currentFiles) => [...currentFiles, ...accepted])
  }

  function onDocumentsChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = event.target.files
    if (selectedFiles) {
      addDocuments(Array.from(selectedFiles))
    }
    event.target.value = ''
  }

  function onDocumentsDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragOver(false)
    addDocuments(Array.from(event.dataTransfer.files))
  }

  function openDocumentPicker() {
    documentInputRef.current?.click()
  }

  function removeFile(fileId: number) {
    let removedName = ''
    for (const file of files) {
      if (file.id === fileId) {
        removedName = file.name
      }
    }
    // BUG UPL-09: files are removed by name, so every duplicate disappears together.
    const remainingFiles: UploadedFile[] = []
    let removedCount = 0
    for (const file of files) {
      if (file.name === removedName) {
        removedCount = removedCount + 1
      } else {
        remainingFiles.push(file)
      }
    }
    if (removedCount > 1) {
      trigger('UPL-09')
    }
    setFiles(remainingFiles)
    setSavedMessage(null)
  }

  function startRename(file: UploadedFile) {
    setEditingId(file.id)
    setDraftName(file.name)
  }

  function finishRename(fileId: number) {
    const newName = draftName.trim()
    setEditingId(null)
    if (newName === '') {
      return
    }
    if (HTML_TAG_PATTERN.test(newName)) {
      trigger('UPL-05')
    }
    const renamedFiles: UploadedFile[] = []
    for (const file of files) {
      if (file.id === fileId) {
        renamedFiles.push({ ...file, name: newName })
      } else {
        renamedFiles.push(file)
      }
    }
    setFiles(renamedFiles)
  }

  function onRenameKeyDown(event: KeyboardEvent<HTMLInputElement>, fileId: number) {
    if (event.key === 'Enter') {
      finishRename(fileId)
    }
    if (event.key === 'Escape') {
      setEditingId(null)
    }
  }

  function save() {
    // BUG UPL-12: Save is not blocked while uploads are in progress, unfinished files are counted as saved.
    if (isAnyUploading) {
      trigger('UPL-12')
    }
    setSavedMessage(files.length + ' documents saved to your profile')
  }

  return (
    <div className="upl-page" data-bh="other">
      <header className="upl-header">
        <span className="upl-logo">hireflow</span>
        <span className="upl-step">Step 3 of 4 · Documents</span>
      </header>

      <main className="upl-card">
        <div>
          <h1 className="upl-title">Your candidate profile</h1>
          <p className="upl-subtitle">Recruiters see your photo and documents before the first call.</p>
        </div>

        <section className="upl-section">
          <h2 className="upl-section-title">Profile photo</h2>
          <div
            className={'upl-avatar' + (isAvatarDragOver ? ' upl-drag-over' : '')}
            data-bh="avatar"
            onDragOver={(event) => {
              event.preventDefault()
              setIsAvatarDragOver(true)
            }}
            onDragLeave={() => setIsAvatarDragOver(false)}
            onDrop={onAvatarDrop}
          >
            {avatarUrl ? (
              <img className="upl-avatar-img" src={avatarUrl} alt="Your profile photo" onLoad={onAvatarLoad} />
            ) : (
              <span className="upl-avatar-empty" aria-hidden="true">
                JD
              </span>
            )}
            <div className="upl-avatar-text">
              <label className="upl-button-secondary">
                Upload photo
                <input type="file" accept="image/*" className="upl-visually-hidden" onChange={onAvatarChange} />
              </label>
              <span className="upl-muted">JPG, PNG, GIF or WebP, up to {AVATAR_MAX_SIZE_MB} MB. You can drop it here.</span>
            </div>
          </div>
        </section>

        <section className="upl-section">
          <div className="upl-section-head">
            <h2 className="upl-section-title">Documents</h2>
            {/* BUG UPL-13: the counter shows a limit of 10, the rules say 5. */}
            <span className="upl-counter" data-bh="limit">
              {files.length} / 10 files
            </span>
          </div>

          {/* BUG UPL-11: a clickable div without role or tabindex, and the input is display: none. */}
          <div
            className={'upl-dropzone' + (isDragOver ? ' upl-drag-over' : '')}
            data-bh="dropzone"
            onClick={openDocumentPicker}
            onDragOver={(event) => {
              event.preventDefault()
              setIsDragOver(true)
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={onDocumentsDrop}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="upl-dropzone-title">Drop files here or click to browse</span>
            <span className="upl-muted" data-bh="limit">
              CV, cover letter, certificates. PDF, JPG or PNG up to {MAX_FILE_SIZE_MB} MB each, at most {MAX_FILES} files.
            </span>
            <input
              ref={documentInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              className="upl-hidden-input"
              onChange={onDocumentsChange}
            />
          </div>

          {errors.length > 0 ? (
            <ul className="upl-errors" role="alert">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}

          {files.length > 0 ? (
            <ul className="upl-files">
              {files.map((file) => (
                <li className="upl-file" key={file.id}>
                  <div className="upl-file-main">
                    {editingId === file.id ? (
                      <input
                        className="upl-rename"
                        aria-label="New file name"
                        value={draftName}
                        autoFocus
                        onChange={(event) => setDraftName(event.target.value)}
                        onKeyDown={(event) => onRenameKeyDown(event, file.id)}
                        onBlur={() => finishRename(file.id)}
                      />
                    ) : (
                      <button
                        type="button"
                        className="upl-file-name"
                        title="Click to rename"
                        data-bh="file-name"
                        onClick={() => startRename(file)}
                      >
                        {/* BUG UPL-05: the file name is rendered as HTML. */}
                        <span dangerouslySetInnerHTML={{ __html: file.name }} />
                      </button>
                    )}
                    <span className="upl-file-size" data-bh="file-size">
                      {formatSize(file.size)}
                    </span>
                  </div>
                  {/* BUG UPL-08: a plain div, no role="progressbar" and no aria values. */}
                  <div className="upl-progress" data-bh="progress">
                    <div className="upl-progress-track">
                      <div className="upl-progress-fill" style={{ width: Math.min(file.progress, 100) + '%' }} />
                    </div>
                    <span className="upl-progress-label">
                      {isUploadFinished(file.progress) ? 'Uploaded · ' : 'Uploading · '}
                      {file.progress}%
                    </span>
                  </div>
                  <button type="button" className="upl-remove" data-bh="remove" onClick={() => removeFile(file.id)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <div className="upl-actions">
          <button type="button" className="upl-button-primary" data-bh="submit" onClick={save}>
            Save documents
          </button>
          {savedMessage ? (
            <span className="upl-saved" role="status" data-bh="submit">
              {savedMessage}
            </span>
          ) : null}
        </div>
      </main>
    </div>
  )
}
