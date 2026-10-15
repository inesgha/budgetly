import { useDocumentTitle } from '../hooks/useDocumentTitle'

// Page temporaire en attendant la vraie fonctionnalité
export default function PlaceholderPage({ title }) {
  useDocumentTitle(title)

  return (
    <section>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">{title}</h1>
      <div className="mt-6 rounded-card border border-line bg-surface px-6 py-12 text-center">
        <p className="font-display text-lg font-semibold text-ink">Bientôt disponible</p>
      </div>
    </section>
  )
}
