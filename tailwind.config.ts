// tailwind.config.ts
// ─────────────────────────────────────────────────────────────────────────────
// Design token system for Project Body Rebirth.
//
// HOW TO ADD A NEW MODULE:
// Each module can have its own accent color (see `modules` object below).
// The base accent is amber. Communication Rebirth could use blue, etc.
// Just add a new key and use it as: className="text-module-comms"
// ─────────────────────────────────────────────────────────────────────────────

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ── COLORS ──────────────────────────────────────────────────────────────
      colors: {
        // Base dark palette
        bg: {
          DEFAULT: '#0A0A0B',  // deepest background
          2: '#111113',         // card backgrounds
          3: '#181819',         // elevated surfaces
          4: '#1E1E20',         // hover states
        },
        // Border shades
        border: {
          DEFAULT: 'rgba(255,255,255,0.06)',
          bright: 'rgba(255,255,255,0.12)',
          focus: 'rgba(255,255,255,0.24)',
        },
        // Text shades
        ink: {
          DEFAULT: '#F0EDE8',
          sub: 'rgba(240,237,232,0.50)',
          muted: 'rgba(240,237,232,0.28)',
          ghost: 'rgba(240,237,232,0.12)',
        },
        // ── MODULE ACCENT COLORS ─────────────────────────────────────────────
        // Each module gets one accent. Keep it to ONE per module.
        accent: {
          DEFAULT: '#E8A045',             // Face Rebirth — warm amber
          dim: 'rgba(232,160,69,0.12)',
          glow: 'rgba(232,160,69,0.30)',
        },
        // Future module accents — add here when building new modules:
        // comms: '#4A9EBF',              // Communication Rebirth — cool blue
        // body:  '#7BC67E',              // Body Posture — sage green
        // sleep: '#8B7FD4',              // Sleep Rebirth — soft purple

        // UI states
        rest: '#4A9EBF',    // timer rest phase
        success: '#4ade80',
        danger: '#f87171',
      },

      // ── TYPOGRAPHY ──────────────────────────────────────────────────────────
      fontFamily: {
        // Display: editorial, condensed — headlines feel big and confident
        display: ['var(--font-display)', 'sans-serif'],
        // Body: clean, readable — body copy feels airy
        body: ['var(--font-body)', 'sans-serif'],
      },
      fontSize: {
        // Custom editorial scale
        'display-xl': ['72px', { lineHeight: '0.9', letterSpacing: '-0.02em', fontWeight: '900' }],
        'display-lg': ['52px', { lineHeight: '0.95', letterSpacing: '0.01em', fontWeight: '900' }],
        'display-md': ['36px', { lineHeight: '1', letterSpacing: '0.02em', fontWeight: '800' }],
        'display-sm': ['24px', { lineHeight: '1.1', fontWeight: '700' }],
        'label':      ['11px', { lineHeight: '1', letterSpacing: '0.22em', fontWeight: '600' }],
      },

      // ── SPACING ─────────────────────────────────────────────────────────────
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top':    'env(safe-area-inset-top)',
      },

      // ── BORDER RADIUS ───────────────────────────────────────────────────────
      borderRadius: {
        card: '16px',
        pill: '999px',
        thumb: '10px',
      },

      // ── ANIMATIONS ──────────────────────────────────────────────────────────
      keyframes: {
        // Glow breath for primary CTA
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(232,160,69,0.3)' },
          '50%':       { boxShadow: '0 0 50px rgba(232,160,69,0.5), 0 0 80px rgba(232,160,69,0.15)' },
        },
        // Dot pulse for today marker on calendar
        dotPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(232,160,69,0.4)' },
          '50%':       { boxShadow: '0 0 0 5px rgba(232,160,69,0)' },
        },
        // Pop in for completion checkmark
        popIn: {
          '0%':   { transform: 'scale(0)', opacity: '0' },
          '70%':  { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        // Fade up for page transitions
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Slide in from bottom for modals/overlays
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'dot-pulse':  'dotPulse 2s ease-in-out infinite',
        'pop-in':     'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'fade-up':    'fadeUp 0.4s ease-out forwards',
        'slide-up':   'slideUp 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards',
      },
    },
  },
  plugins: [],
}

export default config
