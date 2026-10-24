import type { MatchResult } from '../lib/matcher'
import { resultTitle, resultTone } from './ResultMessage'

export interface Attempt {
  id: number
  elementLabel: string
  categoryLabel: string
  result: MatchResult
}

export function AttemptFeed({ attempts }: { attempts: Attempt[] }) {
  if (attempts.length === 0) {
    return (
      <div className="panel feed feed-empty">
        <span className="feed-empty-title">Nothing marked yet</span>
        <ol className="feed-steps">
          <li>Press "Mark a bug" above the app</li>
          <li>Click the element where the bug lives</li>
          <li>Pick a category - the check is automatic</li>
        </ol>
      </div>
    )
  }

  return (
    <section className="panel feed" aria-labelledby="feed-title">
      <h2 id="feed-title" className="feed-title">
        Your marks
      </h2>
      <ul className="feed-list">
        {attempts.map((attempt) => (
          <li key={attempt.id} className="feed-item">
            <span className={'feed-dot feed-dot-' + resultTone(attempt.result)} aria-hidden="true" />
            <div className="feed-text">
              <span className="feed-result">{resultTitle(attempt.result)}</span>
              <span className="feed-meta">
                {attempt.elementLabel} · {attempt.categoryLabel}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
