import { useSelectedMonth } from '../hooks/useSelectedMonth'
import { formatMonthYear } from '../utils/format'
import { ChevronLeftIcon, ChevronRightIcon } from './icons'

// ‹ Octobre 2026 › : le mois est lu et écrit dans l'URL (?month=10&year=2026)
export default function MonthSelector({ className = '' }) {
  const { month, year, isCurrentMonth, goToPrevious, goToNext, goToCurrentMonth } = useSelectedMonth()

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="inline-flex items-center rounded-control border border-line bg-surface p-1">
        <button
          type="button"
          onClick={goToPrevious}
          aria-label="Mois précédent"
          className="grid size-9 place-items-center rounded-[9px] text-muted transition-colors hover:bg-background hover:text-ink"
        >
          <ChevronLeftIcon />
        </button>
        {/* aria-live : le nouveau mois est annoncé après un clic sur une flèche */}
        <p aria-live="polite" className="min-w-36 px-2 text-center text-sm font-semibold text-ink">
          {formatMonthYear(month, year)}
        </p>
        <button
          type="button"
          onClick={goToNext}
          aria-label="Mois suivant"
          className="grid size-9 place-items-center rounded-[9px] text-muted transition-colors hover:bg-background hover:text-ink"
        >
          <ChevronRightIcon />
        </button>
      </div>
      {!isCurrentMonth && (
        <button
          type="button"
          onClick={goToCurrentMonth}
          className="rounded-control px-2.5 py-2 text-sm font-semibold text-primary underline-offset-4 hover:text-primary-hover hover:underline"
        >
          Aujourd'hui
        </button>
      )}
    </div>
  )
}
