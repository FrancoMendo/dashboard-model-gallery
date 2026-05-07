import { createContext, useContext, useState, ReactNode } from 'react'

interface AuthContextType {
  user: string | null
  login: (email: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(
    () => sessionStorage.getItem('user')
  )

  function login(email: string, password: string): boolean {
    // Stub auth — replace with real API call
    if (email && password.length >= 4) {
      setUser(email)
      sessionStorage.setItem('user', email)
      return true
    }
    return false
  }

  function logout() {
    setUser(null)
    sessionStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
