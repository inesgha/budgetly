// Formats français : montants en dinars (3 décimales), mois et dates

const amountFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
})

const NBSP = String.fromCharCode(0xa0) // espace insécable : "DT" ne passe jamais seul à la ligne
const MINUS = String.fromCharCode(0x2212) // vrai signe moins (plus lisible que le tiret "-")

export const MONTH_NAMES = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

const MONTH_SHORT_NAMES = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
]

/** 214.5 -> "214,500 DT" ; 1234.5 -> "1 234,500 DT" */
export function formatDT(amount) {
  return `${amountFormatter.format(Number(amount) || 0)}${NBSP}DT`
}

/** 214.5 -> "214,500" (sans l'unité, pour écrire "214,000 / 250,000 DT") */
export function formatAmount(amount) {
  return amountFormatter.format(Number(amount) || 0)
}

/** Revenu : "+250,000 DT" ; dépense : "−4,500 DT" */
export function formatSignedDT(amount, type) {
  return `${type === 'Income' ? '+' : MINUS}${formatDT(Math.abs(amount))}`
}

/** Montant signé selon sa valeur : -12 -> "−12,000 DT", 12 -> "12,000 DT" (ou "+12,000 DT" avec forcePlus) */
export function formatBalanceDT(amount, { forcePlus = false } = {}) {
  if (amount < 0) return `${MINUS}${formatDT(-amount)}`
  return `${forcePlus && amount > 0 ? '+' : ''}${formatDT(amount)}`
}

/** 10, 2026 -> "Octobre 2026" */
export function formatMonthYear(month, year) {
  const name = MONTH_NAMES[month - 1] ?? ''
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`
}

/** 10 -> "oct." */
export function formatShortMonth(month) {
  return MONTH_SHORT_NAMES[month - 1] ?? ''
}

/**
 * Date -> "2026-10-15" en heure LOCALE.
 * Pas de toISOString() : elle convertit en UTC et peut donner la veille ou le lendemain.
 */
export function toLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * "2026-10-15" -> Date locale du 15 octobre à minuit.
 * Pas de new Date("2026-10-15") : JavaScript la lit comme minuit UTC (donc le 14 au soir sur le continent américain).
 */
export function parseLocalDate(value) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** "2026-10-15" -> "15 oct. 2026" */
export function formatDate(value) {
  const date = parseLocalDate(value)
  return `${date.getDate()} ${formatShortMonth(date.getMonth() + 1)} ${date.getFullYear()}`
}

/** 21.8 -> "21,8 %" */
export function formatPercent(value, maximumFractionDigits = 1) {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits }).format(value)}${NBSP}%`
}
