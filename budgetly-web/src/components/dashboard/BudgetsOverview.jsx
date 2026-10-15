import { Link } from 'react-router-dom'
import { formatAmount } from '../../utils/format'
import { WalletIcon } from '../icons'
import EmptyState from '../ui/EmptyState'

// Couleur selon le statut calculé par l'API : vert < 80 %, orange de 80 à 100 %, rouge au-delà
const STATUS_STYLES = {
  ok: { bar: 'bg-success', text: 'text-success' },
  warning: { bar: 'bg-warning', text: 'text-warning-ink' },
  reached: { bar: 'bg-warning', text: 'text-warning-ink' },
  exceeded: { bar: 'bg-danger', text: 'text-danger' },
}

const MAX_ITEMS = 4

// Les 4 budgets les plus entamés du mois
export default function BudgetsOverview({ budgets, search }) {
  if (budgets.length === 0) {
    return (
      <EmptyState
        compact
        icon={WalletIcon}
        title="Aucun budget ce mois-ci"
        description="Fixe une limite par catégorie pour être alerté avant de la dépasser."
        action={
          <Link
            to={`/budgets${search}`}
            className="text-sm font-semibold text-primary underline-offset-4 hover:text-primary-hover hover:underline"
          >
            Créer un budget
          </Link>
        }
      />
    )
  }

  const topBudgets = [...budgets].sort((a, b) => b.percent - a.percent).slice(0, MAX_ITEMS)

  return (
    <ul className="space-y-5">
      {topBudgets.map((budget) => {
        const style = STATUS_STYLES[budget.status] ?? STATUS_STYLES.ok

        return (
          <li key={budget.id}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate font-medium text-ink">{budget.categoryName}</span>
              <span className={`font-semibold tabular-nums ${style.text}`}>{budget.percent} %</span>
            </div>
            <div aria-hidden="true" className="mt-2 h-2 overflow-hidden rounded-full bg-background">
              <div
                className={`h-full rounded-full ${style.bar}`}
                style={{ width: `${Math.min(budget.percent, 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted tabular-nums">
              {formatAmount(budget.spent)} / {formatAmount(budget.limit)} DT
            </p>
          </li>
        )
      })}
    </ul>
  )
}
