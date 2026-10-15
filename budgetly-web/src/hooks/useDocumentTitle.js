import { useEffect } from 'react'

// Titre de l'onglet : "Transactions · Budgetly" (utile aussi aux lecteurs d'écran)
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Budgetly` : 'Budgetly'
  }, [title])
}
