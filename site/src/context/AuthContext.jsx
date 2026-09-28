import { createContext, useContext, useEffect, useState } from 'react'
import * as api from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    api.getMe()
      .then(setUser)
      .catch(() => api.logout())
      .finally(() => setReady(true))
  }, [])

  const login = async (email, password) => {
    const u = await api.login(email, password)
    setUser(u)
    return u
  }

  const logout = () => {
    api.logout()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, ready, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
