// Lecture et écriture de la session (token JWT + date d'expiration) dans localStorage

const TOKEN_KEY = 'budgetly.token'
const EXPIRES_AT_KEY = 'budgetly.expiresAt'

export function saveSession(token, expiresAt) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(EXPIRES_AT_KEY, expiresAt)
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EXPIRES_AT_KEY)
}

// Token brut, même expiré : c'est l'API qui a le dernier mot (elle répondra 401)
export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

// Token seulement s'il existe et n'est pas expiré ; sinon la session est effacée
export function getValidStoredToken() {
  const token = localStorage.getItem(TOKEN_KEY)
  const expiresAt = Date.parse(localStorage.getItem(EXPIRES_AT_KEY) ?? '')

  if (!token || Number.isNaN(expiresAt) || expiresAt <= Date.now()) {
    clearSession()
    return null
  }

  return token
}
