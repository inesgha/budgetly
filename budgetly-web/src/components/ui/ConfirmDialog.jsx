import Button from './Button'
import Modal from './Modal'

/**
 * Demande de confirmation (remplace window.confirm, qui n'est ni stylable ni accessible).
 * Le focus va sur "Annuler" : appuyer sur Entrée par réflexe ne supprime rien.
 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmer',
  loadingLabel,
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal title={title} description={message} size="sm" onClose={loading ? undefined : onCancel}>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={loading} data-autofocus>
          Annuler
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading} loadingLabel={loadingLabel}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
