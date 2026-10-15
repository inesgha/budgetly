import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { parseApiError } from '../api/errors'
import AuthLayout from '../components/auth/AuthLayout'
import FormMessage from '../components/auth/FormMessage'
import PasswordField from '../components/auth/PasswordField'
import SubmitButton from '../components/auth/SubmitButton'
import TextField from '../components/ui/TextField'
import Button from '../components/ui/Button'
import { validateEmail, validatePassword } from '../components/auth/validation'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useForm } from '../hooks/useForm'
import { useSlowFlag } from '../hooks/useSlowFlag'

const VALIDATORS = { email: validateEmail, password: validatePassword }
const INITIAL_VALUES = { email: '', password: '' }

// Compte créé par "dotnet run -- --seed-demo" (voir le README)
const DEMO_EMAIL = 'demo@budgetly.tn'
const DEMO_PASSWORD = 'Demo1234!'

export default function LoginPage() {
  useDocumentTitle('Connexion')
  const { login, sessionExpired } = useAuth()
  const location = useLocation()
  const { values, errors, setErrors, setValue, handleChange, validate } = useForm(INITIAL_VALUES, VALIDATORS)
  // Quel bouton a lancé la connexion en cours : "form", "demo" ou null
  const [pending, setPending] = useState(null)
  const [serverError, setServerError] = useState('')
  // Connexion en cours depuis plus de 5 s : en ligne, le serveur gratuit est sans doute en train de se réveiller
  const slow = useSlowFlag(pending !== null)

  async function signIn(email, password, source) {
    setServerError('')
    setPending(source)
    try {
      await login(email, password)
      // Pas de navigate ici : GuestRoute redirige dès que l'utilisateur est connecté
    } catch (error) {
      const { status, message, fieldErrors } = parseApiError(error)
      if (source === 'demo' && status === 401) {
        setServerError("Le compte démo n'est pas disponible pour le moment.")
      } else {
        setErrors(fieldErrors)
        setServerError(message)
      }
      setPending(null)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    const form = event.currentTarget

    const firstInvalid = Object.keys(validate())[0]
    if (firstInvalid) {
      setServerError('')
      form.elements[firstInvalid]?.focus()
      return
    }

    signIn(values.email.trim(), values.password, 'form')
  }

  // Remplit le formulaire (on voit ce qui est envoyé) puis se connecte au compte démo
  function handleDemo() {
    setErrors({})
    setValue('email', DEMO_EMAIL)
    setValue('password', DEMO_PASSWORD)
    signIn(DEMO_EMAIL, DEMO_PASSWORD, 'demo')
  }

  return (
    <AuthLayout title="Connexion" description="Content de te revoir ! Connecte-toi pour retrouver ton budget.">
      {sessionExpired && !serverError && (
        <FormMessage tone="info">Ta session a expiré. Reconnecte-toi pour continuer.</FormMessage>
      )}
      <FormMessage>{serverError}</FormMessage>
      {slow && <FormMessage tone="info">Le serveur se réveille, cela peut prendre jusqu'à une minute…</FormMessage>}

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
        <SubmitButton loading={pending === 'form'} disabled={pending !== null} loadingLabel="Connexion…">
          Se connecter
        </SubmitButton>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs font-medium tracking-wide text-muted uppercase" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        ou
        <span className="h-px flex-1 bg-line" />
      </div>

      <Button
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={handleDemo}
        disabled={pending !== null}
        loading={pending === 'demo'}
        loadingLabel="Connexion au compte démo…"
      >
        Essayer avec le compte démo
      </Button>

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
