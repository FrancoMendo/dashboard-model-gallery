import { createContext, useContext, useState, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ProductionSummary {
  id: string
  title: string
  description: string | null
  date: string | null
  location: string | null
  type: string | null
  coverImage: string | null
  photoCount: number
  createdAt: number
}

export interface UserStats {
  productions: ProductionSummary[]
  productionCount: number
  imageCount: number
  types: string[]
}

interface AuthContextType {
  user: User | null
  token: string | null
  userStats: UserStats | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  refreshStats: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: any }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('token'))

  const [userStats, setUserStats] = useState<UserStats | null>(() => {
    const saved = sessionStorage.getItem('userStats')
    return saved ? JSON.parse(saved) : null
  })

  const fetchStats = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`${API}/productions/user/${userId}`)
      if (!res.ok) return
      const data = await res.json() as UserStats
      setUserStats(data)
      sessionStorage.setItem('userStats', JSON.stringify(data))
    } catch {
      // stats are non-critical — silently fail
    }
  }, [])

  const refreshStats = useCallback(async () => {
    const savedUser = sessionStorage.getItem('user')
    if (!savedUser) return
    const { id } = JSON.parse(savedUser) as User
    await fetchStats(id)
  }, [fetchStats])

  async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error || 'Error al iniciar sesión' }
      }

      setUser(data.user)
      setToken(data.token)
      sessionStorage.setItem('user', JSON.stringify(data.user))
      sessionStorage.setItem('token', data.token)

      await fetchStats(data.user.id)

      return { success: true }
    } catch (err) {
      console.error(err)
      return { success: false, error: 'Error de red' }
    }
  }

  function logout() {
    setUser(null)
    setToken(null)
    setUserStats(null)
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('userStats')
  }

  return (
    <AuthContext.Provider value={{ user, token, userStats, login, logout, refreshStats }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
