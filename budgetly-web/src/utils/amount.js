// Saisie d'un montant en dinars : "1 234,5" ou "1234.5", 3 décimales au maximum (millimes)

const MAX_AMOUNT = 1_000_000

/** "1 234,5" -> 1234.5 ; NaN si ce n'est pas un montant valide */
export function parseAmount(input) {
  // \s reconnaît aussi les espaces insécables (copiés depuis un montant affiché)
  const normalized = input.replace(/\s/g, '').replace(',', '.')
  return /^\d+(\.\d{1,3})?$/.test(normalized) ? Number(normalized) : Number.NaN
}

/** Message d'erreur, ou "" si le montant est valide. noun : "Le montant", "La limite"… */
export function validateAmount(input, noun = 'Le montant') {
  if (!input.trim()) return `${noun} est obligatoire.`
  const amount = parseAmount(input)
  if (Number.isNaN(amount)) return 'Entre un montant valide, par exemple 12,500 (3 décimales au maximum).'
  if (amount <= 0) return `${noun} doit être supérieur${noun.startsWith('La') ? 'e' : ''} à 0.`
  if (amount > MAX_AMOUNT) return `${noun} ne peut pas dépasser 1 000 000 DT.`
  return ''
}

/** 4.5 -> "4,5" : pour préremplir un champ de saisie */
export function amountToInput(amount) {
  return String(amount).replace('.', ',')
}
