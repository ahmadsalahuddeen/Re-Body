// next.config.js
// ─────────────────────────────────────────────────────────────────────────────
// Next.js configuration with PWA support via next-pwa.
//
// PWA SETUP:
// next-pwa wraps the Next.js config and auto-generates:
//   - public/sw.js          (service worker)
//   - public/workbox-*.js   (Workbox cache strategy helpers)
// These are generated at build time (`npm run build`), not in dev mode.
// That's why `disable: process.env.NODE_ENV === 'development'` — service
// workers in dev mode break hot reload and cause confusing cache issues.
//
// RUNTIME CACHING STRATEGY:
// Different assets need different caching approaches:
//   - Google Fonts    → CacheFirst (fonts don't change, cache forever)
//   - Supabase images → NetworkFirst (signed URLs expire after 1hr, always try network)
//   - YouTube         → NetworkOnly (can't cache iframes, and YouTube changes)
//   - Static assets   → StaleWhileRevalidate (serve from cache, update in background)
//
// TO ADD A NEW MODULE:
// No config changes needed. Just add routes in app/ — Next.js handles routing automatically.
// ─────────────────────────────────────────────────────────────────────────────

const withPWA = require('next-pwa')({
  dest: 'public',         // Output: public/sw.js and public/workbox-*.js
  register: true,         // Auto-register the service worker in the browser
  skipWaiting: true,      // New SW activates immediately (no waiting for old tabs to close)
  disable: process.env.NODE_ENV === 'development', // Off in dev to avoid cache confusion

  runtimeCaching: [
    {
      // Google Fonts — these URLs are permanent, cache aggressively
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,                      // Only a few font files
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year — fonts don't change
        },
      },
    },
    {
      // Supabase signed image URLs — always try network first because the URLs expire.
      // Falls back to cache if offline.
      urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-images',
        networkTimeoutSeconds: 10, // Fall back to cache if network takes > 10s
      },
    },
    {
      // YouTube embeds — can't be cached meaningfully, always require network
      urlPattern: /^https:\/\/www\.youtube\.com\/.*/i,
      handler: 'NetworkOnly',
    },
    {
      // All other static assets (JS, CSS, images, fonts) — serve from cache,
      // update in background so the next visit gets fresh content
      urlPattern: /\.(?:js|css|png|jpg|jpeg|svg|gif|woff2?)$/i,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'static-assets' },
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow Next.js <Image> to optimize images from Supabase Storage.
    // The pattern matches signed URL paths: /storage/v1/object/sign/**
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/sign/**',
      },
    ],
  },
}

module.exports = withPWA(nextConfig)
