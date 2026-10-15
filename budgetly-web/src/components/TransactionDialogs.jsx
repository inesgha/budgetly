import { formatDate, formatDT } from '../utils/format'
import TransactionForm from './TransactionForm'
import ConfirmDialog from './ui/ConfirmDialog'

// Le formulaire (ajout / modification) et la confirmation de suppression, pilotés par useTransactionEditor
export default function TransactionDialogs({
  editor,
  toDelete,
  deleting,
  categories,
  categoriesLoading,
  onCloseEditor,
  onSaved,
  onDeleteRequest,
  onConfirmDelete,
  onCancelDelete,
}) {
  return (
    <>
      {editor && (
        <TransactionForm
          key={editor.key}
          transaction={editor.transaction}
          defaultType={editor.defaultType}
          categories={categories}
          categoriesLoading={categoriesLoading}
          onClose={onCloseEditor}
          onSaved={onSaved}
          onDeleteRequest={onDeleteRequest}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title="Supprimer cette transaction ?"
          message={`${toDelete.note || toDelete.categoryName} : ${formatDT(toDelete.amount)}, le ${formatDate(toDelete.date)}. Cette action est définitive.`}
          confirmLabel="Supprimer"
          loadingLabel="Suppression…"
          loading={deleting}
          onConfirm={onConfirmDelete}
          onCancel={onCancelDelete}
        />
      )}
    </>
  )
}
