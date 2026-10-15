import { formatDate } from '../utils/format'
import CategoryAvatar from './CategoryAvatar'
import TransactionAmount from './TransactionAmount'

/**
 * Une transaction sur une ligne : carré de catégorie, libellé, "catégorie · date" et montant.
 * Avec onSelect, toute la ligne devient un bouton (ouvre la modification).
 */
export default function TransactionListItem({ transaction, onSelect }) {
  const { note, categoryName, categoryColor, date, amount, type } = transaction
  const title = note || categoryName

  const content = (
    <>
      <CategoryAvatar name={categoryName} color={categoryColor} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-ink">{title}</span>
        <span className="block truncate text-sm text-muted">
          {note ? `${categoryName} · ` : ''}
          {formatDate(date)}
        </span>
      </span>
      <TransactionAmount amount={amount} type={type} className="text-sm" />
    </>
  )

  if (!onSelect) {
    return <div className="flex items-center gap-3 py-3">{content}</div>
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(transaction)}
      className="flex w-full items-center gap-3 rounded-control px-2 py-3 text-left transition-colors hover:bg-background"
    >
      <span className="sr-only">Modifier :</span>
      {content}
    </button>
  )
}

// Ligne grise de chargement, même hauteur qu'une vraie ligne
export function TransactionListItemSkeleton() {
  return (
    <div aria-hidden="true" className="flex items-center gap-3 py-3">
      <div className="size-10 animate-pulse rounded-[10px] bg-line/80" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-2/5 animate-pulse rounded bg-line/80" />
        <div className="h-3 w-1/4 animate-pulse rounded bg-line/80" />
      </div>
      <div className="h-3.5 w-16 animate-pulse rounded bg-line/80" />
    </div>
  )
}
