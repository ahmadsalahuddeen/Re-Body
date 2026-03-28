// next.config.js
// ─────────────────────────────────────────────────────────────────────────────
// Next.js configuration with PWA support (next-pwa).
// PWA is disabled in development to avoid service worker conflicts.
// To add a new module later, just add a new route under /app — no config needed.
// ─────────────────────────────────────────────────────────────────────────────

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // Disable SW in dev so hot-reload works cleanly
  disable: process.env.NODE_ENV === 'development',
  // Cache strategies for different asset types
  runtimeCaching: [
    {
      // Google Fonts — cache first (fonts rarely change)
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      // Supabase signed image URLs — network first (URLs expire after 1hr)
      urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
      handler: 'NetworkFirst',
      options: { cacheName: 'supabase-images', networkTimeoutSeconds: 10 },
    },
    {
      // YouTube embeds — network only (can't cache iframes)
      urlPattern: /^https:\/\/www\.youtube\.com\/.*/i,
      handler: 'NetworkOnly',
    },
    {
      // All other static assets — stale while revalidate
      urlPattern: /\.(?:js|css|png|jpg|jpeg|svg|gif|woff2?)$/i,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'static-assets' },
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow Supabase storage images to be optimized by Next.js
  images: {
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
