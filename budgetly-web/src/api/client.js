import axios from 'axios'
import { getStoredToken } from './session'

// Seule source de l'adresse de l'API : la variable VITE_API_URL (fichier .env en local, réglage Vercel en ligne).
// Le "/" final éventuel est retiré : "https://api.exemple.net/" + "/api/..." donnerait "//api/...".
const apiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '')

if (!apiUrl) {
  console.error('VITE_API_URL est absente : copie .env.example en .env puis relance "npm run dev" (ou définis-la sur Vercel).')
}

const client = axios.create({
  baseURL: apiUrl,
  // 90 s : en ligne, l'API gratuite s'endort et la base Azure se met en pause ; le premier appel
  // peut prendre jusqu'à une minute le temps du réveil (au-delà, on abandonne avec un message clair).
  timeout: 90_000,
})

// Fonction appelée quand l'API répond 401 ; fournie par AuthProvider (déconnexion).
// La redirection vers /login est ensuite faite par ProtectedRoute.
let onUnauthorized = null

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

// Avant chaque requête : ajoute le token s'il y en a un
client.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Après chaque réponse : un 401 sur une requête authentifiée = session expirée ou invalide.
// Les 401 de /login (mauvais mot de passe) ne déconnectent pas : ils n'envoient pas de token.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const sentToken = Boolean(error.config?.headers?.Authorization)
    const isAuthRequest = /\/api\/auth\/(login|register)$/.test(error.config?.url ?? '')

    if (error.response?.status === 401 && sentToken && !isAuthRequest) {
      onUnauthorized?.()
    }

    return Promise.reject(error)
  },
)

export default client
