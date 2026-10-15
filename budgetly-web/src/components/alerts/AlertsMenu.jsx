import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAlertActions } from '../../hooks/useAlertActions'
import { useAlerts } from '../../hooks/useAlerts'
import { BellIcon, CheckCircleIcon } from '../icons'
import AsyncContent from '../ui/AsyncContent'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'
import Skeleton from '../ui/Skeleton'
import AlertItem from './AlertItem'

const MAX_ALERTS = 10

/**
 * Cloche + panneau déroulant des 10 dernières alertes.
 * Modèle "disclosure" : le bouton a aria-expanded, le panneau suit le bouton dans le DOM (Tab y entre
 * naturellement). Fermeture avec Échap (le focus revient sur la cloche) ou un clic à l'extérieur.
 */
export default function AlertsMenu({ count, refreshAlerts, alertsVersion, search }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const buttonRef = useRef(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handlePointerDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [open])

  const label =
    count > 0 ? `Alertes : ${count} non lue${count > 1 ? 's' : ''}` : 'Alertes : aucune non lue'

  return (
    // Sur mobile, pas de "relative" ici : le panneau se place par rapport à tout l'en-tête (pleine largeur)
    <div ref={containerRef} className="sm:relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={label}
        className={`relative grid size-11 place-items-center rounded-control border transition-colors ${
          open
            ? 'border-primary bg-primary-light text-primary-hover'
            : 'border-line bg-surface text-ink hover:bg-primary-light hover:text-primary-hover'
        }`}
      >
        <BellIcon />
        {count > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1.5 -right-1.5 h-5 min-w-5 rounded-full bg-danger px-1 text-center text-[11px] leading-5 font-semibold text-white ring-2 ring-background"
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <AlertsPanel
          id={panelId}
          refreshAlerts={refreshAlerts}
          alertsVersion={alertsVersion}
          search={search}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}

// Monté seulement quand le panneau est ouvert : les alertes sont chargées à l'ouverture
function AlertsPanel({ id, refreshAlerts, alertsVersion, search, onClose }) {
  const alerts = useAlerts(alertsVersion)
  const { isRead, markRead, markAll, markingAll } = useAlertActions(refreshAlerts)
  const titleId = useId()

  const latest = (alerts.data ?? []).slice(0, MAX_ALERTS)
  const hasUnread = latest.some((alert) => !isRead(alert))

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className="absolute inset-x-4 top-full z-40 mt-2 flex max-h-[min(34rem,calc(100dvh-7rem))] flex-col overflow-hidden rounded-card border border-line bg-surface shadow-xl shadow-ink/10 sm:inset-x-auto sm:right-0 sm:w-96"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 id={titleId} className="font-display text-base font-semibold text-ink">
          Alertes
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => markAll(latest, { everywhere: true })}
          disabled={!hasUnread}
          loading={markingAll}
          loadingLabel="En cours…"
        >
          Tout marquer comme lu
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <AsyncContent
          {...alerts}
          onRetry={alerts.reload}
          loadingLabel="Chargement des alertes"
          skeleton={
            <div className="space-y-2 p-1">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          }
        >
          {() =>
            latest.length === 0 ? (
              <EmptyState compact icon={CheckCircleIcon} title="Aucune alerte, tout va bien !" />
            ) : (
              <ul className="space-y-1">
                {latest.map((alert) => (
                  <li key={alert.id}>
                    <AlertItem alert={alert} read={isRead(alert)} onMarkRead={markRead} />
                  </li>
                ))}
              </ul>
            )
          }
        </AsyncContent>
      </div>

      <div className="border-t border-line px-4 py-3">
        <Link
          to={`/budgets${search}`}
          onClick={onClose}
          className="text-sm font-semibold text-primary underline-offset-4 hover:text-primary-hover hover:underline"
        >
          Voir les budgets
        </Link>
      </div>
    </section>
  )
}
