import { useEffect, useState } from 'react'

/** Renvoie value seulement après delay ms sans changement (évite un appel à l'API par touche tapée) */
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timeoutId)
  }, [value, delay])

  return debounced
}
