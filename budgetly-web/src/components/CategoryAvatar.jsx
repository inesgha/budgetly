import { readableTextColor } from '../utils/colors'

// Carré aux couleurs de la catégorie avec son initiale (décoratif : le nom est écrit à côté)
export default function CategoryAvatar({ name, color, className = 'size-10' }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-[10px] font-display text-base font-semibold ${className}`}
      style={{ backgroundColor: color, color: readableTextColor(color) }}
    >
      {name?.trim().charAt(0).toUpperCase() || '?'}
    </span>
  )
}
