import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDT, formatMonthYear, formatShortMonth } from '../../utils/format'
import { prefersReducedMotion } from '../../utils/motion'

const INCOME_COLOR = '#1E7A50'
const EXPENSES_COLOR = '#5B3FE0'
const MUTED = '#5F5C68'

// Axe vertical compact : 1500 -> "1,5 k"
const compactFormatter = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 })

/**
 * Barres groupées revenus (vert) / dépenses (violet) par mois.
 * Le graphique est masqué aux lecteurs d'écran ; un tableau invisible donne les mêmes valeurs.
 */
export default function IncomeExpensesChart({ months }) {
  const data = months.map((item) => ({
    ...item,
    key: `${item.year}-${item.month}`,
    label: formatShortMonth(item.month),
  }))
  const animate = !prefersReducedMotion()

  return (
    <>
      <div aria-hidden="true" className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={3} margin={{ top: 4, right: 4, bottom: 0, left: -8 }} accessibilityLayer={false}>
            <CartesianGrid vertical={false} stroke="#E4E2DC" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: MUTED, fontSize: 12 }} dy={6} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: MUTED, fontSize: 12 }}
              tickFormatter={(value) => compactFormatter.format(value)}
              width={48}
            />
            <Tooltip cursor={{ fill: '#ECE8FF', radius: 6 }} content={<StatsTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={10}
              wrapperStyle={{ paddingBottom: 16 }}
              // Recharts trie la légende par ordre alphabétique : on impose Revenus puis Dépenses
              itemSorter={(item) => (item.dataKey === 'income' ? 0 : 1)}
              formatter={(value) => <span style={{ color: '#16151B', fontSize: 13 }}>{value}</span>}
            />
            <Bar dataKey="income" name="Revenus" fill={INCOME_COLOR} radius={[6, 6, 0, 0]} maxBarSize={26} isAnimationActive={animate} />
            <Bar dataKey="expenses" name="Dépenses" fill={EXPENSES_COLOR} radius={[6, 6, 0, 0]} maxBarSize={26} isAnimationActive={animate} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <table className="sr-only">
        <caption>Revenus et dépenses par mois</caption>
        <thead>
          <tr>
            <th scope="col">Mois</th>
            <th scope="col">Revenus</th>
            <th scope="col">Dépenses</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.key}>
              <th scope="row">{formatMonthYear(item.month, item.year)}</th>
              <td>{formatDT(item.income)}</td>
              <td>{formatDT(item.expenses)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

// Infobulle : "Octobre 2026 · Revenus : 450,000 DT · Dépenses : 546,150 DT · Solde : −96,150 DT"
function StatsTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null
  }

  const item = payload[0].payload
  const balance = item.income - item.expenses

  return (
    <div className="rounded-control bg-ink px-3 py-2 text-sm text-white shadow-lg">
      <p className="font-semibold">{formatMonthYear(item.month, item.year)}</p>
      <p className="mt-1 flex items-center gap-2 text-white/80">
        <span className="size-2 rounded-full bg-[#6FD3A0]" />
        Revenus : <span className="font-semibold text-white tabular-nums">{formatDT(item.income)}</span>
      </p>
      <p className="flex items-center gap-2 text-white/80">
        <span className="size-2 rounded-full bg-primary-soft" />
        Dépenses : <span className="font-semibold text-white tabular-nums">{formatDT(item.expenses)}</span>
      </p>
      <p className="mt-1 text-white/80">
        Solde : <span className="font-semibold text-white tabular-nums">{balance < 0 ? '-' : ''}{formatDT(Math.abs(balance))}</span>
      </p>
    </div>
  )
}
