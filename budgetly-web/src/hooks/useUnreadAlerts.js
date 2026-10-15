import { useCallback, useEffect, useState } from 'react'
import client from '../api/client'

const REFRESH_INTERVAL_MS = 60_000

function fetchUnreadCount(signal) {
  return client
    .get('/api/alerts/unread-count', { signal })
    .then(({ data }) => (typeof data === 'number' ? data : (data?.count ?? 0)))
}

// Nombre d'alertes non lues, rafraîchi chaque minute et quand on revient sur l'onglet
export function useUnreadAlerts() {
  const [count, setCount] = useState(0)

  // En cas d'échec, la pastille garde sa dernière valeur (les 401 sont gérés par le client axios)
  const refresh = useCallback(() => fetchUnreadCount().then(setCount).catch(() => {}), [])

  useEffect(() => {
    const controller = new AbortController()
    const load = () => fetchUnreadCount(controller.signal).then(setCount).catch(() => {})

    load()
    const intervalId = setInterval(load, REFRESH_INTERVAL_MS)
    window.addEventListener('focus', load)

    return () => {
      controller.abort()
      clearInterval(intervalId)
      window.removeEventListener('focus', load)
    }
  }, [])

  return { count, refresh }
}
