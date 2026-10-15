import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { XIcon } from '../icons'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Fenêtre modale accessible :
 * - role="dialog" + aria-modal + titre relié par aria-labelledby ;
 * - focus piégé : Tab et Maj+Tab tournent à l'intérieur ;
 * - Échap ou clic sur le fond : fermeture ;
 * - à la fermeture, le focus revient sur le bouton qui l'avait ouverte.
 * Le premier élément marqué data-autofocus reçoit le focus à l'ouverture.
 */
export default function Modal({ open = true, onClose, title, description, size = 'md', children }) {
  const panelRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const titleId = useId()
  const descriptionId = useId()

  // Toujours la dernière version de onClose, sans relancer l'effet d'ouverture
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) {
      return
    }

    const panel = panelRef.current
    const previouslyFocused = document.activeElement
    const focusables = () => [...panel.querySelectorAll(FOCUSABLE)]

    ;(panel.querySelector('[data-autofocus]') ?? focusables()[0] ?? panel).focus()

    // Empêche la page derrière de défiler
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current?.()
        return
      }
      if (event.key !== 'Tab') {
        return
      }

      const items = focusables()
      if (items.length === 0) {
        event.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const outside = !panel.contains(document.activeElement)

      if (event.shiftKey && (document.activeElement === first || outside)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || outside)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [open])

  if (!open) {
    return null
  }

  const widths = { sm: 'sm:max-w-md', md: 'sm:max-w-lg' }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 sm:items-center sm:p-6"
      onMouseDown={(event) => {
        // Clic sur le fond (et pas dans la fenêtre) : fermeture
        if (event.target === event.currentTarget) onCloseRef.current?.()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`max-h-[92dvh] w-full overflow-y-auto rounded-t-card bg-surface p-5 shadow-xl focus:outline-none sm:rounded-card sm:p-6 ${widths[size]}`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="font-display text-xl font-bold tracking-tight text-ink">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-muted">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onCloseRef.current?.()}
            aria-label="Fermer"
            className="-mt-1 -mr-1 grid size-10 shrink-0 place-items-center rounded-control text-muted transition-colors hover:bg-background hover:text-ink"
          >
            <XIcon />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
