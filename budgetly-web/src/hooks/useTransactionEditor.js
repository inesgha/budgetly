import { useCallback, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { deleteTransaction } from '../api/endpoints'
import { parseApiError } from '../api/errors'
import { useToast } from './useToast'

/**
 * Ajout / modification / suppression d'une transaction, partagé par le tableau de bord et la page Transactions.
 * onChanged : appelé après chaque enregistrement ou suppression réussi (pour recharger les données).
 * onDeleted : facultatif, remplace onChanged après une suppression (ex. revenir à la page précédente).
 * À afficher avec <TransactionDialogs {...dialogProps} />.
 */
export function useTransactionEditor({ onChanged, onDeleted }) {
  const toast = useToast()
  const { refreshAlerts } = useOutletContext()
  const [editor, setEditor] = useState(null) // { key, transaction, defaultType } quand le formulaire est ouvert
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const openCount = useRef(0)

  // Une nouvelle "key" à chaque ouverture : le formulaire repart d'un état vierge
  const openCreate = useCallback((defaultType = 'Expense') => {
    openCount.current += 1
    setEditor({ key: openCount.current, transaction: null, defaultType })
  }, [])

  const openEdit = useCallback((transaction) => {
    openCount.current += 1
    setEditor({ key: openCount.current, transaction, defaultType: transaction.type })
  }, [])

  const requestDelete = useCallback((transaction) => {
    setEditor(null)
    setToDelete(transaction)
  }, [])

  // Données ET pastille de la cloche : une dépense peut créer une alerte de budget
  const afterChange = useCallback(() => {
    onChanged()
    refreshAlerts()
  }, [onChanged, refreshAlerts])

  const handleSaved = useCallback(
    (_saved, isEdit) => {
      setEditor(null)
      toast.success(isEdit ? 'Transaction modifiée' : 'Transaction ajoutée')
      afterChange()
    },
    [toast, afterChange],
  )

  const confirmDelete = useCallback(async () => {
    setDeleting(true)
    try {
      await deleteTransaction(toDelete.id)
      setToDelete(null)
      toast.success('Transaction supprimée')
      ;(onDeleted ?? onChanged)()
      refreshAlerts()
    } catch (error) {
      toast.error(parseApiError(error).message)
    } finally {
      setDeleting(false)
    }
  }, [toDelete, toast, onDeleted, onChanged, refreshAlerts])

  return {
    openCreate,
    openEdit,
    requestDelete,
    dialogProps: {
      editor,
      toDelete,
      deleting,
      onCloseEditor: () => setEditor(null),
      onSaved: handleSaved,
      onDeleteRequest: requestDelete,
      onConfirmDelete: confirmDelete,
      onCancelDelete: () => setToDelete(null),
    },
  }
}
