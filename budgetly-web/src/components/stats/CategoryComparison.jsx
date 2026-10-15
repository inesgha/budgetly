import { formatDT } from '../../utils/format'
import { ArrowDownIcon, ArrowUpIcon, ChartIcon } from '../icons'
import EmptyState from '../ui/EmptyState'

/**
 * Dépenses par catégorie : mois choisi, mois précédent et évolution.
 * Pour des dépenses, une hausse est une mauvaise nouvelle (rouge) et une baisse une bonne (vert).
 */
export default function CategoryComparison({ current, previous, currentLabel, previousLabel }) {
  const rows = mergeCategories(current.expensesByCategory, previous.expensesByCategory)

  if (rows.length === 0) {
    return (
      <EmptyState
        compact
        icon={ChartIcon}
        title="Aucune dépense à comparer"
        description={`Aucune dépense en ${currentLabel.toLowerCase()} ni en ${previousLabel.toLowerCase()}.`}
      />
    )
  }

  return (
    // Défilement horizontal si l'écran est trop étroit ; tabIndex pour pouvoir défiler au clavier.
    // relative : sans lui, la <caption> sr-only (en position absolue) sort de la zone et élargit toute la page.
    <div role="region" aria-label="Comparaison des dépenses par catégorie" tabIndex={0} className="relative -mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[30rem] text-left text-sm">
        <caption className="sr-only">
          Dépenses par catégorie : {currentLabel} comparé à {previousLabel}
        </caption>
        <thead className="border-b border-line text-xs font-semibold tracking-wide text-muted uppercase">
          <tr>
            <th scope="col" className="py-3 pr-3">
              Catégorie
            </th>
            <th scope="col" className="px-3 py-3 text-right">
              {currentLabel}
            </th>
            <th scope="col" className="px-3 py-3 text-right">
              {previousLabel}
            </th>
            <th scope="col" className="py-3 pl-3 text-right">
              Évolution
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr key={row.categoryId}>
              <th scope="row" className="py-3 pr-3 font-medium text-ink">
                <span className="flex items-center gap-2.5">
                  <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
                  <span className="truncate">{row.name}</span>
                </span>
              </th>
              <td className="px-3 py-3 text-right whitespace-nowrap text-ink tabular-nums">{formatDT(row.current)}</td>
              <td className="px-3 py-3 text-right whitespace-nowrap text-muted tabular-nums">{formatDT(row.previous)}</td>
              <td className="py-3 pl-3 text-right">
                <Evolution current={row.current} previous={row.previous} />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 border-line font-semibold">
          <tr>
            <th scope="row" className="py-3 pr-3 text-ink">
              Total
            </th>
            <td className="px-3 py-3 text-right whitespace-nowrap text-ink tabular-nums">{formatDT(current.totalExpenses)}</td>
            <td className="px-3 py-3 text-right whitespace-nowrap text-muted tabular-nums">{formatDT(previous.totalExpenses)}</td>
            <td className="py-3 pl-3 text-right">
              <Evolution current={current.totalExpenses} previous={previous.totalExpenses} />
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// "↑ +12 %" en rouge, "↓ −8 %" en vert, "Stable" ou "Nouveau" en gris (le sens est aussi écrit pour les lecteurs d'écran)
function Evolution({ current, previous }) {
  if (previous === 0) {
    return <span className="text-muted">{current > 0 ? 'Nouveau' : '—'}</span>
  }

  const percent = Math.round(((current - previous) / previous) * 100)

  if (percent === 0) {
    return <span className="text-muted">Stable</span>
  }

  const isIncrease = percent > 0
  const Icon = isIncrease ? ArrowUpIcon : ArrowDownIcon

  return (
    <span className={`inline-flex items-center justify-end gap-1 font-semibold whitespace-nowrap tabular-nums ${isIncrease ? 'text-danger' : 'text-success'}`}>
      <Icon className="size-4" />
      <span className="sr-only">{isIncrease ? 'En hausse de' : 'En baisse de'}</span>
      {isIncrease ? '+' : '-'}
      {Math.abs(percent)} %
    </span>
  )
}

// Réunit les catégories des deux mois (une catégorie peut n'apparaître que dans l'un des deux)
function mergeCategories(currentList, previousList) {
  const byId = new Map()

  for (const item of currentList) {
    byId.set(item.categoryId, { categoryId: item.categoryId, name: item.name, color: item.color, current: item.total, previous: 0 })
  }
  for (const item of previousList) {
    const row = byId.get(item.categoryId)
    if (row) row.previous = item.total
    else byId.set(item.categoryId, { categoryId: item.categoryId, name: item.name, color: item.color, current: 0, previous: item.total })
  }

  return [...byId.values()].sort((a, b) => b.current - a.current || b.previous - a.previous)
}
