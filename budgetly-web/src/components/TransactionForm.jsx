import { useState } from 'react'
import { createTransaction, updateTransaction } from '../api/endpoints'
import { parseApiError } from '../api/errors'
import { useForm } from '../hooks/useForm'
import { toLocalDateString } from '../utils/format'
import FormMessage from './auth/FormMessage'
import { TrashIcon } from './icons'
import Button from './ui/Button'
import FieldMessage from './ui/FieldMessage'
import Modal from './ui/Modal'
import SelectField from './ui/SelectField'
import TextField from './ui/TextField'
import { fieldClasses, labelClasses } from './ui/field-styles'

const TYPES = [
  { value: 'Expense', label: 'Dépense' },
  { value: 'Income', label: 'Revenu' },
]

const MAX_AMOUNT = 1_000_000

/** "1 234,5" ou "1234.5" -> 1234.5 ; NaN si ce n'est pas un montant valide (3 décimales maximum) */
function parseAmount(input) {
  const normalized = input.replace(/\s/g, '').replace(',', '.')
  return /^\d+(\.\d{1,3})?$/.test(normalized) ? Number(normalized) : Number.NaN
}

function validateAmount(input) {
  if (!input.trim()) return 'Le montant est obligatoire.'
  const amount = parseAmount(input)
  if (Number.isNaN(amount)) return 'Entre un montant valide, par exemple 12,500 (3 décimales au maximum).'
  if (amount <= 0) return 'Le montant doit être supérieur à 0.'
  if (amount > MAX_AMOUNT) return 'Le montant ne peut pas dépasser 1 000 000 DT.'
  return ''
}

const VALIDATORS = {
  amount: validateAmount,
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
      amount: transaction ? String(transaction.amount).replace('.', ',') : '',
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
        <fieldset>
          <legend className="sr-only">Type de transaction</legend>
          <div className="grid grid-cols-2 gap-1 rounded-control bg-background p-1">
            {TYPES.map(({ value, label }) => (
              <label key={value} className="relative">
                <input
                  type="radio"
                  name="type"
                  value={value}
                  checked={type === value}
                  onChange={() => changeType(value)}
                  className="peer sr-only"
                />
                <span className="block cursor-pointer rounded-[9px] px-3 py-2 text-center text-sm font-semibold text-muted transition-colors peer-checked:bg-surface peer-checked:text-ink peer-checked:shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary hover:text-ink">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="amount" className={labelClasses}>
            Montant
          </label>
          <div className="relative mt-1.5">
            <input
              id="amount"
              name="amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0,000"
              value={values.amount}
              onChange={handleChange}
              aria-invalid={errors.amount ? true : undefined}
              aria-describedby={errors.amount ? 'amount-error' : undefined}
              data-autofocus
              className={`${fieldClasses(errors.amount, { large: true })} pr-14 tabular-nums`}
            />
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-4 flex items-center font-display text-lg font-semibold text-muted">
              DT
            </span>
          </div>
          <FieldMessage id="amount-error" error={errors.amount} />
        </div>

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
