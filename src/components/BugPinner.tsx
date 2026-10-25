import { useEffect, useRef, useState } from 'react'
import type { MouseEvent, PointerEvent, ReactNode } from 'react'
import { CATEGORIES, CATEGORY_LABELS } from '../lib/labels'
import type { MatchResult } from '../lib/matcher'
import type { CaseElement, Category } from '../lib/types'
import { ResultMessage } from './ResultMessage'

interface Box {
  top: number
  left: number
  width: number
  height: number
}

interface Hover {
  elementId: string
  box: Box
}

interface Selection {
  elementId: string
  box: Box
  popoverTop: number
  popoverLeft: number
  popoverWidth: number
}

interface Toast {
  result: MatchResult
  id: number
}

// A touch swipe in pin mode lands on the overlay, so horizontal scrolling is done by hand.
interface TouchPan {
  startX: number
  startY: number
  scroller: HTMLElement | null
  startScrollLeft: number
  moved: boolean
}

interface BugPinnerProps {
  active: boolean
  elements: CaseElement[]
  onSubmit: (elementId: string, category: Category) => MatchResult
  onExit: () => void
  children: ReactNode
}

const POPOVER_HEIGHT = 270
const TAP_SLOP_PX = 10
const POPOVER_MAX_WIDTH = 330
const TOAST_DURATION_MS = 5000

