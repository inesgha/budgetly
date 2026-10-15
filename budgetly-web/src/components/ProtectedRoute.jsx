import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import LoadingScreen from './LoadingScreen'

// Pages réservées aux utilisateurs connectés
export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Le token est en cours de vérification (/api/auth/me) : on ne sait pas encore
  if (loading) {
    return <LoadingScreen />
  }

  // On retient la page demandée pour y revenir après la connexion
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
