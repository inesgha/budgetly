import { ChevronLeftIcon, ChevronRightIcon } from '../icons'
import Button from '../ui/Button'

// ‹ Précédent    Page 1 sur 3    Suivant ›
export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) {
    return null
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3">
      <Button
        variant="secondary"
        size="sm"
        icon={ChevronLeftIcon}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Précédent
      </Button>
      <p className="text-sm text-muted" aria-live="polite">
        Page <span className="font-semibold text-ink">{page}</span> sur {totalPages}
      </p>
      <Button
        variant="secondary"
        size="sm"
        trailingIcon={ChevronRightIcon}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Suivant
      </Button>
    </nav>
  )
}
