import { useId } from 'react'

/**
 * Carte blanche aux coins arrondis (18 px).
 * Avec title : la carte devient une <section> nommée par son titre (pratique pour les lecteurs d'écran).
 * action : un lien ou un bouton affiché à droite du titre ("Tout voir").
 */
export default function Card({ title, action, className = '', children }) {
  const titleId = useId()

  if (!title) {
    return <div className={`rounded-card border border-line bg-surface p-5 md:p-6 ${className}`}>{children}</div>
  }

  return (
    <section aria-labelledby={titleId} className={`rounded-card border border-line bg-surface p-5 md:p-6 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id={titleId} className="font-display text-lg font-semibold tracking-tight text-ink">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}
