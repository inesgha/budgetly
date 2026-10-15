import { useSlowFlag } from '../hooks/useSlowFlag'
import Logo from './Logo'
import { SpinnerIcon } from './icons'

// Écran du démarrage (vérification de la session) ; au-delà de 5 s, on explique l'attente
export default function LoadingScreen() {
  const slow = useSlowFlag(true)

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4">
      <div role="status" className="flex max-w-xs flex-col items-center gap-4 text-center">
        <Logo />
        <p className="flex items-center gap-2 text-sm text-muted">
          <SpinnerIcon className="size-4 text-primary" />
          Chargement…
        </p>
        {slow && <p className="text-sm text-muted">Le serveur se réveille, cela peut prendre jusqu'à une minute…</p>}
      </div>
    </div>
  )
}
