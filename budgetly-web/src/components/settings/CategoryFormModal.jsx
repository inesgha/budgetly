import { useState } from 'react'
import { createCategory, updateCategory } from '../../api/endpoints'
import { parseApiError } from '../../api/errors'
import { useForm } from '../../hooks/useForm'
import FormMessage from '../auth/FormMessage'
import CategoryAvatar from '../CategoryAvatar'
import CategoryBadge from '../CategoryBadge'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import TextField from '../ui/TextField'
import TypeToggle from '../ui/TypeToggle'
import ColorPicker from './ColorPicker'
import { PALETTE } from './palette'

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/

const VALIDATORS = {
  name: (value) => {
    if (!value.trim()) return 'Le nom est obligatoire.'
    if (value.trim().length > 50) return 'Le nom ne doit pas dépasser 50 caractères.'
    return ''
  },
  color: (value) => (HEX_COLOR.test(value) ? '' : 'Format attendu : # suivi de 6 caractères, par exemple #5B3FE0.'),
}

/** Ajout ou modification d'une catégorie (nom, type, couleur), dans une Modal */
export default function CategoryFormModal({ category = null, defaultType = 'Expense', onClose, onSaved }) {
  const isEdit = Boolean(category)
  const [type, setType] = useState(category?.type ?? defaultType)
  const { values, errors, setErrors, setValue, handleChange, validate } = useForm(
    { name: category?.name ?? '', color: category?.color ?? PALETTE[0].value },
    VALIDATORS,
  )
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  const previewColor = HEX_COLOR.test(values.color) ? values.color : '#8C8798'
  const previewName = values.name.trim() || 'Aperçu'

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
      name: values.name.trim(),
      color: values.color.toUpperCase(),
      icon: category?.icon ?? '',
      type,
    }

    setSubmitting(true)
    try {
      const saved = isEdit ? await updateCategory(category.id, payload) : await createCategory(payload)
      onSaved(saved, isEdit)
    } catch (error) {
      const { status, message, fieldErrors } = parseApiError(error)
      if (status === 400 && Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
      } else {
        // 409 : nom déjà utilisé pour ce type, ou changement de type d'une catégorie déjà utilisée
        setServerError(status === 404 ? "Cette catégorie n'existe plus." : message)
      }
      setSubmitting(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie'} onClose={submitting ? undefined : onClose}>
      <FormMessage>{serverError}</FormMessage>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <TypeToggle name="category-type" legend="Type de catégorie" value={type} onChange={setType} />

        <TextField
          id="name"
          label="Nom"
          value={values.name}
          onChange={handleChange}
          error={errors.name}
          maxLength={50}
          placeholder={type === 'Expense' ? 'Ex. Café' : 'Ex. Cours particuliers'}
          autoComplete="off"
          data-autofocus
        />

        <ColorPicker value={values.color} onChange={(color) => setValue('color', color)} error={errors.color} />

        <div aria-hidden="true" className="flex items-center gap-3 rounded-control bg-background px-3.5 py-3">
          <CategoryAvatar name={previewName} color={previewColor} />
          <CategoryBadge name={previewName} color={previewColor} />
        </div>

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Annuler
          </Button>
          <Button type="submit" loading={submitting} loadingLabel="Enregistrement…">
            {isEdit ? 'Enregistrer' : 'Créer la catégorie'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
