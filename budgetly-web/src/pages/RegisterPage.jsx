import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { parseApiError } from '../api/errors'
import AuthLayout from '../components/auth/AuthLayout'
import FormMessage from '../components/auth/FormMessage'
import PasswordField from '../components/auth/PasswordField'
import SubmitButton from '../components/auth/SubmitButton'
import TextField from '../components/ui/TextField'
import { MIN_PASSWORD_LENGTH, validateEmail, validateName, validatePassword } from '../components/auth/validation'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useForm } from '../hooks/useForm'
import { useSlowFlag } from '../hooks/useSlowFlag'

const VALIDATORS = { name: validateName, email: validateEmail, password: validatePassword }
const INITIAL_VALUES = { name: '', email: '', password: '' }

export default function RegisterPage() {
  useDocumentTitle('Inscription')
  const { register } = useAuth()
  const location = useLocation()
  const { values, errors, setErrors, handleChange, validate } = useForm(INITIAL_VALUES, VALIDATORS)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  // Inscription en cours depuis plus de 5 s : le serveur gratuit est sans doute en train de se réveiller
  const slow = useSlowFlag(submitting)

  async function handleSubmit(event) {
    event.preventDefault()
    const form = event.currentTarget
    setServerError('')

    const firstInvalid = Object.keys(validate())[0]
    if (firstInvalid) {
      form.elements[firstInvalid]?.focus()
      return
    }

    setSubmitting(true)
    try {
      await register(values.name.trim(), values.email.trim(), values.password)
      // Pas de navigate ici : GuestRoute redirige dès que l'utilisateur est connecté
    } catch (error) {
      const { status, message, fieldErrors } = parseApiError(error)

      if (status === 409) {
        // Email déjà utilisé : le message va sous le champ concerné
        setErrors({ email: message })
        form.elements.email?.focus()
      } else {
        setErrors(fieldErrors)
        setServerError(message)
      }
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Créer un compte" description="Gratuit, et prêt en moins d'une minute.">
      <FormMessage>{serverError}</FormMessage>
      {slow && <FormMessage tone="info">Le serveur se réveille, cela peut prendre jusqu'à une minute…</FormMessage>}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <TextField
          id="name"
          label="Nom"
          autoComplete="name"
          value={values.name}
          onChange={handleChange}
          error={errors.name}
        />
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="nom@exemple.com"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
        />
        <PasswordField
          id="password"
          label="Mot de passe"
          autoComplete="new-password"
          hint={`${MIN_PASSWORD_LENGTH} caractères minimum.`}
          value={values.password}
          onChange={handleChange}
          error={errors.password}
        />
        <SubmitButton loading={submitting} loadingLabel="Création du compte…">
          Créer mon compte
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Déjà un compte ?{' '}
        <Link
          to="/login"
          state={location.state?.from ? { from: location.state.from } : undefined}
          className="font-semibold text-primary underline-offset-4 hover:text-primary-hover hover:underline"
        >
          Se connecter
        </Link>
      </p>
    </AuthLayout>
  )
}
