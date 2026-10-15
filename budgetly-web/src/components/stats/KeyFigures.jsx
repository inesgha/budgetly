import { formatDT, formatPercent } from '../../utils/format'

// 4 chiffres clés calculés sur la période (6 ou 12 mois) à partir des totaux mensuels de l'API
export default function KeyFigures({ months }) {
  const totalIncome = months.reduce((sum, item) => sum + item.income, 0)
  const totalExpenses = months.reduce((sum, item) => sum + item.expenses, 0)
  // Taux d'épargne = part des revenus qui n'a pas été dépensée
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : null
  const averageExpenses = months.length > 0 ? totalExpenses / months.length : 0
  const period = `sur ${months.length} mois`

  let savingsHelp = 'Aucun revenu sur la période'
  if (savingsRate !== null) {
    savingsHelp = savingsRate >= 0 ? 'de tes revenus mis de côté' : 'Tu as dépensé plus que tes revenus'
  }

  const figures = [
    { label: 'Total des revenus', value: formatDT(totalIncome), help: period, valueClass: 'text-success' },
    { label: 'Total des dépenses', value: formatDT(totalExpenses), help: period, valueClass: 'text-ink' },
    {
      label: "Taux d'épargne",
      value: savingsRate === null ? '—' : formatPercent(savingsRate),
      help: savingsHelp,
      valueClass: savingsRate !== null && savingsRate < 0 ? 'text-danger' : 'text-ink',
    },
    { label: 'Dépense moyenne', value: formatDT(averageExpenses), help: 'par mois', valueClass: 'text-ink' },
  ]

  return (
    <dl className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
      {figures.map((figure) => (
        <div key={figure.label} className="rounded-card border border-line bg-surface p-4 md:p-5">
          <dt className="text-sm font-medium text-muted">{figure.label}</dt>
          <dd className={`mt-2 font-display text-lg font-bold tracking-tight tabular-nums sm:text-2xl ${figure.valueClass}`}>
            {figure.value}
          </dd>
          <dd className="mt-1 text-xs text-muted sm:text-sm">{figure.help}</dd>
        </div>
      ))}
    </dl>
  )
}
