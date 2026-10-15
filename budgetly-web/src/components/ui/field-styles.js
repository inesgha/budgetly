// Styles communs aux champs (input, select) : bordure rouge en cas d'erreur, anneau violet au focus.
// Attention : deux classes Tailwind qui règlent la même propriété (ex. text-base et text-3xl) sur un même
// élément ne s'annulent pas dans l'ordre écrit ; d'où l'option "large" plutôt qu'une classe ajoutée après.

export function fieldClasses(error, { large = false } = {}) {
  const state = error
    ? 'border-danger focus:border-danger focus:ring-danger/15'
    : 'border-line hover:border-muted/40 focus:border-primary focus:ring-primary/20'
  const size = large ? 'py-3 font-display text-3xl font-semibold tracking-tight' : 'py-2.5 text-base'
  return `block w-full rounded-control border bg-surface px-3.5 text-ink transition-colors placeholder:text-muted/70 focus:ring-3 focus:outline-none disabled:cursor-not-allowed disabled:bg-background disabled:text-muted ${size} ${state}`
}

export const labelClasses = 'block text-sm font-medium text-ink'
