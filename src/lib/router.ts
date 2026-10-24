import { useEffect, useState } from 'react'

export type Route = { name: 'home' } | { name: 'case'; caseId: string } | { name: 'not-found' }

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '')
  if (path === '' || path === '/') {
    return { name: 'home' }
  }
  const caseMatch = path.match(/^\/case\/([a-z0-9-]+)\/?$/)
  if (caseMatch) {
    return { name: 'case', caseId: caseMatch[1] }
  }
  return { name: 'not-found' }
}

export function caseHref(caseId: string): string {
  return '#/case/' + caseId
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))

  useEffect(() => {
    function handleHashChange() {
      setRoute(parseHash(window.location.hash))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return route
}
