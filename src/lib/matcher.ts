import type { Bug, Category, Severity } from './types'

export interface Report {
  element: string
  category: Category
  severity?: Severity
}

export type MatchResult =
  | { kind: 'match'; bug: Bug; severityMatches: boolean | null }
  | { kind: 'not-reproduced'; bug: Bug }
  | { kind: 'duplicate'; bug: Bug }
  | { kind: 'close' }
  | { kind: 'miss' }

export function bugCoversElement(bug: Bug, element: string): boolean {
  if (bug.element === element) {
    return true
  }
  if (!bug.alternateElements) {
    return false
  }
  for (const alternate of bug.alternateElements) {
    if (alternate === element) {
      return true
    }
  }
  return false
}

// A report matches a bug when the element and the category are the same.
// A dynamic bug also has to be reproduced (triggered) before it counts.
// Severity never blocks a match, it only produces feedback.
export function matchReport(report: Report, bugs: Bug[], foundIds: string[], triggeredIds: string[]): MatchResult {
  let alreadyFoundBug: Bug | null = null
  let elementHasUnfoundBug = false

  for (const bug of bugs) {
    const isFound = foundIds.includes(bug.id)
    const sameElement = bugCoversElement(bug, report.element)
    const sameCategory = bug.category === report.category

    if (sameElement && sameCategory) {
      if (isFound) {
        alreadyFoundBug = bug
        continue
      }
      const isReproduced = bug.kind === 'static' || triggeredIds.includes(bug.id)
      if (!isReproduced) {
        return { kind: 'not-reproduced', bug }
      }
      let severityMatches: boolean | null = null
      if (report.severity) {
        severityMatches = bug.severity === report.severity
      }
      return { kind: 'match', bug, severityMatches }
    }

    if (sameElement && !isFound) {
      elementHasUnfoundBug = true
    }
  }

  if (alreadyFoundBug) {
    return { kind: 'duplicate', bug: alreadyFoundBug }
  }
  if (elementHasUnfoundBug) {
    return { kind: 'close' }
  }
  return { kind: 'miss' }
}
