import Logo from '../Logo'
import { BellIcon } from '../icons'

// Mobile : zone sombre en haut, carte blanche en dessous. Ordinateur (≥ 1024 px) : deux colonnes.
export default function AuthLayout({ title, description, children }) {
  return (
    <div className="flex min-h-dvh flex-col bg-ink lg:grid lg:grid-cols-2">
      <section
        data-surface="dark"
        className="px-6 pt-8 pb-14 text-white sm:px-10 lg:flex lg:flex-col lg:justify-between lg:p-14 xl:p-20"
      >
        <Logo tone="light" />

        <div className="mt-10 max-w-md lg:mt-0">
          <h1 className="font-display text-3xl leading-tight font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl">
            Garde le contrôle de ton budget.
          </h1>
          <p className="mt-4 text-base text-white/75 lg:text-lg">
            Suis tes dépenses, fixe tes limites et reçois une alerte avant qu'il ne soit trop tard.
          </p>
        </div>

        <BudgetPreview />
      </section>

      <main className="-mt-6 flex-1 rounded-t-card bg-surface px-6 pt-8 pb-10 sm:px-10 lg:mt-0 lg:flex lg:items-center lg:justify-center lg:rounded-none">
        <div className="mx-auto w-full max-w-sm">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink">{title}</h2>
          {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
          <div className="mt-7">{children}</div>
        </div>
      </main>
    </div>
  )
}

// Aperçu décoratif d'un budget et de son alerte (ordinateur uniquement)
function BudgetPreview() {
  return (
    <div aria-hidden="true" className="hidden max-w-sm lg:block">
      <div className="rounded-card border border-white/10 bg-white/5 p-5">
        <div className="flex items-baseline justify-between">
          <p className="font-medium">Alimentation</p>
          <p className="font-display text-lg font-semibold text-warning">86 %</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[86%] rounded-full bg-warning" />
        </div>
        <p className="mt-2.5 text-sm text-white/60">214,000 / 250,000 DT</p>
      </div>
      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary-soft/15 px-3.5 py-2 text-sm text-primary-soft">
        <BellIcon className="size-4" />
        Alerte : 80 % du budget atteint
      </div>
    </div>
  )
}
