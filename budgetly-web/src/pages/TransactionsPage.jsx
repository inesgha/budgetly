import { useState } from 'react'
import { getTransactions } from '../api/endpoints'
import { parseApiError } from '../api/errors'
import { DownloadIcon, PlusIcon, SearchIcon, TransactionsIcon } from '../components/icons'
import MonthSelector from '../components/MonthSelector'
import TransactionDialogs from '../components/TransactionDialogs'
import TransactionListItem, { TransactionListItemSkeleton } from '../components/TransactionListItem'
import Pagination from '../components/transactions/Pagination'
import TransactionFilters from '../components/transactions/TransactionFilters'
import TransactionsTable from '../components/transactions/TransactionsTable'
import AsyncContent from '../components/ui/AsyncContent'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { useCategories } from '../hooks/useCategories'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useSelectedMonth } from '../hooks/useSelectedMonth'
import { useToast } from '../hooks/useToast'
import { useTransactionEditor } from '../hooks/useTransactionEditor'
import { useTransactions } from '../hooks/useTransactions'
import { buildCsv, csvText, downloadFile, formatCsvAmount } from '../utils/csv'
import { formatMonthYear, parseLocalDate } from '../utils/format'

const PAGE_SIZE = 20
const EXPORT_PAGE_SIZE = 100 // maximum accepté par l'API

export default function TransactionsPage() {
  useDocumentTitle('Transactions')
  const toast = useToast()
  const { month, year } = useSelectedMonth()

  const [type, setType] = useState('all')
  const [categoryId, setCategoryId] = useState('')
  const [searchInput, setSearchInput] = useState('')
  // La recherche part 300 ms après la dernière touche, pas à chaque touche
  const search = useDebouncedValue(searchInput.trim(), 300)

  // La page revient à 1 dès qu'un filtre ou le mois change (sans effet : la page est liée aux filtres)
  const filtersKey = JSON.stringify([month, year, type, categoryId, search])
  const [pageState, setPageState] = useState({ filtersKey, page: 1 })
  const page = pageState.filtersKey === filtersKey ? pageState.page : 1
  const setPage = (nextPage) => setPageState({ filtersKey, page: nextPage })

  const filters = {
    month,
    year,
    type: type === 'all' ? '' : type,
    categoryId,
    search,
  }
  const transactions = useTransactions({ ...filters, page, pageSize: PAGE_SIZE })
  const categories = useCategories()
  const [exporting, setExporting] = useState(false)

  const items = transactions.data?.items ?? []
  const { openCreate, openEdit, requestDelete, dialogProps } = useTransactionEditor({
    onChanged: transactions.reload,
    // Dernière transaction d'une page supprimée : on revient à la page précédente
    onDeleted: () => (items.length === 1 && page > 1 ? setPage(page - 1) : transactions.reload()),
  })

  const hasFilters = type !== 'all' || categoryId !== '' || search !== ''

  function changeType(nextType) {
    setType(nextType)
    // La catégorie choisie n'est pas du nouveau type : on la retire
    const selected = categories.data?.find((category) => String(category.id) === categoryId)
    if (selected && nextType !== 'all' && selected.type !== nextType) {
      setCategoryId('')
    }
  }

  function clearFilters() {
    setType('all')
    setCategoryId('')
    setSearchInput('')
  }

  // Exporte toutes les transactions qui correspondent aux filtres (toutes les pages, pas seulement celle affichée)
  async function handleExport() {
    setExporting(true)
    try {
      const all = []
      let currentPage = 1
      let totalPages = 1
      do {
        const result = await getTransactions({ ...filters, page: currentPage, pageSize: EXPORT_PAGE_SIZE })
        all.push(...result.items)
        totalPages = result.totalPages
        currentPage += 1
      } while (currentPage <= totalPages)

      if (all.length === 0) {
        toast.error('Aucune transaction à exporter.')
        return
      }

      const rows = [
        ['Date', 'Libellé', 'Catégorie', 'Type', 'Montant (DT)'],
        ...all.map((transaction) => [
          parseLocalDate(transaction.date).toLocaleDateString('fr-FR'),
          csvText(transaction.note),
          csvText(transaction.categoryName),
          transaction.type === 'Income' ? 'Revenu' : 'Dépense',
          // Dépenses en négatif : un simple SOMME() dans Excel donne le solde
          formatCsvAmount(transaction.type === 'Income' ? transaction.amount : -transaction.amount),
        ]),
      ]

      downloadFile(`budgetly-transactions-${year}-${String(month).padStart(2, '0')}.csv`, buildCsv(rows))
      toast.success(`${all.length} transaction${all.length > 1 ? 's' : ''} exportée${all.length > 1 ? 's' : ''}`)
    } catch (error) {
      toast.error(parseApiError(error).message)
    } finally {
      setExporting(false)
    }
  }

  const monthLabel = formatMonthYear(month, year)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">Transactions</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            icon={DownloadIcon}
            onClick={handleExport}
            loading={exporting}
            loadingLabel="Export…"
            disabled={items.length === 0}
          >
            Exporter CSV
          </Button>
          <Button icon={PlusIcon} onClick={() => openCreate(type === 'Income' ? 'Income' : 'Expense')}>
            Ajouter
          </Button>
        </div>
      </div>

      <MonthSelector />

      <TransactionFilters
        search={searchInput}
        onSearchChange={setSearchInput}
        type={type}
        onTypeChange={changeType}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
        categories={categories.data ?? []}
      />

      <AsyncContent
        {...transactions}
        onRetry={transactions.reload}
        loadingLabel="Chargement des transactions"
        skeleton={
          <div className="rounded-card border border-line bg-surface px-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <TransactionListItemSkeleton key={i} />
            ))}
          </div>
        }
      >
        {(data) => {
          if (data.items.length === 0) {
            return (
              <div className="rounded-card border border-line bg-surface">
                {hasFilters ? (
                  <EmptyState
                    icon={SearchIcon}
                    title="Aucun résultat"
                    description="Aucune transaction ne correspond à ces filtres."
                    action={
                      <Button variant="secondary" onClick={clearFilters}>
                        Effacer les filtres
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState
                    icon={TransactionsIcon}
                    title="Aucune transaction ce mois-ci"
                    description="Ajoute une dépense ou un revenu pour commencer à suivre ton budget."
                    action={
                      <Button icon={PlusIcon} onClick={() => openCreate('Expense')}>
                        Ajouter une transaction
                      </Button>
                    }
                  />
                )}
              </div>
            )
          }

          return (
            <div className="space-y-4">
              <p className="text-sm text-muted" aria-live="polite">
                {data.totalCount} transaction{data.totalCount > 1 ? 's' : ''}
              </p>

              {/* Ordinateur : tableau */}
              <div className="hidden lg:block">
                <TransactionsTable
                  transactions={data.items}
                  caption={`Transactions de ${monthLabel}, page ${data.page} sur ${data.totalPages}`}
                  onEdit={openEdit}
                  onDelete={requestDelete}
                />
              </div>

              {/* Mobile et tablette : cartes (un appui ouvre la modification, avec un bouton Supprimer) */}
              <ul className="divide-y divide-line rounded-card border border-line bg-surface px-2 lg:hidden">
                {data.items.map((transaction) => (
                  <li key={transaction.id}>
                    <TransactionListItem transaction={transaction} onSelect={openEdit} />
                  </li>
                ))}
              </ul>

              <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
            </div>
          )
        }}
      </AsyncContent>

      <TransactionDialogs {...dialogProps} categories={categories.data} categoriesLoading={categories.loading} />
    </div>
  )
}
