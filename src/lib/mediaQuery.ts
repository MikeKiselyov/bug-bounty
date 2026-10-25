import { useEffect, useState } from 'react'

function matchesNow(query: string): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false
  }
  return window.matchMedia(query).matches
}

// True while the viewport matches the media query. Used by detectors of responsive bugs,
// the query must be the same as in the case CSS.
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => matchesNow(query))

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    function handleChange() {
      setMatches(mediaQuery.matches)
    }
    handleChange()
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [query])

  return matches
}
