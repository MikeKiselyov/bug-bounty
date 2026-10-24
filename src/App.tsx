import { findCase } from './cases'
import { useRoute } from './lib/router'
import { Footer, Header } from './components/Header'
import { CasePage } from './pages/CasePage'
import { HomePage } from './pages/HomePage'

function NotFound() {
  return (
    <>
      <Header />
      <main className="container not-found">
        <span className="eyebrow">// 404</span>
        <h1 className="case-title">Page not found</h1>
        <p className="case-briefing">This is not a planted bug. Probably.</p>
        <a href="#/" className="btn btn-primary">
          Back to cases
        </a>
      </main>
      <Footer />
    </>
  )
}

export function App() {
  const route = useRoute()

  if (route.name === 'case') {
    const definition = findCase(route.caseId)
    if (definition) {
      return <CasePage key={definition.id} definition={definition} />
    }
    return <NotFound />
  }
  if (route.name === 'home') {
    return <HomePage />
  }
  return <NotFound />
}
