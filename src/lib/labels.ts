import type { Category, Level, Severity } from './types'

export const CATEGORIES: Category[] = ['validation', 'ui', 'logic', 'a11y', 'security', 'text']
export const SEVERITIES: Severity[] = ['trivial', 'minor', 'major', 'critical']

export const CATEGORY_LABELS: Record<Category, string> = {
  validation: 'Validation',
  ui: 'UI',
  logic: 'Logic',
  a11y: 'Accessibility',
  security: 'Security',
  text: 'Copy',
}

export const SEVERITY_LABELS: Record<Severity, string> = {
  trivial: 'Trivial',
  minor: 'Minor',
  major: 'Major',
  critical: 'Critical',
}

export const LEVEL_LABELS: Record<Level, string> = {
  junior: 'Junior',
  middle: 'Middle',
  senior: 'Senior',
}
