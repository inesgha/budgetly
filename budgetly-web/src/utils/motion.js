// Vrai si l'utilisateur a demandé à son système de réduire les animations
export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}
