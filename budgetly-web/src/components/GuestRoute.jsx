import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import LoadingScreen from './LoadingScreen'

// Pages réservées aux visiteurs (connexion, inscription) : un utilisateur connecté est renvoyé dans l'app.
// C'est aussi ce qui redirige juste après une connexion réussie, vers la page demandée au départ.
export default function GuestRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingScreen />
  }

  if (user) {
    return <Navigate to={location.state?.from?.pathname ?? '/'} replace />
  }

  return <Outlet />
}
