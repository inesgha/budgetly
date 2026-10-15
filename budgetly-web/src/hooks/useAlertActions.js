import { useCallback, useState } from 'react'
import { markAlertRead, markAllAlertsRead } from '../api/endpoints'
import { parseApiError } from '../api/errors'
import { useToast } from './useToast'

/**
 * Marquer des alertes comme lues, avec un affichage immédiat (sans attendre le rechargement de la liste).
 * refreshAlerts : fourni par le Layout, recharge la pastille de la cloche et les listes d'alertes.
 */
export function useAlertActions(refreshAlerts) {
  const toast = useToast()
  const [readIds, setReadIds] = useState(() => new Set())
  const [markingAll, setMarkingAll] = useState(false)

  const isRead = useCallback((alert) => alert.isRead || readIds.has(alert.id), [readIds])

  const addReadIds = (ids) => setReadIds((current) => new Set([...current, ...ids]))

  const markRead = useCallback(
    async (alert) => {
      if (isRead(alert)) return
      addReadIds([alert.id])
      try {
        await markAlertRead(alert.id)
      } catch (error) {
        toast.error(parseApiError(error).message)
      }
      refreshAlerts()
    },
    [isRead, refreshAlerts, toast],
  )

  /**
   * alerts : les alertes affichées (marquées lues tout de suite à l'écran).
   * everywhere : true -> route read-all (toutes les alertes de l'utilisateur, tous mois confondus) ;
   *              false -> uniquement ces alertes-là (ex. celles du mois sur la page Budgets).
   */
  const markAll = useCallback(
    async (alerts, { everywhere = false } = {}) => {
      setMarkingAll(true)
      const unread = alerts.filter((alert) => !isRead(alert))
      addReadIds(unread.map((alert) => alert.id))
      try {
        if (everywhere) {
          await markAllAlertsRead()
        } else {
          await Promise.all(unread.map((alert) => markAlertRead(alert.id)))
        }
        toast.success('Alertes marquées comme lues')
      } catch (error) {
        toast.error(parseApiError(error).message)
      } finally {
        setMarkingAll(false)
        refreshAlerts()
      }
    },
    [isRead, refreshAlerts, toast],
  )

  return { isRead, markRead, markAll, markingAll }
}
