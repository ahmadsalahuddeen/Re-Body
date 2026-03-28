// app/layout.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Root layout — wraps the entire app.
// Sets up:
//   - Google Fonts via next/font (no layout shift)
//   - PWA meta tags for iOS/Android home screen install
//   - Global providers (Auth, Store)
//   - Toast notification layer
//   - Bottom navigation (mobile-first)
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata, Viewport } from 'next'
import { Barlow_Condensed, Barlow } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/hooks/useAuth'
import { AppProvider } from '@/lib/store'
import { BottomNav } from '@/components/layout/BottomNav'
import { ToastLayer } from '@/components/ui/ToastLayer'
import { AuthGate } from '@/components/layout/AuthGate'

// ── FONTS ─────────────────────────────────────────────────────────────────────
// next/font automatically self-hosts and eliminates CLS.

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
})

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
})

// ── METADATA ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Project Body Rebirth',
  description: 'Your private daily discipline system.',
  manifest: '/manifest.json',
  // iOS PWA meta tags
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Body Rebirth',
  },
  // Open Graph (if you ever share a link)
  openGraph: {
    title: 'Project Body Rebirth',
    description: 'Daily discipline system.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  // Match app background — prevents white flash on load
  themeColor: '#0A0A0B',
  // Critical for mobile: use interactive-widget to prevent keyboard pushing up layout
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Prevent pinch-zoom on input focus (iOS)
  userScalable: false,
  viewportFit: 'cover', // iPhone notch / home indicator
}

// ── ROOT LAYOUT ───────────────────────────────────────────────────────────────

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${barlowCondensed.variable} ${barlow.variable}`}>
      <head>
        {/* iOS PWA splash / icon — add actual icons to /public for production */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-bg font-body text-ink antialiased">
        {/*
          AuthProvider — manages Supabase session + demo mode flag
          AppProvider  — manages global app state (weights, photos, habits)
          Both are separate concerns: auth vs data
        */}
        <AuthProvider>
          <AppProvider>
            {/*
              AuthGate renders the login screen if no session.
              Once authenticated, renders children + navigation.
            */}
            <AuthGate>
              {/* Main scrollable content area — leaves room for bottom nav */}
              <main className="min-h-dvh pb-24">
                {children}
              </main>

              {/* Sticky bottom navigation — mobile-first */}
              <BottomNav />
            </AuthGate>

            {/* Toast notifications — rendered outside main flow */}
            <ToastLayer />
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
