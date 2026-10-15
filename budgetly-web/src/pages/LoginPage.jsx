import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { parseApiError } from '../api/errors'
import AuthLayout from '../components/auth/AuthLayout'
import FormMessage from '../components/auth/FormMessage'
import PasswordField from '../components/auth/PasswordField'
import SubmitButton from '../components/auth/SubmitButton'
import TextField from '../components/auth/TextField'
import { validateEmail, validatePassword } from '../components/auth/validation'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useForm } from '../hooks/useForm'

const VALIDATORS = { email: validateEmail, password: validatePassword }
const INITIAL_VALUES = { email: '', password: '' }

export default function LoginPage() {
  useDocumentTitle('Connexion')
  const { login, sessionExpired } = useAuth()
  const location = useLocation()
  const { values, errors, setErrors, handleChange, validate } = useForm(INITIAL_VALUES, VALIDATORS)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

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
      await login(values.email.trim(), values.password)
      // Pas de navigate ici : GuestRoute redirige dès que l'utilisateur est connecté
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error)
      setErrors(fieldErrors)
      setServerError(message)
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Connexion" description="Content de te revoir ! Connecte-toi pour retrouver ton budget.">
      {sessionExpired && !serverError && (
        <FormMessage tone="info">Ta session a expiré. Reconnecte-toi pour continuer.</FormMessage>
      )}
      <FormMessage>{serverError}</FormMessage>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
          autoComplete="current-password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
        />
        <SubmitButton loading={submitting} loadingLabel="Connexion…">
          Se connecter
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Pas encore de compte ?{' '}
        <Link
          to="/register"
          state={location.state?.from ? { from: location.state.from } : undefined}
          className="font-semibold text-primary underline-offset-4 hover:text-primary-hover hover:underline"
        >
          Créer un compte
        </Link>
      </p>
    </AuthLayout>
  )
}
