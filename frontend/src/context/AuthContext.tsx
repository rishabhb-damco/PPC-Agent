import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { loginUser, getMe } from '../services/api'

interface User {
  email: string
  full_name: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
})

const TOKEN_KEY = 'ppc_agent_token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [isLoading, setIsLoading] = useState(true)

  // On mount, if a token exists, validate it and fetch user info
  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }
    getMe()
      .then(r => setUser(r.data))
      .catch(() => {
        // Token is invalid or expired — clear it
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const res = await loginUser(email, password)
    const accessToken: string = res.data.access_token
    localStorage.setItem(TOKEN_KEY, accessToken)
    setToken(accessToken)
    const me = await getMe(accessToken)
    setUser(me.data)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!token && !!user, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
