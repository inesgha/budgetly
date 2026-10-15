import { useState } from 'react'
import { ChartIcon } from '../components/icons'
import MonthSelector from '../components/MonthSelector'
import CategoryComparison from '../components/stats/CategoryComparison'
import IncomeExpensesChart from '../components/stats/IncomeExpensesChart'
import KeyFigures from '../components/stats/KeyFigures'
import AsyncContent from '../components/ui/AsyncContent'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { shiftMonth, useSelectedMonth } from '../hooks/useSelectedMonth'
import { useMonthlyStats, useStatsSummary } from '../hooks/useStats'
import { formatMonthYear } from '../utils/format'

const PERIODS = [6, 12]

export default function StatsPage() {
  useDocumentTitle('Statistiques')
  const [months, setMonths] = useState(6)
  const monthly = useMonthlyStats(months)

  // Comparaison : le mois du sélecteur (dans l'URL) et le mois d'avant
  const { month, year } = useSelectedMonth()
  const previous = shiftMonth(month, year, -1)
  const current = useStatsSummary(month, year)
  const before = useStatsSummary(previous.month, previous.year)

  // Les deux résumés sont combinés en une seule "requête" pour AsyncContent
  const comparison = {
    data: current.data && before.data ? { current: current.data, previous: before.data } : null,
    loading: current.loading || before.loading,
    error: current.error || before.error,
    reload: () => {
      current.reload()
      before.reload()
    },
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">Statistiques</h1>
        <div role="group" aria-label="Période" className="inline-flex rounded-control border border-line bg-surface p-1">
          {PERIODS.map((period) => (
            <button
              key={period}
              type="button"
              aria-pressed={months === period}
              onClick={() => setMonths(period)}
              className={`rounded-[9px] px-4 py-2 text-sm font-semibold transition-colors ${
                months === period ? 'bg-ink text-white' : 'text-muted hover:text-ink'
              }`}
            >
              {period} mois
            </button>
          ))}
        </div>
      </div>

      <AsyncContent
        {...monthly}
        onRetry={monthly.reload}
        loadingLabel="Chargement des statistiques"
        skeleton={
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28" rounded="rounded-card" />
              ))}
            </div>
            <Skeleton className="h-96" rounded="rounded-card" />
          </div>
        }
      >
        {(data) => (
          <div className="space-y-6">
            <KeyFigures months={data} />
            <Card title="Revenus vs dépenses">
              {data.every((item) => item.income === 0 && item.expenses === 0) ? (
                <EmptyState
                  compact
                  icon={ChartIcon}
                  title="Aucune transaction sur cette période"
                  description="Tes revenus et tes dépenses apparaîtront ici, mois par mois."
                />
              ) : (
                <IncomeExpensesChart months={data} />
              )}
            </Card>
          </div>
        )}
      </AsyncContent>

      <Card title="Comparaison avec le mois précédent">
        <MonthSelector className="mb-4" />
        <AsyncContent
          {...comparison}
          onRetry={comparison.reload}
          loadingLabel="Chargement de la comparaison"
          skeleton={
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-9" />
              ))}
            </div>
          }
        >
          {(data) => (
            <CategoryComparison
              current={data.current}
              previous={data.previous}
              currentLabel={formatMonthYear(month, year)}
              previousLabel={formatMonthYear(previous.month, previous.year)}
            />
          )}
        </AsyncContent>
      </Card>
    </div>
  )
}
