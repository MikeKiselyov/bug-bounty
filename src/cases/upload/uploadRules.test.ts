import { describe, expect, it } from 'vitest'
import { formatSize, hasAllowedExtension, isTooLarge, nextProgress } from './uploadRules'

// These tests pin the planted bugs: if one fails, a refactoring has "fixed" a bug by accident.
describe('upload planted bugs', () => {
  it('UPL-03: a 50 MB file passes the 10 MB limit', () => {
    expect(isTooLarge(50 * 1024 * 1024)).toBe(false)
  })

  it('UPL-04: an upper-case extension is rejected', () => {
    expect(hasAllowedExtension('report.pdf')).toBe(true)
    expect(hasAllowedExtension('REPORT.PDF')).toBe(false)
  })

  it('UPL-06: megabytes are labelled as kilobytes', () => {
    expect(formatSize(3 * 1024 * 1024)).toBe('3.0 KB')
  })

  it('UPL-07: progress overshoots 100', () => {
    let progress = 0
    while (progress < 100) {
      progress = nextProgress(progress)
    }
    expect(progress).toBe(105)
  })
})
