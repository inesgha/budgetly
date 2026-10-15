import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDT, formatDTRounded, formatMonthYear, formatShortMonth } from '../../utils/format'
import { prefersReducedMotion } from '../../utils/motion'
import { ChartIcon } from '../icons'
import EmptyState from '../ui/EmptyState'

const SELECTED_COLOR = '#5B3FE0'
const OTHER_COLOR = '#D9D3FA'

/**
 * Barres des dépenses des 6 derniers mois. Le mois affiché par le sélecteur (par défaut le mois en cours)
 * est en violet. Un tableau invisible donne les mêmes valeurs aux lecteurs d'écran.
 */
export default function MonthlyExpensesChart({ months, selectedMonth, selectedYear }) {
  const data = months.map((item) => ({
    ...item,
    key: `${item.year}-${item.month}`,
    label: formatShortMonth(item.month),
    isSelected: item.month === selectedMonth && item.year === selectedYear,
  }))

  if (data.every((item) => item.expenses === 0)) {
    return (
      <EmptyState
        compact
        icon={ChartIcon}
        title="Pas encore de dépenses"
        description="L'évolution de tes dépenses sur 6 mois s'affichera ici."
      />
    )
  }

  return (
    <>
      <div aria-hidden="true" className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          {/* Marge en haut : place pour le montant au-dessus de la barre la plus haute */}
          <BarChart data={data} margin={{ top: 24, right: 0, bottom: 0, left: 0 }} accessibilityLayer={false}>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#5F5C68', fontSize: 12 }}
              dy={6}
            />
            <YAxis hide />
            <Tooltip cursor={{ fill: '#ECE8FF', radius: 8 }} content={<ChartTooltip />} />
            <Bar dataKey="expenses" radius={[8, 8, 0, 0]} maxBarSize={44} isAnimationActive={!prefersReducedMotion()}>
              {data.map((item) => (
                <Cell key={item.key} fill={item.isSelected ? SELECTED_COLOR : OTHER_COLOR} />
              ))}
              {/* Montant au-dessus de chaque barre non nulle, en DT sans décimales */}
              <LabelList
                dataKey="expenses"
                position="top"
                offset={6}
                formatter={(value) => (value > 0 ? formatDTRounded(value) : '')}
                fill="#5F5C68"
                fontSize={11}
                fontWeight={600}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <table className="sr-only">
        <caption>Dépenses des 6 derniers mois</caption>
        <thead>
          <tr>
            <th scope="col">Mois</th>
            <th scope="col">Dépenses</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.key}>
              <th scope="row">{formatMonthYear(item.month, item.year)}</th>
              <td>{formatDT(item.expenses)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

// Infobulle au survol d'une barre : "Octobre 2026 — Dépenses : 65,500 DT"
function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null
  }

  const item = payload[0].payload

  return (
    <div className="rounded-control bg-ink px-3 py-2 text-sm text-white shadow-lg">
      <p className="font-semibold">{formatMonthYear(item.month, item.year)}</p>
      <p className="text-white/75">
        Dépenses : <span className="font-semibold text-white tabular-nums">{formatDT(item.expenses)}</span>
      </p>
      {item.income > 0 && (
        <p className="text-white/75">
          Revenus : <span className="font-semibold text-white tabular-nums">{formatDT(item.income)}</span>
        </p>
      )}
    </div>
  )
}
