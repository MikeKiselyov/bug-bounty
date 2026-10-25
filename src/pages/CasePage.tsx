import { useCallback, useEffect, useState } from 'react'
import { BugTriggerContext } from '../lib/bugTrigger'
import { CATEGORY_LABELS } from '../lib/labels'
import { matchReport } from '../lib/matcher'
import type { MatchResult } from '../lib/matcher'
import { prefersReducedMotion } from '../lib/motion'
import { isOnboardingSeen, markOnboardingSeen } from '../lib/onboarding'
import { getCaseProgress, useCaseProgress } from '../lib/progress'
import type { CaseDefinition, Category, Severity } from '../lib/types'
import { AttemptFeed } from '../components/AttemptFeed'
import type { Attempt } from '../components/AttemptFeed'
import { BugCatalog } from '../components/BugCatalog'
import { BugPinner } from '../components/BugPinner'
import { Footer, Header } from '../components/Header'
import { BulbIcon, CrosshairIcon } from '../components/Icons'
import { LevelBadge } from '../components/LevelBadge'
import { ManualReport } from '../components/ManualReport'
import { OnboardingTour } from '../components/OnboardingTour'
import type { TourStep } from '../components/OnboardingTour'

const MAX_ATTEMPTS_SHOWN = 6

const TOUR_STEPS: TourStep[] = [
  {
    target: 'aut',
    title: 'This app is full of bugs',
    text: 'Test it like a real product: enter data, click around, try boundary values, open DevTools. The requirements are written above, and a bug is anything that breaks them.',
  },
  {
    target: 'pin',
    title: 'Found a bug? Mark it',
    text: 'Press "Mark a bug", hover over an element - it lights up - and click it. No forms to fill in.',
  },
  {
    target: null,
    title: 'Pick a category',
    text: 'The check is automatic. Typos, layout and accessibility issues only need to be noticed. Logic, validation and security bugs count only after you have reproduced them in the app, so random guessing will not work.',
    illustration: (
      <div className="tour-demo" aria-hidden="true">
        <span className="tour-demo-element mono">Field "Password"</span>
        <span className="tour-demo-question">What is wrong with it?</span>
        <span className="tour-demo-chips">
          <span className="chip chip-small chip-active">Validation</span>
          <span className="chip chip-small">UI</span>
          <span className="chip chip-small">Logic</span>
          <span className="chip chip-small">Copy</span>
        </span>
      </div>
    ),
  },
  {
    target: 'catalog',
    title: 'Catalog and hints',
    text: 'Found bugs unlock here with an explanation of why they are bugs. Stuck? Take a hint, as many as you need: each one points to the next bug you have not found. You can also peek at all the answers.',
  },
  {
    target: 'progress',
    title: 'Happy hunting',
    text: 'Your progress is saved in this browser. You can reopen this tour with the "How to play" button.',
  },
]

