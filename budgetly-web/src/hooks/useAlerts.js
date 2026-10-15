import { getAlerts } from '../api/endpoints'
import { useApi } from './useApi'

/**
 * Toutes les alertes de l'utilisateur.
 * version : fourni par le Layout ; il change à chaque modification des alertes, ce qui relance le chargement.
 */
export function useAlerts(version) {
  return useApi((signal) => getAlerts(signal), { version })
}
