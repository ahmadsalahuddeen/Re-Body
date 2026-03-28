// components/layout/AuthGate.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Wraps the entire app. Shows login screen if no session, otherwise renders
// children. Handles loading state to prevent flicker.
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

  // Load all data once we have a session
  useEffect(() => {
    if (user || isDemoMode) {
      loadAll()
    }
  }, [user, isDemoMode]) // eslint-disable-line

  // Full-screen loading state — matches app background to prevent flash
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-border border-t-accent animate-spin" />
          <span className="font-display text-label text-ink-muted tracking-widest">
            LOADING
          </span>
        </div>
      </div>
    )
  }

  // No session — show login
  if (!user && !isDemoMode) {
    return <AuthScreen />
  }

  // Authenticated — render app
  return <>{children}</>
}
