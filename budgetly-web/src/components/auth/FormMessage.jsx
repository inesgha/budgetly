import { AlertCircleIcon, InfoIcon } from '../icons'

// Message en haut du formulaire : erreur du serveur (lu tout de suite par les lecteurs d'écran) ou information
export default function FormMessage({ tone = 'error', children }) {
  if (!children) {
    return null
  }

  const isError = tone === 'error'

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`mb-5 flex gap-2.5 rounded-control px-3.5 py-3 text-sm ${
        isError ? 'bg-danger-light text-danger' : 'bg-primary-light text-primary-hover'
      }`}
    >
      {isError ? <AlertCircleIcon className="mt-px size-5 shrink-0" /> : <InfoIcon className="mt-px size-5 shrink-0" />}
      <p>{children}</p>
    </div>
  )
}
