import { SpinnerIcon } from '../icons'

// Bouton principal, désactivé pendant l'envoi avec un texte d'attente ("Connexion…")
export default function SubmitButton({ loading, loadingLabel, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="inline-flex w-full items-center justify-center gap-2 rounded-control bg-primary px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading && <SpinnerIcon className="size-4" />}
      {loading ? loadingLabel : children}
    </button>
  )
}
