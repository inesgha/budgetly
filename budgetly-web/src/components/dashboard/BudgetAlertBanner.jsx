import { Link } from 'react-router-dom'
import { formatDT } from '../../utils/format'
import { AlertTriangleIcon } from '../icons'

// Bandeau rouge pour chaque budget dépassé du mois
export default function BudgetAlertBanner({ budgets, search }) {
  const exceeded = (budgets ?? []).filter((budget) => budget.status === 'exceeded')

  if (exceeded.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {exceeded.map((budget) => (
        <div
          key={budget.id}
          className="flex items-start gap-3 rounded-card border border-danger-border bg-danger-light px-4 py-3 text-sm text-danger"
        >
          <AlertTriangleIcon className="mt-px size-5 shrink-0" />
          <p className="flex-1">
            <strong className="font-semibold">Budget {budget.categoryName} dépassé</strong> : {formatDT(budget.spent)}{' '}
            dépensés sur {formatDT(budget.limit)} prévus (+{formatDT(budget.spent - budget.limit)})
          </p>
          <Link
            to={`/budgets${search}`}
            className="shrink-0 font-semibold underline underline-offset-4 hover:no-underline"
            aria-label={`Voir le budget ${budget.categoryName}`}
          >
            Voir
          </Link>
        </div>
      ))}
    </div>
  )
}
