// Règles de validation côté client, alignées sur celles de l'API

export const MIN_PASSWORD_LENGTH = 8

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateName(value) {
  return value.trim() ? '' : 'Le nom est obligatoire.'
}

export function validateEmail(value) {
  const email = value.trim()
  if (!email) {
    return "L'email est obligatoire."
  }
  if (!EMAIL_PATTERN.test(email)) {
    return 'Entre une adresse email valide, par exemple nom@exemple.com.'
  }
  return ''
}

export function validatePassword(value) {
  if (!value) {
    return 'Le mot de passe est obligatoire.'
  }
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`
  }
  return ''
}
