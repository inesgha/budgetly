import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import BudgetAlertBanner from '../components/dashboard/BudgetAlertBanner'
import BudgetsOverview from '../components/dashboard/BudgetsOverview'
import ExpensesDonut from '../components/dashboard/ExpensesDonut'
import MonthlyExpensesChart from '../components/dashboard/MonthlyExpensesChart'
import SummaryCards from '../components/dashboard/SummaryCards'
import { PlusIcon, TransactionsIcon } from '../components/icons'
import MonthSelector from '../components/MonthSelector'
import TransactionDialogs from '../components/TransactionDialogs'
import TransactionListItem, { TransactionListItemSkeleton } from '../components/TransactionListItem'
import AsyncContent from '../components/ui/AsyncContent'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import { useBudgets } from '../hooks/useBudgets'
import { useCategories } from '../hooks/useCategories'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useSelectedMonth } from '../hooks/useSelectedMonth'
import { useMonthlyStats, useStatsSummary } from '../hooks/useStats'
import { useTransactionEditor } from '../hooks/useTransactionEditor'

const seeAllClasses =
  'inline-flex items-center gap-1 rounded-[8px] text-sm font-semibold text-primary underline-offset-4 hover:text-primary-hover hover:underline'

export default function DashboardPage() {
  useDocumentTitle('Tableau de bord')
  const { month, year, search } = useSelectedMonth()

  const summary = useStatsSummary(month, year)
  const monthly = useMonthlyStats(6)
  const budgets = useBudgets(month, year)
  const categories = useCategories()

  const { reload: reloadSummary } = summary
  const { reload: reloadMonthly } = monthly
  const { reload: reloadBudgets } = budgets
  const reloadAll = useCallback(() => {
    reloadSummary()
    reloadMonthly()
    reloadBudgets()
  }, [reloadSummary, reloadMonthly, reloadBudgets])

  const { openCreate, openEdit, dialogProps } = useTransactionEditor({ onChanged: reloadAll })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">Tableau de bord</h1>
        <div className="flex flex-wrap items-center gap-2">
          <MonthSelector />
          <Button icon={PlusIcon} onClick={() => openCreate('Expense')}>
            Ajouter une dépense
          </Button>
        </div>
      </div>

      <BudgetAlertBanner budgets={budgets.data} search={search} />

      <SummaryCards {...summary} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Dépenses par catégorie">
          <AsyncContent
            {...summary}
            onRetry={summary.reload}
            loadingLabel="Chargement des dépenses par catégorie"
            skeleton={<Skeleton className="mx-auto size-44" rounded="rounded-full" />}
          >
            {(data) => <ExpensesDonut categories={data.expensesByCategory} total={data.totalExpenses} />}
          </AsyncContent>
        </Card>

        <Card title="Évolution sur 6 mois">
          <AsyncContent
            {...monthly}
            onRetry={monthly.reload}
            loadingLabel="Chargement de l'évolution sur 6 mois"
            skeleton={<Skeleton className="h-56" />}
          >
            {(data) => <MonthlyExpensesChart months={data} selectedMonth={month} selectedYear={year} />}
          </AsyncContent>
        </Card>

        <Card
          title="Budgets"
          action={
            <Link to={`/budgets${search}`} className={seeAllClasses} aria-label="Voir tous les budgets">
              Tout voir
            </Link>
          }
        >
          <AsyncContent
            {...budgets}
            onRetry={budgets.reload}
            loadingLabel="Chargement des budgets"
            skeleton={
              <div className="space-y-5">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            }
          >
            {(data) => <BudgetsOverview budgets={data} search={search} />}
          </AsyncContent>
        </Card>

        <Card
          title="Dernières transactions"
          action={
            <Link to={`/transactions${search}`} className={seeAllClasses} aria-label="Voir toutes les transactions">
              Tout voir
            </Link>
          }
        >
          <AsyncContent
            {...summary}
            onRetry={summary.reload}
            loadingLabel="Chargement des dernières transactions"
            skeleton={[0, 1, 2, 3].map((i) => (
              <TransactionListItemSkeleton key={i} />
            ))}
          >
            {(data) =>
              data.recentTransactions.length === 0 ? (
                <EmptyState
                  compact
                  icon={TransactionsIcon}
                  title="Aucune transaction ce mois-ci"
                  action={
                    <Button variant="secondary" size="sm" icon={PlusIcon} onClick={() => openCreate('Expense')}>
                      Ajouter une transaction
                    </Button>
                  }
                />
              ) : (
                <ul className="-mx-2 divide-y divide-line">
                  {data.recentTransactions.map((transaction) => (
                    <li key={transaction.id}>
                      <TransactionListItem transaction={transaction} onSelect={openEdit} />
                    </li>
                  ))}
                </ul>
              )
            }
          </AsyncContent>
        </Card>
      </div>

      <TransactionDialogs {...dialogProps} categories={categories.data} categoriesLoading={categories.loading} />
    </div>
  )
}