export function BugPinner({ active, elements, onSubmit, onExit, children }: BugPinnerProps) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const firstChipRef = useRef<HTMLButtonElement>(null)
  const [hover, setHover] = useState<Hover | null>(null)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const touchPanRef = useRef<TouchPan | null>(null)

  useEffect(() => {
    if (!active) {
      setHover(null)
      setSelection(null)
    }
  }, [active])

  useEffect(() => {
    if (!active) {
      return
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return
      }
      if (selection) {
        setSelection(null)
      } else {
        onExit()
      }
    }
    function handleScroll() {
      setHover(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [active, selection, onExit])

  useEffect(() => {
    if (selection && firstChipRef.current) {
      firstChipRef.current.focus()
    }
  }, [selection])

  useEffect(() => {
    if (!toast) {
      return
    }
    const timer = window.setTimeout(() => setToast(null), TOAST_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [toast])

  function labelFor(elementId: string): string {
    for (const element of elements) {
      if (element.id === elementId) {
        return element.label
      }
    }
    return elementId
  }

  function findMarkedElement(clientX: number, clientY: number): HTMLElement | null {
    const body = bodyRef.current
    if (!body) {
      return null
    }
    const stack = document.elementsFromPoint(clientX, clientY)
    for (const candidate of stack) {
      if (candidate === overlayRef.current) {
        continue
      }
      if (!body.contains(candidate)) {
        continue
      }
      const marked = candidate.closest('[data-bh]')
      if (marked instanceof HTMLElement && body.contains(marked)) {
        return marked
      }
    }
    return null
  }

  function findHorizontalScroller(clientX: number, clientY: number): HTMLElement | null {
    const body = bodyRef.current
    if (!body) {
      return null
    }
    const stack = document.elementsFromPoint(clientX, clientY)
    for (const candidate of stack) {
      if (candidate === overlayRef.current || !body.contains(candidate)) {
        continue
      }
      let current: HTMLElement | null = candidate instanceof HTMLElement ? candidate : null
      while (current && current !== body) {
        const overflowX = window.getComputedStyle(current).overflowX
        const canScroll = overflowX === 'auto' || overflowX === 'scroll'
        if (canScroll && current.scrollWidth > current.clientWidth) {
          return current
        }
        current = current.parentElement
      }
      return null
    }
    return null
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'touch') {
      touchPanRef.current = null
      return
    }
    const scroller = findHorizontalScroller(event.clientX, event.clientY)
    let startScrollLeft = 0
    if (scroller) {
      startScrollLeft = scroller.scrollLeft
    }
    touchPanRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      scroller,
      startScrollLeft,
      moved: false,
    }
  }

  function boxFor(element: HTMLElement): Box {
    const body = bodyRef.current
    const elementRect = element.getBoundingClientRect()
    if (!body) {
      return { top: 0, left: 0, width: elementRect.width, height: elementRect.height }
    }
    const bodyRect = body.getBoundingClientRect()
    return {
      top: elementRect.top - bodyRect.top,
      left: elementRect.left - bodyRect.left,
      width: elementRect.width,
      height: elementRect.height,
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const touchPan = touchPanRef.current
    if (touchPan && event.pointerType === 'touch') {
      const deltaX = event.clientX - touchPan.startX
      const deltaY = event.clientY - touchPan.startY
      if (Math.abs(deltaX) > TAP_SLOP_PX || Math.abs(deltaY) > TAP_SLOP_PX) {
        touchPan.moved = true
      }
      if (touchPan.scroller) {
        touchPan.scroller.scrollLeft = touchPan.startScrollLeft - deltaX
      }
      return
    }
    if (selection) {
      return
    }
    const marked = findMarkedElement(event.clientX, event.clientY)
    if (!marked || !marked.dataset.bh) {
      setHover(null)
      return
    }
    setHover({ elementId: marked.dataset.bh, box: boxFor(marked) })
  }

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    const touchPan = touchPanRef.current
    touchPanRef.current = null
    if (touchPan && touchPan.moved) {
      return
    }
    const body = bodyRef.current
    const marked = findMarkedElement(event.clientX, event.clientY)
    if (!body || !marked || !marked.dataset.bh) {
      setSelection(null)
      return
    }
    const bodyRect = body.getBoundingClientRect()
    const pointX = event.clientX - bodyRect.left
    const pointY = event.clientY - bodyRect.top
    const popoverWidth = Math.min(POPOVER_MAX_WIDTH, bodyRect.width - 16)

    let popoverLeft = pointX - popoverWidth / 2
    popoverLeft = Math.max(8, Math.min(popoverLeft, bodyRect.width - popoverWidth - 8))

    let popoverTop = pointY + 16
    if (popoverTop + POPOVER_HEIGHT > bodyRect.height - 8) {
      popoverTop = pointY - POPOVER_HEIGHT - 16
    }
    popoverTop = Math.max(8, popoverTop)

    setHover(null)
    setSelection({
      elementId: marked.dataset.bh,
      box: boxFor(marked),
      popoverTop,
      popoverLeft,
      popoverWidth,
    })
  }

  function chooseCategory(category: Category) {
    if (!selection) {
      return
    }
    const result = onSubmit(selection.elementId, category)
    setToast({ result, id: Date.now() })
    setSelection(null)
    onExit()
  }

  return (
    <div className="pinner" ref={bodyRef}>
      {children}

      {active ? (
        <div
          ref={overlayRef}
          className="pin-overlay"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHover(null)}
          onClick={handleClick}
          aria-hidden="true"
        />
      ) : null}

      {hover && !selection ? (
        <div className="pin-highlight" style={hover.box} aria-hidden="true">
          <span className="pin-label">{labelFor(hover.elementId)}</span>
        </div>
      ) : null}

      {selection ? (
        <>
          <div className="pin-highlight pin-highlight-selected" style={selection.box} aria-hidden="true" />
          <div
            className="pin-popover"
            role="dialog"
            aria-label="Bug category"
            style={{ top: selection.popoverTop, left: selection.popoverLeft, width: selection.popoverWidth }}
          >
            <span className="pin-popover-element mono">{labelFor(selection.elementId)}</span>
            <span className="pin-popover-question">What is wrong with it?</span>
            <div className="chip-group">
              {CATEGORIES.map((category, index) => (
                <button
                  key={category}
                  ref={index === 0 ? firstChipRef : undefined}
                  type="button"
                  className="chip chip-small"
                  onClick={() => chooseCategory(category)}
                >
                  {CATEGORY_LABELS[category]}
                </button>
              ))}
            </div>
            <button type="button" className="link-button small" onClick={() => setSelection(null)}>
              pick another element
            </button>
          </div>
        </>
      ) : null}

      {toast ? (
        <div className="pin-toast" role="status" key={toast.id}>
          <ResultMessage result={toast.result} compact />
        </div>
      ) : null}
    </div>
  )
}
