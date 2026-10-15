import { getMonthlyStats, getStatsSummary } from '../api/endpoints'
import { useApi } from './useApi'

/** Revenus, dépenses, solde, dépenses par catégorie et 5 dernières transactions du mois */
export function useStatsSummary(month, year) {
  return useApi((signal) => getStatsSummary({ month, year }, signal), { month, year })
}

/** Revenus et dépenses des N derniers mois (le mois en cours compris) */
export function useMonthlyStats(months = 6) {
  return useApi((signal) => getMonthlyStats(months, signal), { months })
}
