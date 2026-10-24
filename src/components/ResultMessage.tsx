import { SEVERITY_LABELS } from '../lib/labels'
import type { MatchResult } from '../lib/matcher'
import { ISSUES_URL } from '../config'
import { CheckIcon } from './Icons'

export type ResultTone = 'ok' | 'info' | 'warn' | 'miss'

export function resultTone(result: MatchResult): ResultTone {
  if (result.kind === 'match') return 'ok'
  if (result.kind === 'duplicate') return 'info'
  if (result.kind === 'miss') return 'miss'
  return 'warn'
}

export function resultTitle(result: MatchResult): string {
  if (result.kind === 'match') return 'Found ' + result.bug.id
  if (result.kind === 'duplicate') return 'Already found'
  if (result.kind === 'not-reproduced') return 'Reproduce it first'
  if (result.kind === 'close') return 'Getting warm'
  return 'Miss'
}

export function ResultMessage({ result, compact = false }: { result: MatchResult; compact?: boolean }) {
  const tone = resultTone(result)
  let text = ''
  let note: string | null = null

  if (result.kind === 'match') {
    text = result.bug.title
    if (result.severityMatches === false) {
      note = 'The catalog rates it ' + SEVERITY_LABELS[result.bug.severity] + '.'
    }
  } else if (result.kind === 'duplicate') {
    text = result.bug.id + ': ' + result.bug.title
  } else if (result.kind === 'not-reproduced') {
    text = 'Good guess, but this bug has to be seen in action. Reproduce it in the app and mark it again.'
  } else if (result.kind === 'close') {
    text = 'This element has an unfound bug, but in a different category.'
  } else {
    text = 'No such bug here. Try another category or another element.'
  }

  return (
    <div className={'feedback feedback-' + tone + (compact ? ' feedback-compact' : '')}>
      {tone === 'ok' ? (
        <span className="feedback-icon">
          <CheckIcon size={20} />
        </span>
      ) : null}
      <div>
        <strong>{resultTitle(result)}</strong>
        <p>{text}</p>
        {note ? <p className="muted">{note}</p> : null}
        {result.kind === 'miss' && !compact ? (
          <p className="muted">
            Sure it is a bug?{' '}
            <a href={ISSUES_URL} target="_blank" rel="noreferrer">
              Open an issue
            </a>
            , it might be in the playground itself.
          </p>
        ) : null}
      </div>
    </div>
  )
}
