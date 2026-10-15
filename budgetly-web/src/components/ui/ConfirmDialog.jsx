import { useEffect, useRef } from 'react'
import FormMessage from '../auth/FormMessage'
import Button from './Button'
import Modal from './Modal'

/**
 * Demande de confirmation (remplace window.confirm, qui n'est ni stylable ni accessible).
 * Le focus va sur "Annuler" : appuyer sur Entrée par réflexe ne supprime rien.
 * error : message de refus de l'API (ex. 409) ; il remplace le bouton de confirmation.
 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmer',
  loadingLabel,
  loading = false,
  error = '',
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null)

  // Le bouton de confirmation disparaît avec l'erreur : le focus va sur "Fermer" au lieu d'être perdu
  useEffect(() => {
    if (error) cancelRef.current?.focus()
  }, [error])

  return (
    <Modal title={title} description={message} size="sm" onClose={loading ? undefined : onCancel}>
      <FormMessage>{error}</FormMessage>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button ref={cancelRef} variant="secondary" onClick={onCancel} disabled={loading} data-autofocus>
          {error ? 'Fermer' : 'Annuler'}
        </Button>
        {!error && (
          <Button variant="danger" onClick={onConfirm} loading={loading} loadingLabel={loadingLabel}>
            {confirmLabel}
          </Button>
        )}
      </div>
    </Modal>
  )
}
