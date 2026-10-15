import { getBudgets } from '../api/endpoints'
import { useApi } from './useApi'

/** Budgets du mois, avec spent, remaining, percent et status calculés par l'API */
export function useBudgets(month, year) {
  return useApi((signal) => getBudgets({ month, year }, signal), { month, year })
}
