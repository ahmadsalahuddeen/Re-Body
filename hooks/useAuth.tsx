// hooks/useAuth.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Authentication state and actions — the single source of truth for "who is
// the current user?"
//
// WHAT THIS HANDLES:
//   - Supabase email/password sign in and sign up
//   - Demo mode (localStorage flag, no Supabase account needed)
//   - Session persistence (checks for existing session on mount)
//   - Auth state changes (fires when session is created or destroyed)
//
// HOW TO USE:
//   const { user, isDemoMode, signIn, signOut } = useAuth()
//
// NOTE — .tsx extension:
//   This file returns JSX (AuthContext.Provider) so it must be .tsx not .ts.
//   TypeScript only processes JSX in files with the .tsx extension.
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import {
  useState,
  useEffect,
  createContext,
  useContext,
  type ReactNode, // imported explicitly — avoids needing "import React" just for the type
} from 'react'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

// ── AUTH STATE SHAPE ──────────────────────────────────────────────────────────

interface AuthState {
  user: User | null         // Supabase User object, or null if not authenticated
  isDemoMode: boolean       // True if user chose demo mode (no account)
  isLoading: boolean        // True while checking for an existing session on mount
  /** Attempt sign in — returns an error message string, or null on success */
  signIn: (email: string, password: string) => Promise<string | null>
  /** Attempt sign up — returns an error message string, or null on success */
  signUp: (email: string, password: string) => Promise<string | null>
  /** Signs out (or clears demo flag) and redirects to auth screen */
  signOut: () => Promise<void>
  /** Activates demo mode — sets a localStorage flag so it persists on refresh */
  enterDemoMode: () => void
}

// ── CONTEXT ───────────────────────────────────────────────────────────────────

// null default — useAuth() throws if called outside AuthProvider (fail fast)
const AuthContext = createContext<AuthState | null>(null)

/** Provides auth state to the entire app. Must wrap the root layout. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]           = useState<User | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true) // Start true — checking session

  // createClient() is called inside the component, not at module level,
  // so it always runs in the browser (safe for SSR)
  const supabase = createClient()

  useEffect(() => {
    // ── 1. Check for demo mode flag from a previous session ───────────────
    // If the user clicked "demo mode" last time, skip Supabase entirely
    if (localStorage.getItem('pbr_demo') === '1') {
      setIsDemoMode(true)
      setIsLoading(false)
      return
    }

    // ── 2. Check for an existing Supabase session ─────────────────────────
    // getSession() reads from the cookie set by Supabase on last login.
    // If a valid session exists, the user doesn't need to log in again.
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setIsLoading(false)
    })

    // ── 3. Subscribe to auth state changes ────────────────────────────────
    // Fires on: sign in, sign out, token refresh, password reset, etc.
    // This keeps `user` in sync if auth changes in another tab.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    // Cleanup: unsubscribe when the component unmounts (never in practice since
    // this wraps the whole app, but good practice)
    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // ^ Empty deps: we only want to run this once on mount.
  //   `supabase` is stable (same client instance), so omitting it is safe.

  // ── AUTH ACTIONS ──────────────────────────────────────────────────────────

  /**
   * Sign in with email and password.
   * Returns null on success, or an error message string to display in the UI.
   */
  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
    // On success: onAuthStateChange fires → sets user → AuthGate renders the app
  }

  /**
   * Create a new account.
   * Returns null on success, or an error message string.
   * Note: Supabase may require email confirmation depending on your project settings.
   */
  const signUp = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({ email, password })
    return error?.message ?? null
  }

  /**
   * Sign out the current user.
   * Clears the demo flag if in demo mode, otherwise calls Supabase signOut.
   * After this, onAuthStateChange fires → user becomes null → AuthGate shows login.
   */
  const signOut = async (): Promise<void> => {
    if (isDemoMode) {
      localStorage.removeItem('pbr_demo')
      setIsDemoMode(false)
    } else {
      await supabase.auth.signOut()
    }
  }

  /**
   * Activate demo mode — no Supabase account needed.
   * Sets a flag in localStorage so demo mode survives page refreshes.
   * All data is stored locally in localStorage via lib/demo.ts.
   */
  const enterDemoMode = (): void => {
    localStorage.setItem('pbr_demo', '1')
    setIsDemoMode(true)
    // AuthGate detects isDemoMode=true and renders the app immediately
  }

  return (
    <AuthContext.Provider
      value={{ user, isDemoMode, isLoading, signIn, signUp, signOut, enterDemoMode }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Access auth state from any Client Component.
 * Throws if used outside AuthProvider (catches setup mistakes early).
 *
 * @example
 * const { user, isDemoMode, signOut } = useAuth()
 * if (isDemoMode) return <p>Demo user</p>
 * return <p>{user?.email}</p>
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
