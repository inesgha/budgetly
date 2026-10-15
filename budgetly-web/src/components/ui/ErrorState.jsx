import { AlertCircleIcon } from '../icons'
import Button from './Button'

// Erreur de chargement, avec un bouton pour relancer la requête
export default function ErrorState({ message, onRetry, compact = false }) {
  return (
    <div role="alert" className={`flex flex-col items-center text-center ${compact ? 'py-6' : 'py-12'}`}>
      <span className="mb-3 grid size-12 place-items-center rounded-full bg-danger-light text-danger">
        <AlertCircleIcon className="size-6" />
      </span>
      <p className="font-display text-base font-semibold text-ink">Impossible de charger les données</p>
      <p className="mt-1 max-w-xs text-sm text-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-4">
          Réessayer
        </Button>
      )}
    </div>
  )
}
