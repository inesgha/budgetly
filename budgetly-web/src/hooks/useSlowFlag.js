import { useEffect, useState } from 'react'

/**
 * Passe à true quand "active" reste vrai plus de delay ms (ex. une requête qui traîne),
 * et revient à false dès que "active" redevient faux.
 * Sert à prévenir que le serveur gratuit se réveille, au lieu de laisser croire que l'app est bloquée.
 */
export function useSlowFlag(active, delay = 5000) {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    if (!active) return
    const timeoutId = setTimeout(() => setSlow(true), delay)
    // Fin de l'attente (ou nouvelle attente) : minuteur annulé et indicateur remis à zéro
    return () => {
      clearTimeout(timeoutId)
      setSlow(false)
    }
  }, [active, delay])

  return Boolean(active) && slow
}
