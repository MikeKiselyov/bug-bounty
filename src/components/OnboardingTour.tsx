import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { prefersReducedMotion } from '../lib/motion'

export interface TourStep {
  // Value of a data-tour attribute on the page; null shows the step centered.
  target: string | null
  title: string
  text: string
  illustration?: ReactNode
}

interface OnboardingTourProps {
  steps: TourStep[]
  open: boolean
  onClose: () => void
}

interface Size {
  width: number
  height: number
}

const MARGIN = 16
const GAP = 16
const SPOTLIGHT_PADDING = 8
const NARROW_SCREEN = 760

function clamp(value: number, min: number, max: number): number {
  if (max < min) {
    return min
  }
  return Math.min(Math.max(value, min), max)
}

function placeCard(rect: DOMRect | null, card: Size): { top: number; left: number } {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  if (!rect) {
    return {
      top: Math.max(MARGIN, (viewportHeight - card.height) / 2),
      left: Math.max(MARGIN, (viewportWidth - card.width) / 2),
    }
  }

  if (viewportWidth < NARROW_SCREEN) {
    return { top: viewportHeight - card.height - MARGIN, left: MARGIN }
  }

  const alignedTop = clamp(Math.max(rect.top, MARGIN), MARGIN, viewportHeight - card.height - MARGIN)

  if (rect.right + GAP + card.width <= viewportWidth - MARGIN) {
    return { top: alignedTop, left: rect.right + GAP }
  }
  if (rect.left - GAP - card.width >= MARGIN) {
    return { top: alignedTop, left: rect.left - GAP - card.width }
  }

  const left = clamp(rect.left, MARGIN, viewportWidth - card.width - MARGIN)
  if (rect.bottom + GAP + card.height <= viewportHeight - MARGIN) {
    return { top: rect.bottom + GAP, left }
  }
  if (rect.top - GAP - card.height >= MARGIN) {
    return { top: rect.top - GAP - card.height, left }
  }
  return { top: viewportHeight - card.height - MARGIN, left }
}

export function OnboardingTour({ steps, open, onClose }: OnboardingTourProps) {
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [cardSize, setCardSize] = useState<Size>({ width: 380, height: 260 })
  const cardRef = useRef<HTMLDivElement>(null)
  const primaryRef = useRef<HTMLButtonElement>(null)

  const step = steps[index]
  const isLast = index === steps.length - 1
  const targetName = step.target

  useEffect(() => {
    if (open) {
      setIndex(0)
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }
    let target: Element | null = null
    if (targetName) {
      target = document.querySelector('[data-tour="' + targetName + '"]')
    }
    if (!target) {
      setRect(null)
      return
    }
    const targetElement = target
    // On a phone the card sits at the bottom, so the target goes to the top instead of the center.
    let scrollBlock: ScrollLogicalPosition = 'center'
    if (window.innerWidth < NARROW_SCREEN) {
      scrollBlock = 'start'
    }
    targetElement.scrollIntoView({ block: scrollBlock, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })

    function measure() {
      setRect(targetElement.getBoundingClientRect())
    }
    measure()
    const settleTimer = window.setTimeout(measure, 450)
    window.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)
    return () => {
      window.clearTimeout(settleTimer)
      window.removeEventListener('scroll', measure, true)
      window.removeEventListener('resize', measure)
    }
  }, [open, targetName])

  useLayoutEffect(() => {
    const card = cardRef.current
    if (!card) {
      return
    }
    const width = card.offsetWidth
    const height = card.offsetHeight
    if (width !== cardSize.width || height !== cardSize.height) {
      setCardSize({ width, height })
    }
  })

  useEffect(() => {
    if (open && primaryRef.current) {
      primaryRef.current.focus()
    }
  }, [open, index])

  useEffect(() => {
    if (!open) {
      return
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'ArrowRight') {
        goNext()
      } else if (event.key === 'ArrowLeft') {
        goBack()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  function goNext() {
    if (isLast) {
      onClose()
    } else {
      setIndex(index + 1)
    }
  }

  function goBack() {
    if (index > 0) {
      setIndex(index - 1)
    }
  }

  if (!open) {
    return null
  }

  const position = placeCard(rect, cardSize)
  const isNarrow = window.innerWidth < NARROW_SCREEN

  const dots = []
  for (let dotIndex = 0; dotIndex < steps.length; dotIndex++) {
    dots.push(<span key={dotIndex} className={'tour-dot' + (dotIndex === index ? ' tour-dot-active' : '')} />)
  }

  return createPortal(
    <div className="tour-root">
      <div className={'tour-backdrop' + (rect ? '' : ' tour-backdrop-dim')} />
      {rect ? (
        <div
          className="tour-spotlight"
          style={{
            top: rect.top - SPOTLIGHT_PADDING,
            left: rect.left - SPOTLIGHT_PADDING,
            width: rect.width + SPOTLIGHT_PADDING * 2,
            height: rect.height + SPOTLIGHT_PADDING * 2,
          }}
        />
      ) : null}
      <div
        ref={cardRef}
        className="tour-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-text"
        style={isNarrow ? { left: MARGIN, right: MARGIN, bottom: MARGIN } : { top: position.top, left: position.left }}
      >
        <span className="tour-counter mono">
          {index + 1} / {steps.length}
        </span>
        <h2 id="tour-title" className="tour-title">
          {step.title}
        </h2>
        <p id="tour-text" className="tour-text">
          {step.text}
        </p>
        {step.illustration ? <div className="tour-illustration">{step.illustration}</div> : null}
        <div className="tour-footer">
          <div className="tour-dots" aria-hidden="true">
            {dots}
          </div>
          <div className="tour-buttons">
            {isLast ? null : (
              <button type="button" className="link-button small" onClick={onClose}>
                skip
              </button>
            )}
            {index > 0 ? (
              <button type="button" className="btn btn-ghost btn-small" onClick={goBack}>
                Back
              </button>
            ) : null}
            <button ref={primaryRef} type="button" className="btn btn-primary btn-small" onClick={goNext}>
              {isLast ? 'Start hunting' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
