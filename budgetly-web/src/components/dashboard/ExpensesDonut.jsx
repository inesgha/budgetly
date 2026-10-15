import { Cell, Pie, PieChart } from 'recharts'
import { formatDT, formatPercent } from '../../utils/format'
import { prefersReducedMotion } from '../../utils/motion'
import { ChartIcon } from '../icons'
import EmptyState from '../ui/EmptyState'

/**
 * Anneau des dépenses par catégorie, total au centre, légende à côté.
 * L'anneau est décoratif pour les lecteurs d'écran : la légende contient toutes les valeurs en texte.
 */
export default function ExpensesDonut({ categories, total }) {
  if (categories.length === 0) {
    return (
      <EmptyState
        compact
        icon={ChartIcon}
        title="Aucune dépense ce mois-ci"
        description="Tes dépenses apparaîtront ici, réparties par catégorie."
      />
    )
  }

  return (
    // @container : la légende passe à droite quand la carte est assez large (et dessous sinon)
    <div className="@container">
      <div className="flex flex-col items-center gap-6 @md:flex-row @md:items-center">
        <div aria-hidden="true" className="relative size-44 shrink-0">
          <PieChart width={176} height={176} accessibilityLayer={false}>
            <Pie
              data={categories}
              dataKey="total"
              nameKey="name"
              innerRadius={58}
              outerRadius={86}
              startAngle={90}
              endAngle={-270}
              paddingAngle={categories.length > 1 ? 2 : 0}
              cornerRadius={4}
              stroke="none"
              isAnimationActive={!prefersReducedMotion()}
            >
              {categories.map((category) => (
                <Cell key={category.categoryId} fill={category.color} />
              ))}
            </Pie>
          </PieChart>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-muted">Total</span>
            <span className="font-display text-base font-semibold tracking-tight text-ink tabular-nums">
              {formatDT(total)}
            </span>
          </div>
        </div>

        <ul className="w-full min-w-0 flex-1 space-y-2.5">
          {categories.map((category) => (
            <li key={category.categoryId} className="flex items-center gap-2.5 text-sm">
              <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
              <span className="min-w-0 flex-1 truncate text-ink">{category.name}</span>
              <span className="font-medium whitespace-nowrap text-ink tabular-nums">{formatDT(category.total)}</span>
              <span className="w-14 text-right text-xs whitespace-nowrap text-muted tabular-nums">
                {formatPercent(category.percent)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
