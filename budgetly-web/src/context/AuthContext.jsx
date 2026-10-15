import axios from 'axios'
import { useCallback, useEffect, useMemo, useState } from 'react'
import client, { setUnauthorizedHandler } from '../api/client'
import { clearSession, getValidStoredToken, saveSession } from '../api/session'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getValidStoredToken)
  const [user, setUser] = useState(null)
  // Chargement seulement s'il y a un token à vérifier auprès de l'API
  const [loading, setLoading] = useState(token !== null)
  // Vrai quand l'API a refusé le token : la page de connexion affiche "Ta session a expiré"
  const [sessionExpired, setSessionExpired] = useState(false)

  const logout = useCallback(() => {
    clearSession()
    setToken(null)
    setUser(null)
  }, [])

  const expireSession = useCallback(() => {
    logout()
    setSessionExpired(true)
  }, [logout])

  const startSession = useCallback((data) => {
    saveSession(data.token, data.expiresAt)
    setToken(data.token)
    setUser(data.user)
    setSessionExpired(false)
    return data.user
  }, [])

  const login = useCallback(
    async (email, password) => {
      const { data } = await client.post('/api/auth/login', { email, password })
      return startSession(data)
    },
    [startSession],
  )

  const register = useCallback(
    async (name, email, password) => {
      const { data } = await client.post('/api/auth/register', { name, email, password })
      return startSession(data)
    },
    [startSession],
  )

  // Au démarrage : un token valide existe -> on récupère l'utilisateur ; s'il est refusé -> déconnexion
  useEffect(() => {
    if (!getValidStoredToken()) {
      return
    }

    const controller = new AbortController()

    client
      .get('/api/auth/me', { signal: controller.signal })
      .then(({ data }) => setUser(data))
      .catch((error) => {
        if (!axios.isCancel(error)) {
          logout()
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    // En développement, React monte deux fois les composants : on annule la première requête
    return () => controller.abort()
  }, [logout])

  // Toute réponse 401 de l'API (token expiré ou invalide) déconnecte l'utilisateur.
  // Pas de navigate ici : ProtectedRoute voit user = null et renvoie vers /login (une seule redirection).
  useEffect(() => {
    setUnauthorizedHandler(expireSession)
    return () => setUnauthorizedHandler(null)
  }, [expireSession])

  const value = useMemo(
    () => ({ user, token, loading, sessionExpired, login, register, logout }),
    [user, token, loading, sessionExpired, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
