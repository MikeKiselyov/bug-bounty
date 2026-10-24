import type { ReactNode } from 'react'
import { REPO_URL } from '../config'
import { CASES, countAllBugs } from '../cases'
import { useProgress } from '../lib/progress'
import { BugIcon, GithubIcon } from './Icons'

export function Header({ children }: { children?: ReactNode }) {
  const progress = useProgress()
  let totalFound = 0
  for (const definition of CASES) {
    const caseProgress = progress[definition.id]
    if (caseProgress && caseProgress.found) {
      totalFound = totalFound + caseProgress.found.length
    }
  }

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <a href="#/" className="logo" aria-label="bug/hunt, home">
          <span className="logo-mark">
            <BugIcon />
          </span>
          <span className="logo-text">
            bug<span className="accent">/</span>hunt
          </span>
        </a>
        <div className="site-header-right">
          {children}
          <span className="score-pill">
            your score <strong>{totalFound}</strong> / {countAllBugs()}
          </span>
          <a href={REPO_URL} className="btn btn-dark" target="_blank" rel="noreferrer">
            <GithubIcon />
            GitHub
          </a>
        </div>
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <span>bug/hunt · open source · MIT</span>
        <span>Made by QA, for QA</span>
      </div>
    </footer>
  )
}
