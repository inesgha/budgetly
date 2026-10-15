import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function NotFoundPage() {
  useDocumentTitle('Page introuvable')

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 py-12">
      <div className="max-w-md text-center">
        <Logo />
        <p className="mt-10 font-display text-6xl font-bold tracking-tight text-primary">404</p>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink">Page introuvable</h1>
        <p className="mt-2 text-muted">La page que tu cherches n'existe pas ou a été déplacée.</p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center justify-center rounded-control bg-primary px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Retour à l'accueil
        </Link>
      </div>
    </main>
  )
}
