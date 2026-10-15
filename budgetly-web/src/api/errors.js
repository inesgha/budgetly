// Transforme une erreur axios (souvent au format ProblemDetails) en message lisible en français

const STATUS_MESSAGES = {
  400: 'Certaines informations sont invalides. Vérifie le formulaire.',
  401: 'Ta session a expiré. Reconnecte-toi pour continuer.',
  403: "Tu n'as pas accès à cette ressource.",
  404: 'Élément introuvable.',
  409: 'Cet élément existe déjà.',
  429: 'Trop de tentatives. Patiente un instant avant de réessayer.',
}

const SERVER_ERROR_MESSAGE = 'Le serveur a rencontré un problème. Réessaie dans un instant.'
const NETWORK_ERROR_MESSAGE = 'Impossible de joindre le serveur. Vérifie ta connexion et réessaie.'
const TIMEOUT_MESSAGE = 'Le serveur met trop de temps à répondre. Réessaie dans un instant.'
const UNKNOWN_MESSAGE = 'Une erreur inattendue est survenue.'

/**
 * @returns {{ status: number | null, message: string, fieldErrors: Record<string, string> }}
 *   fieldErrors : un message par champ, avec les noms du formulaire ("Email" -> "email")
 */
export function parseApiError(error) {
  if (!error?.response) {
    const message = error?.code === 'ECONNABORTED' ? TIMEOUT_MESSAGE : NETWORK_ERROR_MESSAGE
    return { status: null, message, fieldErrors: {} }
  }

  const { status, data } = error.response

  // Notre API renvoie { message: "..." } déjà en français pour les 401 et 409.
  // Le "title" des ProblemDetails, lui, est en anglais : on ne l'affiche pas.
  const message =
    (typeof data?.message === 'string' && data.message) ||
    STATUS_MESSAGES[status] ||
    (status >= 500 ? SERVER_ERROR_MESSAGE : UNKNOWN_MESSAGE)

  return { status, message, fieldErrors: extractFieldErrors(data?.errors) }
}

function extractFieldErrors(errors) {
  if (!errors || typeof errors !== 'object') {
    return {}
  }

  const fieldErrors = {}

  for (const [key, messages] of Object.entries(errors)) {
    // "$.date" : JSON mal formé, avec un message technique en anglais
    const isJsonError = key.startsWith('$.')
    const field = toCamelCase(isJsonError ? key.slice(2) : key)

    // "request" ou "$" : erreur sur le corps entier, pas sur un champ précis
    if (!field || field === 'request' || field === '$' || fieldErrors[field]) {
      continue
    }

    const first = Array.isArray(messages) ? messages[0] : messages
    fieldErrors[field] = isJsonError ? 'Valeur invalide.' : String(first ?? 'Valeur invalide.')
  }

  return fieldErrors
}

function toCamelCase(key) {
  return key.charAt(0).toLowerCase() + key.slice(1)
}
