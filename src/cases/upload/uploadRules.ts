// Upload rules of the Hireflow case. Planted bugs are marked with "BUG UPL-xx".

export const MAX_FILES = 5
export const MAX_FILE_SIZE_MB = 10
export const AVATAR_MAX_SIZE_MB = 2
export const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.png']
export const PROGRESS_STEP = 7

const BYTES_IN_MEGABYTE = 1024 * 1024

// BUG UPL-04: the extension check is case-sensitive, so REPORT.PDF is rejected.
export function hasAllowedExtension(fileName: string): boolean {
  for (const extension of ALLOWED_EXTENSIONS) {
    if (fileName.endsWith(extension)) {
      return true
    }
  }
  return false
}

// The intended check, used only to detect UPL-04.
export function hasAllowedExtensionIgnoringCase(fileName: string): boolean {
  return hasAllowedExtension(fileName.toLowerCase())
}

// BUG UPL-03: the limit is converted to gigabytes instead of megabytes.
export function isTooLarge(sizeInBytes: number): boolean {
  return sizeInBytes > MAX_FILE_SIZE_MB * BYTES_IN_MEGABYTE * 1024
}

// The intended check, used only to detect UPL-03.
export function exceedsSizeLimit(sizeInBytes: number): boolean {
  return sizeInBytes > MAX_FILE_SIZE_MB * BYTES_IN_MEGABYTE
}

export function exceedsAvatarSizeLimit(sizeInBytes: number): boolean {
  return sizeInBytes > AVATAR_MAX_SIZE_MB * BYTES_IN_MEGABYTE
}

// BUG UPL-06: the value is calculated in megabytes but labelled as kilobytes.
export function formatSize(sizeInBytes: number): string {
  if (sizeInBytes < 1024) {
    return sizeInBytes + ' B'
  }
  const sizeInMegabytes = sizeInBytes / BYTES_IN_MEGABYTE
  return sizeInMegabytes.toFixed(1) + ' KB'
}

// BUG UPL-07: progress is never clamped, the last step overshoots 100.
export function nextProgress(progress: number): number {
  return progress + PROGRESS_STEP
}

export function isUploadFinished(progress: number): boolean {
  return progress >= 100
}
