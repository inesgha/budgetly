// Bloc gris animé qui réserve la place du contenu pendant le chargement
export default function Skeleton({ className = '', rounded = 'rounded-[8px]' }) {
  return <div aria-hidden="true" className={`animate-pulse bg-line/80 ${rounded} ${className}`} />
}

// Annonce le chargement aux lecteurs d'écran (les blocs gris, eux, sont masqués)
export function LoadingRegion({ label = 'Chargement…', className = '', children }) {
  return (
    <div role="status" aria-label={label} className={className}>
      {children}
    </div>
  )
}
