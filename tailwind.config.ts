// tailwind.config.ts
// ─────────────────────────────────────────────────────────────────────────────
// Design token system for Project Body Rebirth.
//
// PHILOSOPHY:
// All design decisions live here. Colors, type scale, spacing, animations —
// nothing is hardcoded in components. Change a value here, it updates everywhere.
//
// ADDING A NEW MODULE'S ACCENT COLOR:
// Each module should have exactly ONE accent color.
// 1. Add a new key under colors (e.g. comms: '#4A9EBF')
// 2. Use it in components as: text-comms, bg-comms, border-comms
// 3. Update the module's accentHex in lib/modules.ts to match
//
// WHY NOT SHADCN/MATERIAL/BOOTSTRAP?
// Those systems impose their aesthetic. This design system IS the aesthetic.
// Every token is intentional — dark-first, editorial type, earned progress.
// ─────────────────────────────────────────────────────────────────────────────

import type { Config } from 'tailwindcss'

const config: Config = {
  // Tell Tailwind which files to scan for class names (for tree-shaking unused styles)
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    extend: {

      // ── COLORS ──────────────────────────────────────────────────────────────
      colors: {
        // Base dark palette — layered so UI has depth without flat black
        bg: {
          DEFAULT: '#0A0A0B',   // Deepest background — the canvas
          2:       '#111113',   // Card/surface backgrounds (slight lift)
          3:       '#181819',   // Elevated surfaces, inputs, button backs
          4:       '#1E1E20',   // Hover state for cards
        },

        // Border system — very subtle to keep the design airy
        border: {
          DEFAULT: 'rgba(255,255,255,0.06)',  // Default card borders
          bright:  'rgba(255,255,255,0.12)',  // Hover/focused borders
          focus:   'rgba(255,255,255,0.24)',  // Active input borders
        },

        // Text hierarchy — use these instead of gray-xxx for consistency
        ink: {
          DEFAULT: '#F0EDE8',                   // Primary text — warm white (not pure white)
          sub:     'rgba(240,237,232,0.50)',     // Secondary text — labels, descriptions
          muted:   'rgba(240,237,232,0.28)',     // Tertiary text — placeholders, timestamps
          ghost:   'rgba(240,237,232,0.12)',     // Nearly invisible — icons in empty states
        },

        // ── MODULE ACCENT COLORS ─────────────────────────────────────────────
        // ONE accent per module. Used sparingly: CTAs, active states, progress.
        accent: {
          DEFAULT: '#E8A045',              // Face Rebirth — warm amber
          dim:     'rgba(232,160,69,0.12)', // Background tints (e.g. active pill bg)
          glow:    'rgba(232,160,69,0.30)', // Box shadows and filter glows
        },
        // Add future module accents below when building them:
        // comms: '#4A9EBF',   // Communication Rebirth — cool blue
        // body:  '#7BC67E',   // Body Posture — sage green
        // sleep: '#8B7FD4',   // Sleep Rebirth — soft purple

        // Semantic UI colors
        rest:    '#4A9EBF',   // Timer rest phase indicator — cool, calm
        success: '#4ade80',   // Green for positive feedback
        danger:  '#f87171',   // Red for destructive actions
      },

      // ── TYPOGRAPHY ──────────────────────────────────────────────────────────
      fontFamily: {
        // Display: Barlow Condensed — bold, editorial, confident headlines
        // Used for: page titles, exercise names, stats, CTAs, labels
        display: ['var(--font-display)', 'sans-serif'],
        // Body: Barlow — clean, readable, airy
        // Used for: descriptions, notes, helper text
        body:    ['var(--font-body)', 'sans-serif'],
      },

      fontSize: {
        // Custom editorial scale — goes beyond Tailwind's defaults
        'display-xl': ['72px', { lineHeight: '0.9',  letterSpacing: '-0.02em', fontWeight: '900' }],
        'display-lg': ['52px', { lineHeight: '0.95', letterSpacing: '0.01em',  fontWeight: '900' }],
        'display-md': ['36px', { lineHeight: '1',    letterSpacing: '0.02em',  fontWeight: '800' }],
        'display-sm': ['24px', { lineHeight: '1.1',                            fontWeight: '700' }],
        // Section labels — small, spaced-out, uppercase
        'label':      ['11px', { lineHeight: '1',    letterSpacing: '0.22em',  fontWeight: '600' }],
      },

      // ── CUSTOM SPACING ───────────────────────────────────────────────────────
      spacing: {
        // iOS safe area insets — used for bottom nav padding on notch devices
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top':    'env(safe-area-inset-top)',
      },

      // ── BORDER RADIUS ────────────────────────────────────────────────────────
      borderRadius: {
        card:  '16px',   // Main content cards
        pill:  '999px',  // Buttons, badges, nav items
        thumb: '10px',   // Smaller elements: inputs, chips, photo thumbnails
      },

      // ── KEYFRAME ANIMATIONS ──────────────────────────────────────────────────
      keyframes: {
        // Used on the primary "Start" CTA button — gentle breathing glow
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(232,160,69,0.3)' },
          '50%':       { boxShadow: '0 0 50px rgba(232,160,69,0.5), 0 0 80px rgba(232,160,69,0.15)' },
        },
        // Used on "today" dot in the habit calendar — subtle pulse ring
        dotPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(232,160,69,0.4)' },
          '50%':       { boxShadow: '0 0 0 5px rgba(232,160,69,0)' },
        },
        // Used on completion checkmark — spring-like pop entrance
        popIn: {
          '0%':   { transform: 'scale(0)', opacity: '0' },
          '70%':  { transform: 'scale(1.1)' },               // Slight overshoot = spring feel
          '100%': { transform: 'scale(1)',  opacity: '1' },
        },
        // Used for page section entrance — fade up from slightly below
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Used for modal/overlay entrance — slide up from bottom
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },

      // ── ANIMATION UTILITIES ──────────────────────────────────────────────────
      // Reference the keyframes above as utility classes
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
