import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from './api'

export type User = {
  id: string
  name: string
  email: string
}

type AuthCtx = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const me = await api<{ user: User | null }>('/api/auth/me')
        setUser(me.user)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      loading,
      async login(email, password) {
        const res = await api<{ user: User }>('/api/auth/login', { method: 'POST', json: { email, password } })
        setUser(res.user)
      },
      async signup(name, email, password) {
        const res = await api<{ user: User }>('/api/auth/signup', { method: 'POST', json: { name, email, password } })
        setUser(res.user)
      },
      async logout() {
        await api('/api/auth/logout', { method: 'POST' })
        setUser(null)
      },
    }),
    [user, loading],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}

