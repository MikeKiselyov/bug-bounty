import type { CaseDefinition, UpcomingCase } from '../lib/types'
import { registrationCase } from './registration'
import { cartCase } from './cart'
import { tableCase } from './table'
import { uploadCase } from './upload'
import { apiCase } from './api'

export const CASES: CaseDefinition[] = [registrationCase, cartCase, tableCase, uploadCase, apiCase]

export const UPCOMING_CASES: UpcomingCase[] = [
  {
    code: 'CASE-06',
    title: 'Login and 2FA',
    description: 'Lockouts, one-time codes, remember me and session expiry.',
    level: 'senior',
    tags: ['auth', 'security'],
  },
  {
    code: 'CASE-07',
    title: 'Search with autocomplete',
    description: 'Debounce, race conditions, highlighting and empty states.',
    level: 'middle',
    tags: ['search', 'async'],
  },
]

export function findCase(caseId: string): CaseDefinition | undefined {
  for (const definition of CASES) {
    if (definition.id === caseId) {
      return definition
    }
  }
  return undefined
}

export function countAllBugs(): number {
  let total = 0
  for (const definition of CASES) {
    total = total + definition.bugs.length
  }
  return total
}
