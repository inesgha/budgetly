import { formatSignedDT } from '../utils/format'

// Montant d'une transaction : "+250,000 DT" en vert pour un revenu, "−4,500 DT" pour une dépense
export default function TransactionAmount({ amount, type, className = '' }) {
  const isIncome = type === 'Income'

  return (
    <span className={`font-semibold whitespace-nowrap tabular-nums ${isIncome ? 'text-success' : 'text-ink'} ${className}`}>
      {formatSignedDT(amount, type)}
    </span>
  )
}
