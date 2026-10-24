import { useCallback, useEffect, useState } from 'react'

export interface CaseProgress {
  found: string[]
  triggered: string[]
  hints: string[]
  answersShown: boolean
}

export type ProgressMap = Record<string, CaseProgress>

const STORAGE_KEY = 'bughunt:progress:v1'
const CHANGE_EVENT = 'bughunt:progress-change'

export function emptyProgress(): CaseProgress {
  return { found: [], triggered: [], hints: [], answersShown: false }
}

function readAll(): ProgressMap {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {}
    }
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      return parsed as ProgressMap
    }
    return {}
  } catch {
    return {}
  }
}

function writeAll(progress: ProgressMap): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Storage can be unavailable (private mode). Progress then lives only in memory.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

let memoryProgress: ProgressMap = readAll()

export function getCaseProgress(caseId: string): CaseProgress {
  const stored = memoryProgress[caseId]
  if (!stored) {
    return emptyProgress()
  }
  return normalizeProgress(stored)
}

function normalizeProgress(stored: Partial<CaseProgress>): CaseProgress {
  return {
    found: stored.found ?? [],
    triggered: stored.triggered ?? [],
    hints: stored.hints ?? [],
    answersShown: stored.answersShown ?? false,
  }
}

export function setCaseProgress(caseId: string, progress: CaseProgress): void {
  memoryProgress = { ...memoryProgress, [caseId]: progress }
  writeAll(memoryProgress)
}

export function resetCaseProgress(caseId: string): void {
  const next: ProgressMap = { ...memoryProgress }
  delete next[caseId]
  memoryProgress = next
  writeAll(memoryProgress)
}

export function useProgress(): ProgressMap {
  const [progress, setProgress] = useState<ProgressMap>(memoryProgress)

  useEffect(() => {
    function handleChange() {
      setProgress(memoryProgress)
    }
    window.addEventListener(CHANGE_EVENT, handleChange)
    return () => window.removeEventListener(CHANGE_EVENT, handleChange)
  }, [])

  return progress
}

export function useCaseProgress(caseId: string) {
  const allProgress = useProgress()
  const stored = allProgress[caseId]
  const progress: CaseProgress = stored ? normalizeProgress(stored) : emptyProgress()

  const update = useCallback(
    (changes: Partial<CaseProgress>) => {
      const current = getCaseProgress(caseId)
      setCaseProgress(caseId, { ...current, ...changes })
    },
    [caseId],
  )

  const reset = useCallback(() => resetCaseProgress(caseId), [caseId])

  // Stable and idempotent, so case apps can call it from effects on every render.
  const trigger = useCallback(
    (bugId: string) => {
      const current = getCaseProgress(caseId)
      if (current.triggered.includes(bugId)) {
        return
      }
      setCaseProgress(caseId, { ...current, triggered: [...current.triggered, bugId] })
    },
    [caseId],
  )

  return { progress, update, reset, trigger }
}
