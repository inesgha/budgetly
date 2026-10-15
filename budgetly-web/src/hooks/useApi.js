import axios from 'axios'
import { useCallback, useEffect, useEffectEvent, useState } from 'react'
import { parseApiError } from '../api/errors'

/**
 * Charge des données depuis l'API et gère loading / error / reload.
 *
 * request : (signal) => Promise<données>
 * params  : les valeurs dont dépend la requête (ex. { month, year }) ; quand elles changent, on recharge.
 *
 * Pendant un rechargement, les anciennes données restent disponibles (pas de clignotement).
 */
export function useApi(request, params) {
  const [reloadCount, setReloadCount] = useState(0)
  // La "clé" identifie une requête : mêmes paramètres + même nombre de rechargements = même requête
  const key = JSON.stringify([params, reloadCount])
  const [result, setResult] = useState({ key: null, data: null, error: null })

  // Toujours la dernière version de request, sans relancer l'effet à chaque rendu
  const runRequest = useEffectEvent((signal) => request(signal))

  useEffect(() => {
    const controller = new AbortController()

    runRequest(controller.signal)
      .then((data) => setResult({ key, data, error: null }))
      .catch((error) => {
        if (!axios.isCancel(error)) {
          setResult((previous) => ({ key, data: previous.data, error: parseApiError(error).message }))
        }
      })

    // Paramètres modifiés avant la réponse : on annule l'ancienne requête
    return () => controller.abort()
  }, [key])

  const reload = useCallback(() => setReloadCount((count) => count + 1), [])

  return {
    data: result.data,
    error: result.key === key ? result.error : null,
    loading: result.key !== key,
    reload,
  }
}
