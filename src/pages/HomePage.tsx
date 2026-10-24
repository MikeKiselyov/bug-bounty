import { useState } from 'react'
import { CASES, UPCOMING_CASES, countAllBugs } from '../cases'
import { REPO_URL } from '../config'
import { useProgress } from '../lib/progress'
import { caseHref } from '../lib/router'
import type { Level } from '../lib/types'
import { Footer, Header } from '../components/Header'
import { ArrowIcon, BugIcon, CheckIcon, LockIcon } from '../components/Icons'
import { LevelBadge } from '../components/LevelBadge'

type LevelFilter = 'all' | Level

const FILTERS: { value: LevelFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'junior', label: 'Junior' },
  { value: 'middle', label: 'Middle' },
  { value: 'senior', label: 'Senior' },
]

function scrollToSection(sectionId: string) {
  const section = document.getElementById(sectionId)
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

export function HomePage() {
  const [filter, setFilter] = useState<LevelFilter>('all')
  const progress = useProgress()
  const firstCase = CASES[0]

  const visibleCases = CASES.filter((definition) => filter === 'all' || definition.level === filter)
  const visibleUpcoming = UPCOMING_CASES.filter((upcoming) => filter === 'all' || upcoming.level === filter)

  return (
    <>
      <Header>
        <nav className="main-nav" aria-label="Sections">
          <button type="button" className="link-button" onClick={() => scrollToSection('cases')}>
            Cases
          </button>
          <button type="button" className="link-button" onClick={() => scrollToSection('how')}>
            How to play
          </button>
          <button type="button" className="link-button" onClick={() => scrollToSection('contribute')}>
            Add a case
          </button>
        </nav>
      </Header>

      <main>
        <section className="container hero">
          <div className="hero-text">
            <span className="eyebrow-tag">OPEN SOURCE PLAYGROUND FOR QA</span>
            <h1 className="hero-title">
              Everything here is broken.
              <br />
              <span className="hero-title-accent">On purpose.</span>
            </h1>
            <p className="hero-lead">
              Small apps with intentionally planted bugs: forms, carts, tables. Hunt them down, mark them in two clicks
              and see how many you missed.
            </p>
            <div className="hero-actions">
              <a href={caseHref(firstCase.id)} className="btn btn-primary btn-lg">
                Start hunting
                <ArrowIcon />
              </a>
              <button type="button" className="btn btn-outline btn-lg" onClick={() => scrollToSection('how')}>
                How it works
              </button>
            </div>
            <dl className="hero-stats">
              <div>
                <dt>cases</dt>
                <dd>{CASES.length}</dd>
              </div>
              <div>
                <dt>hidden bugs</dt>
                <dd className="stat-orange">{countAllBugs()}</dd>
              </div>
              <div>
                <dt>difficulty levels</dt>
                <dd>3</dd>
              </div>
            </dl>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hero-card-back" />
            <div className="hero-card">
              <div className="hero-card-top">
                <span>REG-04 · CASE-01</span>
                <span className="severity-tag severity-major">MAJOR</span>
              </div>
              <div className="hero-card-title">A 3-character password passes validation</div>
              <div className="hero-card-steps">
                <span>1. Open the sign-up form</span>
                <span>
                  2. Enter the password <span className="text-strong">abc</span>
                </span>
                <span>3. Press "Create account"</span>
              </div>
              <div className="hero-card-grid">
                <div>
                  <span className="muted">expected</span>
                  <span>error "min 8"</span>
                </div>
                <div>
                  <span className="muted">actual</span>
                  <span className="text-orange">account created</span>
                </div>
              </div>
              <div className="hero-card-match">
                <CheckIcon />
                Verified automatically · +1 bug
              </div>
            </div>
          </div>
        </section>

        <section id="cases" className="container section">
          <div className="section-head">
            <div>
              <span className="eyebrow">// cases</span>
              <h2 className="section-title">Pick what to break</h2>
            </div>
            <div className="chip-group" role="group" aria-label="Filter by level">
              {FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={'chip' + (filter === item.value ? ' chip-active-light' : '')}
                  aria-pressed={filter === item.value}
                  onClick={() => setFilter(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="case-grid">
            {visibleCases.map((definition) => {
              const caseProgress = progress[definition.id]
              let foundCount = 0
              if (caseProgress && caseProgress.found) {
                foundCount = caseProgress.found.length
              }
              const percent = Math.round((foundCount / definition.bugs.length) * 100)
              return (
                <a key={definition.id} href={caseHref(definition.id)} className="case-card">
                  <div className="case-card-top">
                    <span className="mono muted small">{definition.code}</span>
                    <LevelBadge level={definition.level} />
                  </div>
                  <div className="case-card-body">
                    <span className="case-card-title">{definition.title}</span>
                    <span className="case-card-desc">{definition.description}</span>
                  </div>
                  <div className="tag-list">
                    {definition.tags.map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="case-card-progress">
                    <div className="case-card-progress-row">
                      <span className="text-orange case-card-bugs">
                        <BugIcon size={15} />
                        {definition.bugs.length} bugs
                      </span>
                      <span className="muted">
                        found <span className="text-strong">{foundCount}</span>
                      </span>
                    </div>
                    <div className="bar" aria-hidden="true">
                      <div className={'bar-fill bar-' + definition.level} style={{ width: percent + '%' }} />
                    </div>
                  </div>
                </a>
              )
            })}

            {visibleUpcoming.map((upcoming) => (
              <div key={upcoming.code} className="case-card case-card-locked">
                <div className="case-card-top">
                  <span className="mono muted small">{upcoming.code}</span>
                  <LevelBadge level={upcoming.level} />
                </div>
                <div className="case-card-body">
                  <span className="case-card-title">{upcoming.title}</span>
                  <span className="case-card-desc">{upcoming.description}</span>
                </div>
                <div className="tag-list">
                  {upcoming.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="case-card-soon">
                  <LockIcon />
                  Coming soon · PRs welcome
                </span>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="band">
          <div className="container section">
            <div>
              <span className="eyebrow">// how to play</span>
              <h2 className="section-title">Three steps, just like at work</h2>
            </div>
            <ol className="steps">
              <li className="step">
                <span className="step-number">01</span>
                <span className="step-title">Explore</span>
                <span className="step-text">
                  Open a case and test it as usual: boundary values, empty fields, double clicks, DevTools.
                </span>
              </li>
              <li className="step">
                <span className="step-number">02</span>
                <span className="step-title">Mark</span>
                <span className="step-text">
                  Press "Mark a bug", click the element and pick a category. No forms.
                </span>
              </li>
              <li className="step">
                <span className="step-number">03</span>
                <span className="step-title">Verified</span>
                <span className="step-text">
                  The check is automatic. Logic and validation bugs must be reproduced first, guessing will not work.
                </span>
              </li>
            </ol>
          </div>
        </section>

        <section id="contribute" className="container section">
          <div className="contribute">
            <div className="contribute-text">
              <h2>Know a bug that everyone misses?</h2>
              <p>
                Add your own case: a component plus a JSON bug catalog. One pull request, and the whole community hunts it.
              </p>
              <a href={REPO_URL + '/blob/main/CONTRIBUTING.md'} className="btn btn-black" target="_blank" rel="noreferrer">
                How to add a case
                <ArrowIcon />
              </a>
            </div>
            <pre className="contribute-code">{`{ "id": "REG-04",
  "element": "password",
  "category": "validation",
  "severity": "major",
  "title": "A 3-character password..." }`}</pre>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
