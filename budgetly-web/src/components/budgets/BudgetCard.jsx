import { useId } from 'react'
import { formatAmount, formatDT } from '../../utils/format'
import { PencilIcon, TrashIcon } from '../icons'
import Button from '../ui/Button'
import { getBudgetStatus } from './budgetStatus'

// Carte d'un budget : catégorie, statut, dépensé / limite, barre de progression et phrase d'aide
export default function BudgetCard({ budget, onEdit, onDelete }) {
  const titleId = useId()
  const status = getBudgetStatus(budget.status)
  const { categoryName, categoryColor, spent, limit, remaining, percent } = budget

  let helpText = `Encore ${formatDT(remaining)} disponibles`
  if (remaining < 0) helpText = `Dépassé de ${formatDT(-remaining)}`
  else if (remaining === 0) helpText = 'Budget entièrement utilisé'

  return (
    <article aria-labelledby={titleId} className="flex flex-col rounded-card border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ backgroundColor: categoryColor }} />
          <h2 id={titleId} className="truncate font-display text-base font-semibold text-ink">
            {categoryName}
          </h2>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${status.badge}`}>
          {status.label(percent)}
        </span>
      </div>

      <p className="mt-4 flex flex-wrap items-baseline gap-x-1.5">
        <span className="font-display text-2xl font-bold tracking-tight text-ink tabular-nums">{formatAmount(spent)}</span>
        <span className="text-sm text-muted tabular-nums">/ {formatDT(limit)}</span>
      </p>

      {/* Barre plafonnée visuellement à 100 % ; les valeurs exactes sont écrites en texte juste au-dessus */}
      <div aria-hidden="true" className="mt-3 h-2 overflow-hidden rounded-full bg-background">
        <div className={`h-full rounded-full ${status.bar}`} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>

      <p className={`mt-2 text-sm ${remaining < 0 ? 'font-medium text-danger' : 'text-muted'}`}>{helpText}</p>

      <div className="mt-4 flex justify-end gap-1 border-t border-line pt-3">
        <Button
          variant="ghost"
          size="sm"
          icon={PencilIcon}
          onClick={() => onEdit(budget)}
          aria-label={`Modifier le budget ${categoryName}`}
        >
          Modifier
        </Button>
        <Button
          variant="danger-ghost"
          size="sm"
          icon={TrashIcon}
          onClick={() => onDelete(budget)}
          aria-label={`Supprimer le budget ${categoryName}`}
        >
          Supprimer
        </Button>
      </div>
    </article>
  )
}
