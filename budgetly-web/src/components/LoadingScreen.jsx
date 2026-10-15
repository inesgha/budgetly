import Logo from './Logo'
import { SpinnerIcon } from './icons'

export default function LoadingScreen() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4">
      <div role="status" className="flex flex-col items-center gap-4">
        <Logo />
        <p className="flex items-center gap-2 text-sm text-muted">
          <SpinnerIcon className="size-4 text-primary" />
          Chargement…
        </p>
      </div>
    </div>
  )
}
