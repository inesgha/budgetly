import { createContext } from 'react'

// Séparé de AuthContext.jsx : un fichier de composants ne doit exporter que des composants
// (sinon le rechargement à chaud de Vite recharge toute la page).
export const AuthContext = createContext(null)
