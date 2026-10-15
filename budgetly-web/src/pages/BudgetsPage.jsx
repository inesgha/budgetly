import { useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { createBudget, deleteBudget } from '../api/endpoints'
import { parseApiError } from '../api/errors'
import BudgetAlertsPanel from '../components/budgets/BudgetAlertsPanel'
import BudgetCard from '../components/budgets/BudgetCard'
import BudgetFormModal from '../components/budgets/BudgetFormModal'
import { CopyIcon, PlusIcon, WalletIcon } from '../components/icons'
import MonthSelector from '../components/MonthSelector'
import AsyncContent from '../components/ui/AsyncContent'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import { useAlertActions } from '../hooks/useAlertActions'
import { useAlerts } from '../hooks/useAlerts'
import { useBudgets } from '../hooks/useBudgets'
import { useCategories } from '../hooks/useCategories'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { shiftMonth, useSelectedMonth } from '../hooks/useSelectedMonth'
import { useToast } from '../hooks/useToast'
import { formatDT, formatMonthYear } from '../utils/format'

export default function BudgetsPage() {
  useDocumentTitle('Budgets')
  const toast = useToast()
  const { refreshAlerts, alertsVersion } = useOutletContext()
  const { month, year } = useSelectedMonth()
  const previous = shiftMonth(month, year, -1)

  const budgets = useBudgets(month, year)
  const previousBudgets = useBudgets(previous.month, previous.year)
  const categories = useCategories()
  const alertsQuery = useAlerts(alertsVersion)
  const alertActions = useAlertActions(refreshAlerts)

  const [editor, setEditor] = useState(null) // { key, budget } quand la fenêtre est ouverte
  const openCount = useRef(0)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [copying, setCopying] = useState(false)

  const monthBudgets = budgets.data ?? []
  const totalLimit = monthBudgets.reduce((sum, budget) => sum + budget.limit, 0)

  // Les alertes n'indiquent pas leur mois : on garde celles qui appartiennent aux budgets de ce mois
  const monthBudgetIds = new Set(monthBudgets.map((budget) => budget.id))
  const monthAlerts = (alertsQuery.data ?? []).filter((alert) => monthBudgetIds.has(alert.budgetId))

  // Catégories de dépense qui n'ont pas encore de budget ce mois-ci
  const usedCategoryIds = new Set(monthBudgets.map((budget) => budget.categoryId))
  const availableCategories = (categories.data ?? []).filter(
    (category) => category.type === 'Expense' && !usedCategoryIds.has(category.id),
  )

  const canCopyPrevious = budgets.data?.length === 0 && previousBudgets.data?.length > 0
  const monthLabel = formatMonthYear(month, year)
  const previousLabel = formatMonthYear(previous.month, previous.year).toLowerCase()

  // Budgets + pastille de la cloche + listes d'alertes (un budget peut créer ou supprimer des alertes)
  function afterChange() {
    budgets.reload()
    refreshAlerts()
  }

  function openEditor(budget = null) {
    openCount.current += 1
    setEditor({ key: openCount.current, budget })
  }

  function handleSaved(_saved, isEdit) {
    setEditor(null)
    toast.success(isEdit ? 'Budget modifié' : 'Budget créé')
    afterChange()
  }

  async function confirmDelete() {
    setDeleting(true)
    try {
      await deleteBudget(toDelete.id)
      setToDelete(null)
      toast.success('Budget supprimé')
      afterChange()
    } catch (error) {
      setDeleteError(parseApiError(error).message)
    } finally {
      setDeleting(false)
    }
  }

  // Recrée pour ce mois les budgets du mois précédent, avec les mêmes limites
  async function copyPreviousMonth() {
    setCopying(true)
    const results = await Promise.allSettled(
      previousBudgets.data.map((budget) =>
        createBudget({ categoryId: budget.categoryId, limit: budget.limit, month, year }),
      ),
    )
    const copied = results.filter((result) => result.status === 'fulfilled').length
    const failed = results.length - copied

    if (copied > 0) {
      toast.success(`${copied} budget${copied > 1 ? 's' : ''} copié${copied > 1 ? 's' : ''} depuis ${previousLabel}`)
    }
    if (failed > 0) {
      toast.error(`${failed} budget${failed > 1 ? 's n’ont' : ' n’a'} pas pu être copié${failed > 1 ? 's' : ''}.`)
    }
    setCopying(false)
    afterChange()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">Budgets</h1>
          <p className="mt-1 text-sm text-muted">
            {monthLabel}
            {budgets.data && ` · ${formatDT(totalLimit)} prévus au total`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MonthSelector />
          <Button icon={PlusIcon} onClick={() => openEditor()}>
            Nouveau budget
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
        <AsyncContent
          {...budgets}
          onRetry={budgets.reload}
          loadingLabel="Chargement des budgets"
          skeleton={
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-52" rounded="rounded-card" />
              ))}
            </div>
          }
        >
          {(data) =>
            data.length === 0 ? (
              <div className="rounded-card border border-line bg-surface">
                <EmptyState
                  icon={WalletIcon}
                  title="Aucun budget ce mois-ci"
                  description="Fixe une limite de dépenses par catégorie : Budgetly t'alerte à 80 % puis à 100 %, avant qu'il ne soit trop tard."
                  action={
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button icon={PlusIcon} onClick={() => openEditor()}>
                        Créer un budget
                      </Button>
                      {canCopyPrevious && (
                        <Button
                          variant="secondary"
                          icon={CopyIcon}
                          onClick={copyPreviousMonth}
                          loading={copying}
                          loadingLabel="Copie en cours…"
                        >
                          Copier les budgets du mois précédent
                        </Button>
                      )}
                    </div>
                  }
                />
              </div>
            ) : (
              // @container : 1, 2 ou 3 colonnes selon la place réellement disponible (panneau d'alertes compris)
              <div className="@container">
                <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @5xl:grid-cols-3">
                  {data.map((budget) => (
                    <BudgetCard key={budget.id} budget={budget} onEdit={openEditor} onDelete={setToDelete} />
                  ))}
                </div>
              </div>
            )
          }
        </AsyncContent>

        <BudgetAlertsPanel alertsQuery={alertsQuery} alerts={monthAlerts} actions={alertActions} />
      </div>

      {editor && (
        <BudgetFormModal
          key={editor.key}
          budget={editor.budget}
          month={month}
          year={year}
          availableCategories={availableCategories}
          onClose={() => setEditor(null)}
          onSaved={handleSaved}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title={`Supprimer le budget ${toDelete.categoryName} ?`}
          message="Les alertes liées à ce budget seront aussi supprimées. Tes transactions, elles, ne changent pas."
          confirmLabel="Supprimer"
          loadingLabel="Suppression…"
          loading={deleting}
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={() => {
            setToDelete(null)
            setDeleteError('')
          }}
        />
      )}
    </div>
  )
}
