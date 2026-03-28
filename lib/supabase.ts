// lib/supabase.ts
// ─────────────────────────────────────────────────────────────────────────────
// BROWSER-ONLY Supabase client factory.
//
// ✅ Safe to import in:  'use client' components, hooks, lib/store.tsx
// ❌ Do NOT import in:   Server Components, Route Handlers, middleware
//
// WHY TWO FILES?
// Next.js enforces a hard boundary between client and server code.
// `next/headers` (used by the server client) crashes when bundled
// into client-side JS. Keeping them in separate files ensures the
// bundler never accidentally includes server code in the client bundle.
//
// For server-side Supabase usage → lib/supabase-server.ts
// For middleware                  → inline client in middleware.ts
// ─────────────────────────────────────────────────────────────────────────────

import { createBrowserClient } from '@supabase/ssr'

// These are NEXT_PUBLIC_ prefixed so they're safe to expose in the browser.
// They don't give admin access — Row Level Security enforces data isolation.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Creates a Supabase client for use in browser/client-side code.
 *
 * @example
 * // Inside any 'use client' hook or component:
 * const supabase = createClient()
 * const { data } = await supabase.from('weight_logs').select('*')
 */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
