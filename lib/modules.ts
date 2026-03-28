// lib/modules.ts
// ─────────────────────────────────────────────────────────────────────────────
// MODULE REGISTRY — The heart of the extensibility system.
//
// This is the ONLY file you need to edit to add a new module to the app.
//
// HOW TO ADD A NEW MODULE (e.g. Communication Rebirth):
// ─────────────────────────────────────────────────────
// 1. Add 'comms' to the ModuleId union type in types/index.ts
// 2. Copy the FACE_MODULE object below, fill in your own data
// 3. Set comingSoon: false when you're ready to activate it
// 4. Create app/comms/page.tsx for the module's ritual page
// 5. That's it — it auto-appears in the dashboard, nav, and habit tracking
// ─────────────────────────────────────────────────────────────────────────────

import type { RebirthModule, Exercise } from '@/types'

// ── FACE REBIRTH — Exercises ─────────────────────────────────────────────────
// Parsed from: https://youtu.be/tX3eueEFCM8
// "How To Fix Asymmetry 5 Minutes Every Day"

const FACE_EXERCISES: Exercise[] = [
  {
    id: 1,
    name: 'Towel Jaw Resistance',
    sets: 3,
    duration_sec: 10,
    rest_sec: 5,
    sides: ['LEFT SIDE', 'RIGHT SIDE'],
    timestamp_sec: 95,
    timestamp_label: '1:35',
    description:
      'Bite a folded towel on one side. Hold maximum bite pressure for 10 sec. ' +
      'Switch sides each rep. Directly targets jaw asymmetry at the source.',
  },
  {
    id: 2,
    name: 'Full Tongue Mew',
    sets: 1,
    duration_sec: 180,
    rest_sec: 10,
    sides: null,
    timestamp_sec: 118,
    timestamp_label: '1:58',
    description:
      'Press the entire tongue flat against the palate — both front and back sections. ' +
      'Hold continuously for 3 minutes. Your highest-leverage daily exercise.',
  },
  {
    id: 3,
    name: 'Scalp Tension Release',
    sets: 3,
    duration_sec: 15,
    rest_sec: 8,
    sides: null,
    timestamp_sec: 160,
    timestamp_label: '2:40',
    description:
      'Move your scalp front-to-back using the frontalis and occipitalis muscles. ' +
      'Releases chronic one-sided tension that pulls the face off-center.',
  },
  {
    id: 4,
    name: 'Cheek Hollow Hold',
    sets: 3,
    duration_sec: 10,
    rest_sec: 5,
    sides: ['WEAK SIDE', 'STRONG SIDE'],
    timestamp_sec: 190,
    timestamp_label: '3:10',
    description:
      'Hollow your cheek inward while pressing tongue into the opposite side. ' +
      'Targets internal mouth muscle imbalance. Hold firm — no half-reps.',
  },
]

// ── MODULE DEFINITIONS ────────────────────────────────────────────────────────

export const FACE_MODULE: RebirthModule = {
  id: 'face',
  name: 'Face Rebirth',
  tagline: 'Fix symmetry daily',
  accent: 'accent',
  accentHex: '#E8A045',
  icon: '◈',
  route: '/ritual',
  comingSoon: false,
  exercises: FACE_EXERCISES,
}

// ── PLACEHOLDER MODULES (Coming Soon) ────────────────────────────────────────
// Remove comingSoon: true and build the route when you're ready.

export const COMMS_MODULE: RebirthModule = {
  id: 'comms',
  name: 'Communication Rebirth',
  tagline: 'Speak with precision daily',
  accent: 'accent',       // Change to 'comms' once you add it to tailwind config
  accentHex: '#4A9EBF',   // Cool blue
  icon: '◎',
  route: '/comms',
  comingSoon: true,
  exercises: [],           // Fill in when building this module
}

// ── REGISTRY ─────────────────────────────────────────────────────────────────
// The app reads from this array to build the dashboard, nav, and habit tracker.
// Order matters — first module is the primary CTA on the dashboard.

export const ALL_MODULES: RebirthModule[] = [
  FACE_MODULE,
  COMMS_MODULE,
  // Add more modules here...
]

// ── HELPERS ──────────────────────────────────────────────────────────────────

export function getModule(id: string): RebirthModule | undefined {
  return ALL_MODULES.find((m) => m.id === id)
}

export function getActiveModules(): RebirthModule[] {
  return ALL_MODULES.filter((m) => !m.comingSoon)
}

/**
 * Calculate the total session duration for a module in seconds.
 * Used to display "~5 min" in the ritual page header.
 */
export function calcSessionDuration(exercises: Exercise[]): number {
  return exercises.reduce((acc, ex) => {
    const sides = ex.sides ? ex.sides.length : 1
    const totalSets = ex.sets * sides
    return acc + ex.duration_sec * totalSets + ex.rest_sec * (totalSets - 1)
  }, 0)
}

export function formatDuration(sec: number): string {
  if (sec >= 60) {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return s > 0 ? `${m}m ${s}s` : `${m}m`
  }
  return `${sec}s`
}
