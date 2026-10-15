import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import GuestRoute from './components/GuestRoute'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import RegisterPage from './pages/RegisterPage'

// Pages de l'app chargées à la demande : Recharts (lourd) n'est téléchargé qu'à l'ouverture du tableau de bord.
// Le <Suspense> qui affiche le chargement est dans Layout, autour du contenu.
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'))
const BudgetsPage = lazy(() => import('./pages/BudgetsPage'))
const StatsPage = lazy(() => import('./pages/StatsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

export default function App() {
  return (
    <Routes>
      {/* Visiteurs uniquement : un utilisateur connecté est renvoyé vers l'app */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Utilisateurs connectés uniquement, avec la barre latérale et l'en-tête */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/budgets" element={<BudgetsPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
