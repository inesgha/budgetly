import { formatBalanceDT, formatDT, formatPercent } from '../../utils/format'
import ErrorState from '../ui/ErrorState'
import Skeleton, { LoadingRegion } from '../ui/Skeleton'

// Solde (carte sombre), revenus et dépenses du mois
export default function SummaryCards({ data, loading, error, reload }) {
  if (error) {
    return (
      <div className="rounded-card border border-line bg-surface">
        <ErrorState message={error} onRetry={reload} compact />
      </div>
    )
  }

  if (!data) {
    return (
      <LoadingRegion label="Chargement du résumé du mois" className="grid gap-4 sm:grid-cols-3">
        <div aria-hidden="true" className="h-32 animate-pulse rounded-card bg-ink/15" />
        <Skeleton className="h-32" rounded="rounded-card" />
        <Skeleton className="h-32" rounded="rounded-card" />
      </LoadingRegion>
    )
  }

  const { balance, totalIncome, totalExpenses } = data
  const expensesShare = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : null

  return (
    <div aria-busy={loading} className={`grid gap-4 transition-opacity sm:grid-cols-3 ${loading ? 'opacity-60' : ''}`}>
      <div data-surface="dark" className="rounded-card bg-ink p-5 text-white md:p-6">
        <p className="text-sm font-medium text-white/70">Solde du mois</p>
        <p className="mt-2 font-display text-3xl font-bold tracking-tight tabular-nums md:text-4xl">
          {formatBalanceDT(balance)}
        </p>
        <p className="mt-2 text-sm text-white/65">
          {balance < 0 ? 'Tu dépenses plus que tu ne gagnes ce mois-ci.' : 'Revenus moins dépenses'}
        </p>
      </div>

      <div className="rounded-card border border-line bg-surface p-5 md:p-6">
        <p className="text-sm font-medium text-muted">Revenus</p>
        <p className="mt-2 font-display text-2xl font-bold tracking-tight text-success tabular-nums md:text-3xl">
          {formatBalanceDT(totalIncome, { forcePlus: true })}
        </p>
        <p className="mt-2 text-sm text-muted">Bourse, famille, job…</p>
      </div>

      <div className="rounded-card border border-line bg-surface p-5 md:p-6">
        <p className="text-sm font-medium text-muted">Dépenses</p>
        <p className="mt-2 font-display text-2xl font-bold tracking-tight text-ink tabular-nums md:text-3xl">
          {formatDT(totalExpenses)}
        </p>
        <p className="mt-2 text-sm text-muted">
          {expensesShare === null ? 'Aucun revenu ce mois-ci' : `${formatPercent(expensesShare)} de tes revenus`}
        </p>
      </div>
    </div>
  )
}
