import AlertItem from '../alerts/AlertItem'
import { BellIcon } from '../icons'
import AsyncContent from '../ui/AsyncContent'
import Button from '../ui/Button'
import Card from '../ui/Card'
import EmptyState from '../ui/EmptyState'
import Skeleton from '../ui/Skeleton'

// Panneau "Alertes" de la page Budgets : seulement les alertes des budgets du mois affiché
export default function BudgetAlertsPanel({ alertsQuery, alerts, actions }) {
  const { isRead, markRead, markAll, markingAll } = actions
  const hasUnread = alerts.some((alert) => !isRead(alert))

  return (
    <Card
      title="Alertes"
      action={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => markAll(alerts)}
          disabled={!hasUnread}
          loading={markingAll}
          loadingLabel="En cours…"
        >
          Tout marquer comme lu
        </Button>
      }
    >
      <AsyncContent
        {...alertsQuery}
        onRetry={alertsQuery.reload}
        loadingLabel="Chargement des alertes"
        skeleton={
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        }
      >
        {() =>
          alerts.length === 0 ? (
            <EmptyState
              compact
              icon={BellIcon}
              title="Aucune alerte ce mois-ci"
              description="Tu seras prévenu à 80 % puis à 100 % de chaque budget."
            />
          ) : (
            <ul className="-mx-2 space-y-1">
              {alerts.map((alert) => (
                <li key={alert.id}>
                  <AlertItem alert={alert} read={isRead(alert)} onMarkRead={markRead} />
                </li>
              ))}
            </ul>
          )
        }
      </AsyncContent>
    </Card>
  )
}
