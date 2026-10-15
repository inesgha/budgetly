import { useState } from 'react'
import { createTransaction, updateTransaction } from '../api/endpoints'
import { parseApiError } from '../api/errors'
import { useForm } from '../hooks/useForm'
import { amountToInput, parseAmount, validateAmount } from '../utils/amount'
import { toLocalDateString } from '../utils/format'
import FormMessage from './auth/FormMessage'
import { TrashIcon } from './icons'
import AmountField from './ui/AmountField'
import Button from './ui/Button'
import Modal from './ui/Modal'
import SelectField from './ui/SelectField'
import TextField from './ui/TextField'
import TypeToggle from './ui/TypeToggle'

const VALIDATORS = {
  amount: (value) => validateAmount(value, 'Le montant'),
  categoryId: (value) => (value ? '' : 'Choisis une catégorie.'),
  date: (value) => (value ? '' : 'La date est obligatoire.'),
  note: (value) => (value.length > 200 ? 'Le libellé ne doit pas dépasser 200 caractères.' : ''),
}

/**
 * Formulaire d'ajout ET de modification d'une transaction, dans une Modal.
 * transaction : null pour un ajout, la transaction à modifier sinon.
 * À monter seulement quand il est ouvert (son état repart de zéro à chaque ouverture).
 */
export default function TransactionForm({
  transaction = null,
  categories,
  categoriesLoading = false,
  defaultType = 'Expense',
  onClose,
  onSaved,
  onDeleteRequest,
}) {
  const isEdit = Boolean(transaction)
  const [type, setType] = useState(transaction?.type ?? defaultType)
  const { values, errors, setErrors, setValue, handleChange, validate } = useForm(
    {
      amount: transaction ? amountToInput(transaction.amount) : '',
      note: transaction?.note ?? '',
      categoryId: transaction ? String(transaction.categoryId) : '',
      date: transaction?.date ?? toLocalDateString(),
    },
    VALIDATORS,
  )
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  const options = (categories ?? []).filter((category) => category.type === type)

  function changeType(nextType) {
    setType(nextType)
    // La catégorie choisie appartient à l'autre type : on la retire
    const current = categories?.find((category) => String(category.id) === values.categoryId)
    if (current && current.type !== nextType) {
      setValue('categoryId', '')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const form = event.currentTarget
    setServerError('')

    const firstInvalid = Object.keys(validate())[0]
    if (firstInvalid) {
      form.elements[firstInvalid]?.focus()
      return
    }

    const payload = {
      amount: parseAmount(values.amount),
      date: values.date,
      note: values.note.trim() || null,
      categoryId: Number(values.categoryId),
    }

    setSubmitting(true)
    try {
      const saved = isEdit ? await updateTransaction(transaction.id, payload) : await createTransaction(payload)
      onSaved(saved, isEdit)
    } catch (error) {
      const { status, message, fieldErrors } = parseApiError(error)
      setErrors(fieldErrors)
      // Les erreurs par champ s'affichent sous les champs ; les autres en haut du formulaire
      if (Object.keys(fieldErrors).length === 0 || status !== 400) {
        setServerError(status === 404 ? "Cette transaction n'existe plus. Elle a peut-être été supprimée." : message)
      }
      setSubmitting(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Modifier la transaction' : 'Ajouter une transaction'} onClose={submitting ? undefined : onClose}>
      <FormMessage>{serverError}</FormMessage>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <TypeToggle legend="Type de transaction" value={type} onChange={changeType} />

        <AmountField
          id="amount"
          label="Montant"
          value={values.amount}
          onChange={handleChange}
          error={errors.amount}
          autoFocus
        />

        <TextField
          id="note"
          label="Libellé"
          hint="Facultatif, 200 caractères au maximum."
          placeholder={type === 'Expense' ? 'Ex. Courses au marché' : 'Ex. Bourse du mois'}
          maxLength={200}
          value={values.note}
          onChange={handleChange}
          error={errors.note}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            id="categoryId"
            label="Catégorie"
            value={values.categoryId}
            onChange={handleChange}
            error={errors.categoryId}
            disabled={categoriesLoading && !categories}
            hint={
              !categoriesLoading && options.length === 0
                ? `Aucune catégorie de ${type === 'Expense' ? 'dépense' : 'revenu'} pour l'instant.`
                : undefined
            }
          >
            <option value="">{categoriesLoading && !categories ? 'Chargement…' : 'Choisir…'}</option>
            {options.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectField>

          <TextField id="date" label="Date" type="date" value={values.date} onChange={handleChange} error={errors.date} />
        </div>

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center">
          {isEdit && onDeleteRequest && (
            <Button
              variant="danger-ghost"
              icon={TrashIcon}
              onClick={() => onDeleteRequest(transaction)}
              disabled={submitting}
              className="sm:mr-auto"
            >
              Supprimer
            </Button>
          )}
          <div className="flex flex-col-reverse gap-2 sm:ml-auto sm:flex-row">
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              Annuler
            </Button>
            <Button type="submit" loading={submitting} loadingLabel="Enregistrement…">
              {isEdit ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
