import type { Bug, CaseDefinition } from '../../lib/types'
import bugs from './bugs.json'
import { UploadApp } from './UploadApp'

export const uploadCase: CaseDefinition = {
  id: 'upload',
  code: 'CASE-04',
  title: 'File upload',
  description: 'Avatar and documents: formats, sizes, limits and file names.',
  briefing:
    'Hireflow candidate profile. Requirements: the photo is an image up to 2 MB. Documents are PDF, JPG or PNG up to 10 MB each, at most 5 files in total. A document can be renamed by clicking its name. Save works only after every upload has finished. Bring a few files of your own: different formats, sizes, names and duplicates.',
  level: 'senior',
  tags: ['upload', 'files', 'security'],
  url: 'hireflow.local/profile/documents',
  elements: [
    { id: 'avatar', label: 'Profile photo' },
    { id: 'dropzone', label: 'Documents drop zone' },
    { id: 'limit', label: 'File limit / counter' },
    { id: 'file-name', label: 'File name' },
    { id: 'file-size', label: 'File size' },
    { id: 'progress', label: 'Upload progress' },
    { id: 'remove', label: '"Remove" button' },
    { id: 'submit', label: '"Save documents" button' },
    { id: 'other', label: 'Other / whole page' },
  ],
  bugs: bugs as Bug[],
  App: UploadApp,
}
