import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { pb } from './pocketbase'
import type { UserRecord } from './types'

interface AuthValue {
  user: UserRecord | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserRecord | null>(
    () => (pb.authStore.record as UserRecord | null) ?? null,
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Keep React in step with the token in localStorage, including changes
    // made in another tab.
    const unsubscribe = pb.authStore.onChange(() => {
      setUser((pb.authStore.record as UserRecord | null) ?? null)
    })

    // A stored token may have expired while the app was closed. Refreshing it
    // both validates it and pulls in any profile changes.
    const validate = async () => {
      if (pb.authStore.isValid) {
        try {
          await pb.collection('users').authRefresh()
        } catch {
          pb.authStore.clear()
        }
      }
      setLoading(false)
    }
    void validate()

    return unsubscribe
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    await pb.collection('users').authWithPassword(email, password)
  }, [])

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      await pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        name,
      })
      await pb.collection('users').authWithPassword(email, password)
    },
    [],
  )

  const logout = useCallback(() => {
    pb.authStore.clear()
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside an AuthProvider')
  return context
}
