// Export CSV lisible par Excel en français : séparateur ";" et UTF-8 avec BOM (pour les accents)

const SEPARATOR = ';'
// BOM (Byte Order Mark) : 3 octets en tête du fichier qui disent à Excel "ce fichier est en UTF-8"
const BOM = String.fromCharCode(0xfeff)

// Entoure de guillemets les valeurs qui contiennent ; " ou un retour à la ligne
function escapeCell(value) {
  const text = value === null || value === undefined ? '' : String(value)
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/**
 * Texte libre saisi par l'utilisateur (libellé, catégorie) : s'il commence par = + - @,
 * Excel l'exécuterait comme une formule. On le préfixe d'une apostrophe pour qu'il reste du texte.
 */
export function csvText(value) {
  const text = value ?? ''
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
}

/** rows : tableau de lignes, la première étant les en-têtes */
export function buildCsv(rows) {
  return BOM + rows.map((row) => row.map(escapeCell).join(SEPARATOR)).join('\r\n')
}

export function downloadFile(filename, content, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** 4.5 -> "4,500" (virgule décimale, sans séparateur de milliers : Excel le lit comme un nombre) */
export function formatCsvAmount(amount) {
  return Number(amount).toFixed(3).replace('.', ',')
}
