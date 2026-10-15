import { getTransactions } from '../api/endpoints'
import { useApi } from './useApi'

/** filters : { month, year, type, categoryId, search, page, pageSize } -> liste paginée */
export function useTransactions(filters) {
  return useApi((signal) => getTransactions(filters, signal), filters)
}
