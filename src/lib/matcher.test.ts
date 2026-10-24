import { describe, expect, it } from 'vitest'
import { matchReport } from './matcher'
import type { Bug } from './types'

function makeBug(overrides: Partial<Bug>): Bug {
  return {
    id: 'B-0',
    element: 'email',
    category: 'validation',
    severity: 'minor',
    kind: 'static',
    title: '',
    hint: '',
    explanation: '',
    ...overrides,
  }
}

const EMAIL_VALIDATION = makeBug({ id: 'B-1', element: 'email', category: 'validation', kind: 'dynamic' })
const EMAIL_TYPO = makeBug({ id: 'B-2', element: 'email', category: 'text', kind: 'static', severity: 'trivial' })
const SORT_ARROW = makeBug({
  id: 'B-3',
  element: 'headers',
  alternateElements: ['sort-name'],
  category: 'ui',
  kind: 'static',
})
const BUGS = [EMAIL_VALIDATION, EMAIL_TYPO, SORT_ARROW]

describe('matchReport', () => {
  it('matches a static bug without reproduction', () => {
    const result = matchReport({ element: 'email', category: 'text' }, BUGS, [], [])
    expect(result).toEqual({ kind: 'match', bug: EMAIL_TYPO, severityMatches: null })
  })

  it('asks to reproduce a dynamic bug first', () => {
    const result = matchReport({ element: 'email', category: 'validation' }, BUGS, [], [])
    expect(result).toEqual({ kind: 'not-reproduced', bug: EMAIL_VALIDATION })
  })

  it('matches a dynamic bug once it was triggered', () => {
    const result = matchReport({ element: 'email', category: 'validation' }, BUGS, [], ['B-1'])
    expect(result.kind).toBe('match')
  })

  it('compares severity only when it was given', () => {
    const result = matchReport({ element: 'email', category: 'text', severity: 'major' }, BUGS, [], [])
    expect(result).toEqual({ kind: 'match', bug: EMAIL_TYPO, severityMatches: false })
  })

  it('matches through an alternate element', () => {
    const result = matchReport({ element: 'sort-name', category: 'ui' }, BUGS, [], [])
    expect(result).toEqual({ kind: 'match', bug: SORT_ARROW, severityMatches: null })
  })

  it('reports a duplicate for an already found bug', () => {
    const result = matchReport({ element: 'email', category: 'text' }, BUGS, ['B-2'], [])
    expect(result).toEqual({ kind: 'duplicate', bug: EMAIL_TYPO })
  })

  it('says "close" when the element has an unfound bug of another category', () => {
    const result = matchReport({ element: 'email', category: 'ui' }, BUGS, [], [])
    expect(result).toEqual({ kind: 'close' })
  })

  it('misses when the element has no unfound bugs left', () => {
    const result = matchReport({ element: 'email', category: 'ui' }, BUGS, ['B-1', 'B-2'], [])
    expect(result).toEqual({ kind: 'miss' })
  })

  it('misses for an element without bugs', () => {
    const result = matchReport({ element: 'other', category: 'logic' }, BUGS, [], [])
    expect(result).toEqual({ kind: 'miss' })
  })
})
