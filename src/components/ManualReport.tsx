import { useState } from 'react'
import type { FormEvent } from 'react'
import { CATEGORIES, CATEGORY_LABELS, SEVERITIES, SEVERITY_LABELS } from '../lib/labels'
import type { MatchResult } from '../lib/matcher'
import type { CaseElement, Category, Severity } from '../lib/types'
import { ResultMessage } from './ResultMessage'

interface ManualReportProps {
  elements: CaseElement[]
  onSubmit: (elementId: string, category: Category, severity: Severity) => MatchResult
}

// Keyboard-friendly alternative to pin mode, and a place to practise full reports.
export function ManualReport({ elements, onSubmit }: ManualReportProps) {
  const [element, setElement] = useState('')
  const [category, setCategory] = useState<Category | null>(null)
  const [severity, setSeverity] = useState<Severity>('major')
  const [steps, setSteps] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [result, setResult] = useState<MatchResult | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (element === '' || category === null) {
      setFormError('Pick an element and a category.')
      setResult(null)
      return
    }
    setFormError(null)
    const matchResult = onSubmit(element, category, severity)
    setResult(matchResult)
    if (matchResult.kind === 'match') {
      setSteps('')
    }
  }

  return (
    <details className="panel manual">
      <summary className="manual-summary">Full report or keyboard only</summary>
      <form className="report" onSubmit={handleSubmit} noValidate>
        <div className="report-field">
          <label htmlFor="report-element" className="field-label">
            element
          </label>
          <select id="report-element" className="dark-input" value={element} onChange={(event) => setElement(event.target.value)}>
            <option value="">Pick an element...</option>
            {elements.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="report-field">
          <legend className="field-label">category</legend>
          <div className="chip-group">
            {CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                className={'chip chip-small' + (category === item ? ' chip-active' : '')}
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {CATEGORY_LABELS[item]}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="report-field">
          <legend className="field-label">severity</legend>
          <div className="segmented">
            {SEVERITIES.map((item) => (
              <button
                key={item}
                type="button"
                className={'segment' + (severity === item ? ' segment-active severity-bg-' + item : '')}
                aria-pressed={severity === item}
                onClick={() => setSeverity(item)}
              >
                {SEVERITY_LABELS[item]}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="report-field">
          <label htmlFor="report-steps" className="field-label">
            steps · expected · actual (for practice)
          </label>
          <textarea
            id="report-steps"
            className="dark-input mono"
            rows={4}
            placeholder={'1. ...\n2. ...\nExpected: ...\nActual: ...'}
            value={steps}
            onChange={(event) => setSteps(event.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block">
          Submit report
        </button>

        <div aria-live="polite">
          {formError ? <div className="feedback feedback-warn">{formError}</div> : null}
          {result ? <ResultMessage result={result} /> : null}
        </div>
      </form>
    </details>
  )
}
