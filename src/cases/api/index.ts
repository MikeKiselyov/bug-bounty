import type { Bug, CaseDefinition } from '../../lib/types'
import bugs from './bugs.json'
import { ApiApp } from './ApiApp'

export const apiCase: CaseDefinition = {
  id: 'api',
  code: 'CASE-05',
  title: 'API: user profile',
  description: 'Bugs that live in requests and responses: status codes, leaked fields, caching.',
  briefing:
    'Pulse profile settings. The backend is a mock API running in a service worker, so open DevTools: the Network tab shows every request to pulse-api, and the Console can send your own with fetch(). Requirements: the API returns only public profile fields, errors use proper status codes without internals, a user sees and changes only their own data, the role is managed by admins only, bio is at most 160 characters.',
  level: 'senior',
  tags: ['api', 'devtools', 'security'],
  url: 'pulse.local/settings/profile',
  elements: [
    { id: 'header', label: 'Profile header (name, member since)' },
    { id: 'avatar', label: 'Profile photo' },
    { id: 'role', label: 'Role badge' },
    { id: 'refresh', label: '"Refresh" button' },
    { id: 'name', label: 'Display name' },
    { id: 'email', label: 'Email' },
    { id: 'bio', label: 'Bio' },
    { id: 'save', label: '"Save changes" button' },
    { id: 'status', label: 'Save status message' },
    { id: 'orders', label: 'Billing history' },
    { id: 'other', label: 'Other / whole page' },
  ],
  bugs: bugs as Bug[],
  App: ApiApp,
}
