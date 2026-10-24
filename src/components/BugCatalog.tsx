import { CATEGORY_LABELS, SEVERITY_LABELS } from '../lib/labels'
import type { Bug } from '../lib/types'
import { BulbIcon, LockIcon } from './Icons'

interface BugCatalogProps {
  bugs: Bug[]
  foundIds: string[]
  hintIds: string[]
  answersShown: boolean
}

export function BugCatalog({ bugs, foundIds, hintIds, answersShown }: BugCatalogProps) {
  return (
    <section className="panel catalog" aria-labelledby="catalog-title">
      <div className="catalog-head">
        <h2 id="catalog-title">Bug catalog</h2>
        <span className="mono muted">
          {foundIds.length} / {bugs.length}
        </span>
      </div>
      <ul className="catalog-list">
        {bugs.map((bug) => {
          const isFound = foundIds.includes(bug.id)
          const hasHint = hintIds.includes(bug.id)

          if (isFound || answersShown) {
            return (
              <li key={bug.id} className={'catalog-item' + (isFound ? '' : ' catalog-item-revealed')}>
                <span className={'catalog-id' + (isFound ? ' catalog-id-found' : '')}>{bug.id}</span>
                <details className="catalog-details">
                  <summary>
                    <span className="catalog-title">{bug.title}</span>
                    <span className="catalog-meta">
                      <span className="tag">{CATEGORY_LABELS[bug.category]}</span>
                      <span className={'severity-tag severity-' + bug.severity}>{SEVERITY_LABELS[bug.severity]}</span>
                    </span>
                  </summary>
                  <p>{bug.explanation}</p>
                  {isFound ? null : <p className="muted">Not found by you, revealed from the answers.</p>}
                </details>
              </li>
            )
          }

          return (
            <li key={bug.id} className="catalog-item">
              <span className="catalog-id">{bug.id}</span>
              {hasHint ? (
                <span className="catalog-hint">
                  <BulbIcon />
                  {bug.hint}
                </span>
              ) : (
                <span className="catalog-locked">
                  <span className="sr-only">Not found yet</span>
                  <span className="skeleton skeleton-long" aria-hidden="true" />
                  <span className="skeleton skeleton-short" aria-hidden="true" />
                </span>
              )}
              <span className="catalog-lock">
                <LockIcon />
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