export function CasePage({ definition }: { definition: CaseDefinition }) {
  const { progress, update, reset, trigger } = useCaseProgress(definition.id)
  const [appKey, setAppKey] = useState(0)
  const [isPinning, setIsPinning] = useState(false)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [isTourOpen, setIsTourOpen] = useState(false)
  const [lastHintId, setLastHintId] = useState<string | null>(null)
  const App = definition.App

  useEffect(() => {
    if (isOnboardingSeen()) {
      return
    }
    const timer = window.setTimeout(() => setIsTourOpen(true), 400)
    return () => window.clearTimeout(timer)
  }, [])

  function closeTour() {
    setIsTourOpen(false)
    markOnboardingSeen()
  }

  const foundCount = progress.found.length
  const totalBugs = definition.bugs.length

  let nextHintBugId: string | null = null
  for (const bug of definition.bugs) {
    const isFound = progress.found.includes(bug.id)
    const hasHint = progress.hints.includes(bug.id)
    if (!isFound && !hasHint) {
      nextHintBugId = bug.id
      break
    }
  }
  // Hints are unlimited: one per bug, until every unfound bug has one.
  const canTakeHint = nextHintBugId !== null && !progress.answersShown

  function labelForElement(elementId: string): string {
    for (const element of definition.elements) {
      if (element.id === elementId) {
        return element.label
      }
    }
    return elementId
  }

  function evaluate(elementId: string, category: Category, severity?: Severity): MatchResult {
    // Read fresh progress: triggers may have fired after the last render.
    const current = getCaseProgress(definition.id)
    const result = matchReport({ element: elementId, category, severity }, definition.bugs, current.found, current.triggered)
    if (result.kind === 'match') {
      update({ found: [...current.found, result.bug.id] })
    }
    const attempt: Attempt = {
      id: Date.now() + Math.random(),
      elementLabel: labelForElement(elementId),
      categoryLabel: CATEGORY_LABELS[category],
      result,
    }
    setAttempts((previous) => [attempt, ...previous].slice(0, MAX_ATTEMPTS_SHOWN))
    return result
  }

  const stopPinning = useCallback(() => setIsPinning(false), [])

  function takeHint() {
    if (!canTakeHint || nextHintBugId === null) {
      return
    }
    update({ hints: [...progress.hints, nextHintBugId] })
    setLastHintId(nextHintBugId)
  }

  // On a phone the catalog is far below the Hint button, so bring the new hint into view.
  useEffect(() => {
    if (lastHintId === null) {
      return
    }
    const hintItem = document.getElementById('catalog-' + lastHintId)
    if (hintItem) {
      hintItem.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
    }
  }, [lastHintId])

  function showAnswers() {
    const confirmed = window.confirm('Reveal all bugs in this case? Bugs you found stay counted.')
    if (confirmed) {
      update({ answersShown: true })
    }
  }

  function resetCase() {
    const confirmed = window.confirm('Reset progress for this case and restart the app?')
    if (confirmed) {
      reset()
      setAttempts([])
      setAppKey(appKey + 1)
    }
  }

  const segments = []
  for (let index = 0; index < totalBugs; index++) {
    const isFilled = index < foundCount
    segments.push(<span key={index} className={'segment-bar' + (isFilled ? ' segment-bar-filled' : '')} />)
  }

  const isComplete = foundCount === totalBugs

  return (
    <>
      <Header>
        <nav className="breadcrumbs mono" aria-label="Breadcrumbs">
          <a href="#/">cases</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{definition.id}</span>
        </nav>
      </Header>

      <main>
        <section className="container case-head">
          <div className="case-head-text">
            <div className="case-head-meta">
              <span className="mono muted small">{definition.code}</span>
              <LevelBadge level={definition.level} />
            </div>
            <h1 className="case-title">{definition.title}</h1>
            <p className="case-briefing">{definition.briefing}</p>
            {definition.note ? <p className="case-note">{definition.note}</p> : null}
          </div>

          <div className="case-progress" data-tour="progress">
            <div className="case-progress-row mono">
              <span className="muted small">progress</span>
              <span className="case-progress-count">
                <span className="accent">{foundCount}</span>
                <span className="muted"> / {totalBugs}</span>
              </span>
            </div>
            <div
              className="segment-bars"
              role="progressbar"
              aria-label="Bugs found"
              aria-valuemin={0}
              aria-valuemax={totalBugs}
              aria-valuenow={foundCount}
            >
              {segments}
            </div>
            <div className="case-actions">
              <button type="button" className="btn btn-dark btn-grow" onClick={takeHint} disabled={!canTakeHint}>
                <BulbIcon />
                Hint
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setIsTourOpen(true)}>
                How to play
              </button>
              <button type="button" className="btn btn-ghost" onClick={showAnswers} disabled={progress.answersShown}>
                Answers
              </button>
              <button type="button" className="btn btn-ghost" onClick={resetCase}>
                Reset
              </button>
            </div>
          </div>
        </section>

        {isComplete ? (
          <div className="container">
            <div className="complete-banner" role="status">
              <strong>All {totalBugs} bugs found.</strong> Great work. Time for the next case.
            </div>
          </div>
        ) : null}

        <section className="container case-layout">
          <div className="case-aut">
            <div className="case-aut-head">
              <span className="eyebrow">// app under test</span>
              <button type="button" className="link-button small" onClick={() => setAppKey(appKey + 1)}>
                restart app
              </button>
            </div>
            <div className={'browser' + (isPinning ? ' browser-pinning' : '')} data-tour="aut">
              <div className="browser-bar">
                <span className="browser-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <span className="browser-url mono">{definition.url}</span>
                <button
                  type="button"
                  className={'btn btn-small pin-button' + (isPinning ? ' pin-button-active' : ' btn-primary')}
                  aria-pressed={isPinning}
                  onClick={() => setIsPinning(!isPinning)}
                  data-tour="pin"
                >
                  <CrosshairIcon />
                  {isPinning ? 'Cancel' : 'Mark a bug'}
                </button>
              </div>
              {isPinning ? (
                <div className="pin-banner">
                  <span role="status">Click or tap the buggy element</span>
                  <button type="button" className="pin-banner-cancel" onClick={() => setIsPinning(false)}>
                    Cancel <span className="pin-banner-key">Esc</span>
                  </button>
                </div>
              ) : null}
              <div className="browser-body">
                <BugTriggerContext.Provider value={trigger}>
                  <BugPinner
                    active={isPinning}
                    elements={definition.elements}
                    onSubmit={(elementId, category) => evaluate(elementId, category)}
                    onExit={stopPinning}
                  >
                    <App key={appKey} />
                  </BugPinner>
                </BugTriggerContext.Provider>
              </div>
            </div>
          </div>

          <div className="case-side">
            <span className="eyebrow">// your marks</span>
            <AttemptFeed attempts={attempts} />
            <div data-tour="catalog">
              <BugCatalog
                bugs={definition.bugs}
                foundIds={progress.found}
                hintIds={progress.hints}
                answersShown={progress.answersShown}
              />
            </div>
            <ManualReport
              elements={definition.elements}
              onSubmit={(elementId, category, severity) => evaluate(elementId, category, severity)}
            />
          </div>
        </section>
      </main>
      <Footer />
      <OnboardingTour steps={TOUR_STEPS} open={isTourOpen} onClose={closeTour} />
    </>
  )
}
