import type { ComponentType } from 'react'

export type Category = 'validation' | 'ui' | 'logic' | 'a11y' | 'security' | 'text'
export type Severity = 'trivial' | 'minor' | 'major' | 'critical'
export type Level = 'junior' | 'middle' | 'senior'

// static: visible as is, pinning the element is enough.
// dynamic: must be reproduced first, the case app reports it through useBugTrigger.
export type BugKind = 'static' | 'dynamic'

export interface Bug {
  id: string
  element: string
  category: Category
  severity: Severity
  kind: BugKind
  alternateElements?: string[]
  title: string
  hint: string
  explanation: string
}

export interface CaseElement {
  id: string
  label: string
}

export interface CaseDefinition {
  id: string
  code: string
  title: string
  description: string
  briefing: string
  level: Level
  tags: string[]
  url: string
  elements: CaseElement[]
  bugs: Bug[]
  App: ComponentType
}

export interface UpcomingCase {
  code: string
  title: string
  description: string
  level: Level
  tags: string[]
}
