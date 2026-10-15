import { getCategories } from '../api/endpoints'
import { useApi } from './useApi'

/** Toutes les catégories de l'utilisateur (dépenses et revenus) */
export function useCategories() {
  return useApi((signal) => getCategories(signal), null)
}
