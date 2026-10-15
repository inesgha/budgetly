import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircleIcon, CheckCircleIcon, XIcon } from '../components/icons'
import { ToastContext } from './toast-context'

const DURATION_MS = { success: 4000, error: 7000 }

// Petits messages temporaires en bas de l'écran ("Transaction ajoutée", erreurs…)
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const show = useCallback((message, tone) => {
    nextId.current += 1
    const id = nextId.current
    // 3 messages au maximum à l'écran
    setToasts((current) => [...current.slice(-2), { id, message, tone }])
  }, [])

  const value = useMemo(
    () => ({
      success: (message) => show(message, 'success'),
      error: (message) => show(message, 'error'),
    }),
    [show],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Zone toujours présente : les lecteurs d'écran annoncent les messages qui y apparaissent */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:inset-x-auto md:right-6 md:bottom-6 md:items-end"
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function Toast({ toast, onDismiss }) {
  const { id, message, tone } = toast
  const isError = tone === 'error'

  useEffect(() => {
    const timeoutId = setTimeout(() => onDismiss(id), DURATION_MS[tone])
    return () => clearTimeout(timeoutId)
  }, [id, tone, onDismiss])

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-control bg-ink py-3 pr-2 pl-4 text-sm text-white shadow-lg shadow-ink/20"
      data-surface="dark"
    >
      {isError ? (
        <AlertCircleIcon className="mt-px size-5 shrink-0 text-[#FF9C8F]" />
      ) : (
        <CheckCircleIcon className="mt-px size-5 shrink-0 text-[#6FD3A0]" />
      )}
      <p className="flex-1 py-px">{message}</p>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label="Fermer le message"
        className="-my-1 grid size-8 shrink-0 place-items-center rounded-[9px] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <XIcon className="size-4" />
      </button>
    </div>
  )
}
