import { tint } from '../utils/colors'

// Pastille "● Alimentation" sur un fond teinté de la couleur de la catégorie (texte foncé : toujours lisible)
export default function CategoryBadge({ name, color }) {
  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-ink"
      style={{ backgroundColor: tint(color, 0.14) }}
    >
      <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="truncate">{name}</span>
    </span>
  )
}
