import { useState } from 'react'
import { Link } from 'react-router-dom'
import { createBudget, updateBudget } from '../../api/endpoints'
import { parseApiError } from '../../api/errors'
import { useForm } from '../../hooks/useForm'
import { amountToInput, parseAmount, validateAmount } from '../../utils/amount'
import { formatMonthYear } from '../../utils/format'
import FormMessage from '../auth/FormMessage'
import AmountField from '../ui/AmountField'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import SelectField from '../ui/SelectField'

const CREATE_VALIDATORS = {
  categoryId: (value) => (value ? '' : 'Choisis une catégorie.'),
  limit: (value) => validateAmount(value, 'La limite'),
}

// En modification, seule la limite change (l'API ne permet pas de changer la catégorie ou le mois)
const EDIT_VALIDATORS = {
  limit: (value) => validateAmount(value, 'La limite'),
}

/**
 * Création ou modification d'un budget, dans une Modal.
 * availableCategories : catégories de DÉPENSE qui n'ont pas encore de budget ce mois-ci.
 */
export default function BudgetFormModal({ budget = null, month, year, availableCategories, onClose, onSaved }) {
  const isEdit = Boolean(budget)
  const { values, errors, setErrors, handleChange, validate } = useForm(
    { categoryId: '', limit: budget ? amountToInput(budget.limit) : '' },
    isEdit ? EDIT_VALIDATORS : CREATE_VALIDATORS,
  )
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const noCategoryLeft = !isEdit && availableCategories.length === 0

  async function handleSubmit(event) {
    event.preventDefault()
    const form = event.currentTarget
    setServerError('')

    const firstInvalid = Object.keys(validate())[0]
    if (firstInvalid) {
      form.elements[firstInvalid]?.focus()
      return
    }

    const limit = parseAmount(values.limit)
    setSubmitting(true)
    try {
      const saved = isEdit
        ? await updateBudget(budget.id, limit)
        : await createBudget({ categoryId: Number(values.categoryId), limit, month, year })
      onSaved(saved, isEdit)
    } catch (error) {
      const { status, message, fieldErrors } = parseApiError(error)
      if (status === 409) {
        // "Un budget existe déjà pour … ce mois-ci" : le message va sous la catégorie
        setErrors({ categoryId: message })
        form.elements.categoryId?.focus()
      } else if (status === 400 && Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
      } else {
        setServerError(status === 404 ? "Ce budget n'existe plus. Il a peut-être été supprimé." : message)
      }
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={isEdit ? `Modifier le budget ${budget.categoryName}` : 'Nouveau budget'}
      description={`Mois : ${formatMonthYear(month, year)}`}
      onClose={submitting ? undefined : onClose}
    >
      <FormMessage>{serverError}</FormMessage>
      {noCategoryLeft && (
        <FormMessage tone="info">
          Toutes tes catégories de dépense ont déjà un budget ce mois-ci.{' '}
          <Link to="/settings" className="font-semibold underline underline-offset-4">
            Créer une catégorie
          </Link>
        </FormMessage>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {!isEdit && (
          <SelectField
            id="categoryId"
            label="Catégorie de dépense"
            value={values.categoryId}
            onChange={handleChange}
            error={errors.categoryId}
            disabled={noCategoryLeft}
            hint="Seules les catégories sans budget ce mois-ci sont proposées."
            data-autofocus
          >
            <option value="">Choisir…</option>
            {availableCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectField>
        )}

        <AmountField
          id="limit"
          label="Limite du mois"
          value={values.limit}
          onChange={handleChange}
          error={errors.limit}
          hint="Tu recevras une alerte à 80 % puis à 100 % de cette limite."
          autoFocus={isEdit}
          disabled={noCategoryLeft}
        />

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Annuler
          </Button>
          <Button type="submit" loading={submitting} loadingLabel="Enregistrement…" disabled={noCategoryLeft}>
            {isEdit ? 'Enregistrer' : 'Créer le budget'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
