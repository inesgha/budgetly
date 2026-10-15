import { TrendUpIcon } from './icons'

// Carré violet arrondi avec la courbe montante, suivi du nom (sauf si showName = false)
export default function Logo({ tone = 'dark', showName = true, className = '' }) {
  const nameColor = tone === 'light' ? 'text-white' : 'text-ink'

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-primary text-white">
        <TrendUpIcon className="size-5" strokeWidth={2.25} />
      </span>
      {showName ? (
        <span className={`font-display text-xl font-bold tracking-tight ${nameColor}`}>Budgetly</span>
      ) : (
        <span className="sr-only">Budgetly</span>
      )}
    </span>
  )
}
