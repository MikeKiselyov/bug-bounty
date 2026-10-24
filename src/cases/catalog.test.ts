import { describe, expect, it } from 'vitest'
import { CASES } from './index'
import { CATEGORIES, SEVERITIES } from '../lib/labels'

// Raw sources of every case app, to check that the catalog is wired into the code.
const SOURCES = import.meta.glob('./*/*.{tsx,ts}', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>

function sourceOfCase(caseId: string): string {
  let combined = ''
  for (const path of Object.keys(SOURCES)) {
    if (path.startsWith('./' + caseId + '/') && !path.endsWith('.test.ts')) {
      combined = combined + SOURCES[path]
    }
  }
  return combined
}

describe('case catalogs', () => {
  it('have unique case ids and codes', () => {
    const ids = new Set<string>()
    const codes = new Set<string>()
    for (const definition of CASES) {
      expect(ids.has(definition.id)).toBe(false)
      expect(codes.has(definition.code)).toBe(false)
      ids.add(definition.id)
      codes.add(definition.code)
    }
  })

  for (const definition of CASES) {
    describe(definition.id, () => {
      const source = sourceOfCase(definition.id)
      const elementIds: string[] = []
      for (const element of definition.elements) {
        elementIds.push(element.id)
      }

      it('has bugs', () => {
        expect(definition.bugs.length).toBeGreaterThan(0)
      })

      it('uses unique bug ids', () => {
        const bugIds = new Set<string>()
        for (const bug of definition.bugs) {
          expect(bugIds.has(bug.id), bug.id).toBe(false)
          bugIds.add(bug.id)
        }
      })

      it('points every bug to declared elements', () => {
        for (const bug of definition.bugs) {
          expect(elementIds, bug.id).toContain(bug.element)
          for (const alternate of bug.alternateElements ?? []) {
            expect(elementIds, bug.id + ' alternate').toContain(alternate)
          }
        }
      })

      it('uses known kinds, categories and severities', () => {
        for (const bug of definition.bugs) {
          expect(['static', 'dynamic'], bug.id).toContain(bug.kind)
          expect(CATEGORIES, bug.id).toContain(bug.category)
          expect(SEVERITIES, bug.id).toContain(bug.severity)
        }
      })

      // The matcher identifies a bug by element + category, so every pair must be unique,
      // alternate elements included.
      it('has a unique element + category pair per bug', () => {
        const pairs = new Set<string>()
        for (const bug of definition.bugs) {
          const bugElements = [bug.element, ...(bug.alternateElements ?? [])]
          for (const element of bugElements) {
            const pair = element + '/' + bug.category
            expect(pairs.has(pair), bug.id + ' duplicates ' + pair).toBe(false)
            pairs.add(pair)
          }
        }
      })

      it('marks every element in the app with data-bh', () => {
        for (const elementId of elementIds) {
          expect(source.includes('data-bh="' + elementId + '"'), elementId).toBe(true)
        }
      })

      it('fires a trigger for every dynamic bug', () => {
        for (const bug of definition.bugs) {
          if (bug.kind !== 'dynamic') {
            continue
          }
          expect(source.includes("trigger('" + bug.id + "')"), bug.id).toBe(true)
        }
      })

      it('marks every planted bug in the code', () => {
        for (const bug of definition.bugs) {
          expect(source.includes('BUG ' + bug.id), bug.id).toBe(true)
        }
      })

      it('fills title, hint and explanation for every bug', () => {
        for (const bug of definition.bugs) {
          expect(bug.title.trim(), bug.id).not.toBe('')
          expect(bug.hint.trim(), bug.id).not.toBe('')
          expect(bug.explanation.trim(), bug.id).not.toBe('')
        }
      })

      it('does not use em dashes in user-facing text', () => {
        for (const bug of definition.bugs) {
          const text = bug.title + bug.hint + bug.explanation
          expect(text.includes('\u2014'), bug.id).toBe(false)
        }
      })
    })
  }
})
