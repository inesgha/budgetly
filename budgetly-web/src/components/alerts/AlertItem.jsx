import { formatDateTime } from '../../utils/format'
import { AlertTriangleIcon } from '../icons'

// 100 = budget atteint ou dépassé (rouge), 80 = avertissement (orange)
const LEVEL_STYLES = {
  100: 'bg-danger-light text-danger',
  80: 'bg-warning/15 text-warning-ink',
}

/**
 * Une alerte : icône colorée selon le niveau, message et date.
 * Non lue : fond teinté + point violet ; c'est alors un bouton qui la marque comme lue.
 */
export default function AlertItem({ alert, read, onMarkRead }) {
  const content = (
    <>
      <span className={`grid size-9 shrink-0 place-items-center rounded-[10px] ${LEVEL_STYLES[alert.level] ?? LEVEL_STYLES[80]}`}>
        <AlertTriangleIcon className="size-[1.125rem]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-sm text-ink ${read ? '' : 'font-semibold'}`}>{alert.message}</span>
        {/* Le seuil distingue les alertes 80 % et 100 % d'un même budget (leurs messages peuvent être identiques) */}
        <span className="mt-0.5 block text-xs text-muted">
          Seuil {alert.level} % · {formatDateTime(alert.createdAt)}
        </span>
      </span>
      {!read && (
        <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
      )}
    </>
  )

  if (read) {
    return (
      <div className="flex items-start gap-3 rounded-control px-3 py-2.5">
        {content}
        <span className="sr-only">(lue)</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onMarkRead(alert)}
      className="flex w-full items-start gap-3 rounded-control bg-primary-light/60 px-3 py-2.5 text-left transition-colors hover:bg-primary-light"
    >
      <span className="sr-only">Non lue, marquer comme lue :</span>
      {content}
    </button>
  )
}
