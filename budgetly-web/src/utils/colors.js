// Outils pour les couleurs des catégories (choisies par l'utilisateur, donc imprévisibles)

const INK = '#16151B'
const WHITE = '#FFFFFF'

function luminance(hex) {
  const value = hex.replace('#', '')
  const channels = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16) / 255)
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

/** Texte blanc ou noir, selon ce qui est le plus lisible sur cette couleur de fond */
export function readableTextColor(background) {
  if (!/^#[0-9a-f]{6}$/i.test(background ?? '')) return WHITE
  return contrast(background, WHITE) >= contrast(background, INK) ? WHITE : INK
}

/** "#E8743B" + 0.12 -> "#E8743B1F" (même couleur, transparente) */
export function tint(hex, alpha) {
  if (!/^#[0-9a-f]{6}$/i.test(hex ?? '')) return 'transparent'
  return `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`
}
