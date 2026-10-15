import { Suspense, useMemo } from 'react'
import { NavLink, Outlet, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { monthSearch } from '../hooks/useSelectedMonth'
import { useUnreadAlerts } from '../hooks/useUnreadAlerts'
import Logo from './Logo'
import { BellIcon, ChartIcon, HomeIcon, LogoutIcon, SettingsIcon, TransactionsIcon, WalletIcon } from './icons'
import Skeleton, { LoadingRegion } from './ui/Skeleton'

const NAV_ITEMS = [
  { to: '/', label: 'Tableau de bord', shortLabel: 'Accueil', Icon: HomeIcon, end: true },
  { to: '/transactions', label: 'Transactions', shortLabel: 'Transactions', Icon: TransactionsIcon },
  { to: '/budgets', label: 'Budgets', shortLabel: 'Budgets', Icon: WalletIcon },
  { to: '/stats', label: 'Statistiques', shortLabel: 'Stats', Icon: ChartIcon },
  { to: '/settings', label: 'Paramètres', shortLabel: 'Réglages', Icon: SettingsIcon },
]

// "octobre 2026" -> "Octobre 2026"
function formatCurrentMonth() {
  const label = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date())
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export default function Layout() {
  const { user, logout } = useAuth()
  const firstName = user?.name?.trim().split(/\s+/)[0] ?? ''
  const { count: unreadCount, refresh: refreshAlerts } = useUnreadAlerts()
  // Le mois choisi (?month=&year=) suit l'utilisateur d'une page à l'autre
  const [searchParams] = useSearchParams()
  const search = monthSearch(searchParams)
  // Fourni aux pages (useOutletContext) : recharger la pastille après une modification
  const outletContext = useMemo(() => ({ refreshAlerts }), [refreshAlerts])

  return (
    <div className="min-h-dvh md:pl-60">
      <a
        href="#contenu"
        className="sr-only z-50 rounded-control bg-primary px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Aller au contenu
      </a>

      <Sidebar user={user} onLogout={logout} search={search} />

      <div className="flex min-h-dvh flex-col pb-24 md:pb-0">
        <header className="flex items-center justify-between gap-4 px-4 pt-5 pb-4 md:px-8 md:pt-8 md:pb-6">
          <div className="flex min-w-0 items-center gap-3">
            <Logo showName={false} className="md:hidden" />
            <div className="min-w-0">
              <p className="truncate font-display text-xl font-semibold tracking-tight text-ink md:text-2xl">
                Bonjour {firstName},
              </p>
              <p className="text-sm text-muted">{formatCurrentMonth()}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <AlertsButton count={unreadCount} search={search} />
            {/* Sur mobile, la barre latérale (et son bouton) n'est pas affichée */}
            <button
              type="button"
              onClick={logout}
              aria-label="Se déconnecter"
              className="grid size-11 place-items-center rounded-control border border-line bg-surface text-ink transition-colors hover:bg-primary-light hover:text-primary-hover md:hidden"
            >
              <LogoutIcon />
            </button>
          </div>
        </header>

        <main id="contenu" tabIndex={-1} className="flex-1 px-4 pb-8 focus:outline-none md:px-8">
          {/* Pendant le téléchargement d'une page (chargement à la demande) */}
          <Suspense
            fallback={
              <LoadingRegion label="Chargement de la page" className="space-y-6">
                <Skeleton className="h-9 w-56" />
                <Skeleton className="h-32" rounded="rounded-card" />
              </LoadingRegion>
            }
          >
            <Outlet context={outletContext} />
          </Suspense>
        </main>
      </div>

      <MobileNav search={search} />
    </div>
  )
}

function Sidebar({ user, onLogout, search }) {
  return (
    <aside
      data-surface="dark"
      className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-ink text-white md:flex"
    >
      <div className="px-5 pt-6 pb-8">
        <Logo tone="light" />
      </div>

      <nav aria-label="Navigation principale" className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ to, label, Icon, end }) => (
            <li key={to}>
              <NavLink
                to={{ pathname: to, search }}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-4">
        <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
        <p className="truncate text-xs text-white/60">{user?.email}</p>
        <button
          type="button"
          onClick={onLogout}
          className="mt-3 flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-sm font-medium text-white/75 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogoutIcon />
          Se déconnecter
        </button>
      </div>
    </aside>
  )
}

function MobileNav({ search }) {
  return (
    <nav
      aria-label="Navigation principale"
      data-surface="dark"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-ink pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto flex max-w-lg">
        {NAV_ITEMS.map(({ to, label, shortLabel, Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={{ pathname: to, search }}
              end={end}
              aria-label={label}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-1 pt-2 pb-2.5 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-white' : 'text-white/65 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`grid h-8 w-12 place-items-center rounded-control transition-colors ${
                      isActive ? 'bg-primary' : ''
                    }`}
                  >
                    <Icon />
                  </span>
                  <span aria-hidden="true">{shortLabel}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function AlertsButton({ count, search }) {
  const navigate = useNavigate()
  const label =
    count > 0 ? `Alertes : ${count} non lue${count > 1 ? 's' : ''}` : 'Alertes : aucune non lue'

  return (
    // Les alertes concernent les budgets : en attendant une page dédiée, la cloche y mène
    <button
      type="button"
      onClick={() => navigate(`/budgets${search}`)}
      aria-label={label}
      className="relative grid size-11 place-items-center rounded-control border border-line bg-surface text-ink transition-colors hover:bg-primary-light hover:text-primary-hover"
    >
      <BellIcon />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-1.5 -right-1.5 h-5 min-w-5 rounded-full bg-danger px-1 text-center text-[11px] leading-5 font-semibold text-white ring-2 ring-background"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}
