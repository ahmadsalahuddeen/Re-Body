// lib/supabase.ts
// ─────────────────────────────────────────────────────────────────────────────
// Supabase client factory.
// We need TWO separate clients in Next.js 14 App Router:
//   1. Browser client — used in Client Components ('use client')
//   2. Server client — used in Server Components & Route Handlers
//
// Both use Row Level Security (RLS) — users only ever see their own data.
// ─────────────────────────────────────────────────────────────────────────────

import { createBrowserClient } from '@supabase/ssr'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Read from environment variables (set in .env.local)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Browser client — singleton pattern for Client Components.
 * Import `supabase` from this file in any 'use client' component.
 */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

/**
 * Server client — created fresh per request in Server Components and API routes.
 * Reads/writes cookies for session management.
 */
export function createServerClientInstance() {
  const cookieStore = cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // Server Components can't set cookies — handled by middleware
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch {}
      },
    },
  })
}
