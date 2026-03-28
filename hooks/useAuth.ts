// hooks/useAuth.ts
// ─────────────────────────────────────────────────────────────────────────────
// Auth state hook. Wraps Supabase auth + demo mode into one interface.
// Use this anywhere you need to check if a user is logged in.
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  isDemoMode: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  enterDemoMode: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Check for demo mode flag first
    if (localStorage.getItem('pbr_demo') === '1') {
      setIsDemoMode(true)
      setIsLoading(false)
      return
    }

    // Check existing Supabase session
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setIsLoading(false)
    })

    // Listen for auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }

  const signUp = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({ email, password })
    return error?.message ?? null
  }

  const signOut = async () => {
    localStorage.removeItem('pbr_demo')
    setIsDemoMode(false)
    await supabase.auth.signOut()
  }

  const enterDemoMode = () => {
    localStorage.setItem('pbr_demo', '1')
    setIsDemoMode(true)
  }

  return (
    <AuthContext.Provider value={{ user, isDemoMode, isLoading, signIn, signUp, signOut, enterDemoMode }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
