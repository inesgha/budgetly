import ErrorState from './ErrorState'
import { LoadingRegion } from './Skeleton'

/**
 * Affiche, dans l'ordre :
 * - l'erreur avec un bouton "Réessayer" si la requête a échoué ;
 * - le squelette tant qu'il n'y a encore aucune donnée ;
 * - sinon le contenu (atténué pendant un rechargement, avec aria-busy).
 */
export default function AsyncContent({ data, loading, error, onRetry, skeleton, loadingLabel, children }) {
  if (error) {
    return <ErrorState message={error} onRetry={onRetry} compact />
  }

  if (!data) {
    return <LoadingRegion label={loadingLabel}>{skeleton}</LoadingRegion>
  }

  return (
    <div aria-busy={loading} className={`transition-opacity ${loading ? 'opacity-60' : ''}`}>
      {children(data)}
    </div>
  )
}
