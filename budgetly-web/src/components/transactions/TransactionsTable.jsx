import { formatDate } from '../../utils/format'
import CategoryBadge from '../CategoryBadge'
import { PencilIcon, TrashIcon } from '../icons'
import TransactionAmount from '../TransactionAmount'

const iconButtonBase = 'grid size-9 place-items-center rounded-[9px] text-muted transition-colors'
const editButtonClasses = `${iconButtonBase} hover:bg-background hover:text-ink`
const deleteButtonClasses = `${iconButtonBase} hover:bg-danger-light hover:text-danger`

// Tableau des transactions (ordinateur) : un vrai <table>, avec <th> pour les colonnes et pour chaque ligne
export default function TransactionsTable({ transactions, caption, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto rounded-card border border-line bg-surface">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-line text-xs font-semibold tracking-wide text-muted uppercase">
          <tr>
            <th scope="col" className="px-5 py-3.5">
              Libellé
            </th>
            <th scope="col" className="px-4 py-3.5">
              Catégorie
            </th>
            <th scope="col" className="px-4 py-3.5">
              Date
            </th>
            <th scope="col" className="px-4 py-3.5 text-right">
              Montant
            </th>
            <th scope="col" className="px-5 py-3.5">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {transactions.map((transaction) => {
            const label = transaction.note || transaction.categoryName
            const description = `${label} du ${formatDate(transaction.date)}`

            return (
              <tr key={transaction.id} className="transition-colors hover:bg-background/60">
                <th scope="row" className="max-w-xs px-5 py-3.5 font-medium text-ink">
                  <span className="block truncate">
                    {transaction.note || <span className="font-normal text-muted">Sans libellé</span>}
                  </span>
                </th>
                <td className="px-4 py-3.5">
                  <CategoryBadge name={transaction.categoryName} color={transaction.categoryColor} />
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap text-muted">{formatDate(transaction.date)}</td>
                <td className="px-4 py-3.5 text-right">
                  <TransactionAmount amount={transaction.amount} type={transaction.type} />
                </td>
                <td className="px-5 py-2">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(transaction)}
                      aria-label={`Modifier ${description}`}
                      className={editButtonClasses}
                    >
                      <PencilIcon className="size-[1.125rem]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(transaction)}
                      aria-label={`Supprimer ${description}`}
                      className={deleteButtonClasses}
                    >
                      <TrashIcon className="size-[1.125rem]" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
