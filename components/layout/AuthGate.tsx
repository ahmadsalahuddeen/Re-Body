// components/layout/AuthGate.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The entry point guard for the entire app.
//
// RENDERS:
//   → Spinner    while checking for existing session (isLoading)
//   → AuthScreen if no user and not in demo mode
//   → App        if authenticated (either real user or demo mode)
//
// HOW IT TRIGGERS DATA LOAD:
// Once auth is confirmed (user or isDemoMode is truthy), it calls loadAll()
// to fetch weights, habits, and photos into the global store.
// This is the single place where the initial data load happens.
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useData } from '@/hooks/useData'
import { AuthScreen } from '@/components/layout/AuthScreen'

interface AuthGateProps {
  children: React.ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const { user, isDemoMode, isLoading } = useAuth()
  const { loadAll } = useData()

  // Trigger the initial data fetch once we know who the user is.
  // Runs when: user logs in, demo mode is entered, or on page refresh with existing session.
  useEffect(() => {
    if (user || isDemoMode) {
      loadAll()
    }
  }, [user, isDemoMode]) // eslint-disable-line react-hooks/exhaustive-deps
  // ^ Intentional: loadAll is stable but we don't want it in deps to avoid loops

  // ── LOADING STATE ─────────────────────────────────────────────────────────
  // Show a minimal spinner while Supabase checks for an existing session.
  // This prevents a flash of the login screen for already-authenticated users.
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* Spinning ring — uses Tailwind's animate-spin */}
          <div className="w-8 h-8 rounded-full border-2 border-border border-t-accent animate-spin" />
          <span className="font-display text-ink-muted tracking-[0.25em] uppercase"
            style={{ fontSize: '11px' }}>
            LOADING
          </span>
        </div>
      </div>
    )
  }

  // ── NOT AUTHENTICATED ─────────────────────────────────────────────────────
  if (!user && !isDemoMode) {
    return <AuthScreen />
  }

  // ── AUTHENTICATED ─────────────────────────────────────────────────────────
  // Render the app — children = main page content + BottomNav (from layout.tsx)
  return <>{children}</>
}
