import { Component } from 'react'
import Logo from './Logo'
import { AlertTriangleIcon } from './icons'

/**
 * Attrape les erreurs JavaScript pendant l'affichage d'un composant enfant et montre un message
 * à la place d'une page blanche. React ne permet de le faire qu'avec un composant de classe.
 *
 * variant "page" : plein écran (autour de toute l'app) ; "inline" : dans la zone de contenu du Layout.
 * resetKey : quand il change (ex. l'adresse de la page), l'erreur est oubliée et on réessaie d'afficher.
 */
export default class ErrorBoundary extends Component {
  state = { error: null, resetKey: this.props.resetKey }

  static getDerivedStateFromError(error) {
    return { error }
  }

  static getDerivedStateFromProps(props, state) {
    // Changement de page : on repart sans erreur
    if (props.resetKey !== state.resetKey) {
      return { error: null, resetKey: props.resetKey }
    }
    return null
  }

  componentDidCatch(error, info) {
    // Visible dans la console du navigateur (F12) pour le développeur
    console.error('Erreur d’affichage attrapée par ErrorBoundary :', error, info.componentStack)
  }

  render() {
    if (!this.state.error) {
      return this.props.children
    }

    const content = (
      <div role="alert" className="max-w-md text-center">
        <span className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-danger-light text-danger">
          <AlertTriangleIcon className="size-7" />
        </span>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Oups, quelque chose s'est mal passé</h1>
        <p className="mt-2 text-muted">
          Une erreur inattendue a empêché l'affichage de cette page. Recharger la page suffit en général.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-control bg-primary px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Recharger la page
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-control border border-line bg-surface px-5 py-3 font-semibold text-ink transition-colors hover:bg-primary-light hover:text-primary-hover"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    )

    if (this.props.variant === 'inline') {
      return <div className="grid place-items-center py-16">{content}</div>
    }

    return (
      <main className="grid min-h-dvh place-items-center bg-background px-4 py-12">
        <div className="flex flex-col items-center gap-10">
          <Logo />
          {content}
        </div>
      </main>
    )
  }
}
