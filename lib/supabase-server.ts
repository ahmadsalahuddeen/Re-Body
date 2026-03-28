// lib/supabase-server.ts
// ─────────────────────────────────────────────────────────────────────────────
// SERVER-ONLY Supabase client factory.
//
// ✅ Safe to import in:  Server Components, Route Handlers (app/api/*)
// ❌ Do NOT import in:   'use client' files, hooks, client components
// ❌ Do NOT import in:   middleware.ts (Edge runtime — use inline client there)
//
// WHY IT'S SEPARATE:
// This file imports `cookies` from 'next/headers' which is a Node.js-only
// API. If imported in client-side code it throws:
//   "You're importing a component that needs next/headers"
//
// HOW IT WORKS:
// The server client reads and writes HTTP cookies on the request/response
// cycle. This is how Supabase maintains the user session between page loads
// without exposing tokens to JavaScript.
// ─────────────────────────────────────────────────────────────────────────────

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers' // ← SERVER ONLY — this line causes the crash if imported client-side

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Creates a server-side Supabase client for the current request.
 * Must be called inside a Server Component or Route Handler function
 * (not at module level) so it has access to the current request's cookies.
 *
 * @example
 * // Inside a Server Component:
 * const supabase = createServerSupabaseClient()
 * const { data: { user } } = await supabase.auth.getUser()
 */
export function createServerSupabaseClient() {
  // cookies() reads from the incoming HTTP request headers
  const cookieStore = cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      // Read a cookie by name from the request
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      // Write a cookie to the response
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // Server Components render once and can't mutate the response headers.
          // Cookie writes in Server Components are a no-op — middleware handles
          // the actual refresh via the inline client in middleware.ts.
        }
      },
      // Remove a cookie by overwriting it with an empty value
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch {
          // Same as above — silently ignored in Server Components
        }
      },
    },
  })
}
