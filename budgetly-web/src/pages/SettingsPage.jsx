import { useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { deleteCategory } from '../api/endpoints'
import { parseApiError } from '../api/errors'
import { LogoutIcon, PlusIcon } from '../components/icons'
import CategoryFormModal from '../components/settings/CategoryFormModal'
import CategoryList from '../components/settings/CategoryList'
import AsyncContent from '../components/ui/AsyncContent'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Skeleton from '../components/ui/Skeleton'
import { useAuth } from '../hooks/useAuth'
import { useCategories } from '../hooks/useCategories'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useToast } from '../hooks/useToast'

export default function SettingsPage() {
  useDocumentTitle('Paramètres')
  const { user, logout } = useAuth()
  const toast = useToast()
  const { refreshAlerts } = useOutletContext()
  const categories = useCategories()

  const [editor, setEditor] = useState(null) // { key, category } quand la fenêtre est ouverte
  const openCount = useRef(0)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const expenseCategories = (categories.data ?? []).filter((category) => category.type === 'Expense')
  const incomeCategories = (categories.data ?? []).filter((category) => category.type === 'Income')

  function openEditor(category = null) {
    openCount.current += 1
    setEditor({ key: openCount.current, category })
  }

  function afterChange() {
    categories.reload()
    refreshAlerts()
  }

  function handleSaved(_saved, isEdit) {
    setEditor(null)
    toast.success(isEdit ? 'Catégorie modifiée' : 'Catégorie créée')
    afterChange()
  }

  async function confirmDelete() {
    setDeleting(true)
    try {
      await deleteCategory(toDelete.id)
      setToDelete(null)
      toast.success('Catégorie supprimée')
      afterChange()
    } catch (error) {
      // 409 : l'API explique combien de transactions et de budgets l'utilisent encore
      setDeleteError(parseApiError(error).message)
    } finally {
      setDeleting(false)
    }
  }

  function closeDelete() {
    setToDelete(null)
    setDeleteError('')
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">Paramètres</h1>

      <Card title="Mon profil">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-muted">Nom</dt>
            <dd className="mt-1 font-medium break-words text-ink">{user?.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Email</dt>
            <dd className="mt-1 font-medium break-all text-ink">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Devise</dt>
            <dd className="mt-1 font-medium text-ink">{user?.currency || 'DT'} (dinar tunisien)</dd>
          </div>
        </dl>
      </Card>

      <Card
        title="Mes catégories"
        action={
          <Button size="sm" icon={PlusIcon} onClick={() => openEditor()}>
            Nouvelle catégorie
          </Button>
        }
      >
        <AsyncContent
          {...categories}
          onRetry={categories.reload}
          loadingLabel="Chargement des catégories"
          skeleton={
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {[0, 1].map((i) => (
                <div key={i} className="space-y-3">
                  {[0, 1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-8" />
                  ))}
                </div>
              ))}
            </div>
          }
        >
          {() => (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
              <CategoryList
                title="Dépenses"
                categories={expenseCategories}
                emptyText="Aucune catégorie de dépense."
                onEdit={openEditor}
                onDelete={setToDelete}
              />
              <CategoryList
                title="Revenus"
                categories={incomeCategories}
                emptyText="Aucune catégorie de revenu."
                onEdit={openEditor}
                onDelete={setToDelete}
              />
            </div>
          )}
        </AsyncContent>
      </Card>

      <Card title="Session">
        <p className="text-sm text-muted">Tu es connecté avec {user?.email}.</p>
        <Button variant="secondary" icon={LogoutIcon} onClick={logout} className="mt-4">
          Se déconnecter
        </Button>
      </Card>

      {editor && (
        <CategoryFormModal
          key={editor.key}
          category={editor.category}
          onClose={() => setEditor(null)}
          onSaved={handleSaved}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title={`Supprimer la catégorie ${toDelete.name} ?`}
          message="Elle disparaîtra de tes listes. C'est impossible si des transactions ou des budgets l'utilisent encore."
          confirmLabel="Supprimer"
          loadingLabel="Suppression…"
          loading={deleting}
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={closeDelete}
        />
      )}
    </div>
  )
}
