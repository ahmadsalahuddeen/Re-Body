// lib/modules.ts
// ─────────────────────────────────────────────────────────────────────────────
// MODULE REGISTRY — the single source of truth for all rebirth modules.
//
// This is the KEY extensibility file. To add a brand new module:
//
//   STEP 1 — Define exercises here (copy the FACE_EXERCISES pattern)
//   STEP 2 — Create a RebirthModule object (copy FACE_MODULE pattern)
//   STEP 3 — Set comingSoon: false when the route is ready
//   STEP 4 — Add it to ALL_MODULES array below
//   STEP 5 — Add its ID to ModuleId in types/index.ts
//   STEP 6 — Create app/[route]/page.tsx (copy app/ritual/page.tsx)
//
//   Result: it auto-appears in dashboard, bottom nav, habit calendar,
//   streak counts, and habit logging. Zero other files to touch.
// ─────────────────────────────────────────────────────────────────────────────

import type { RebirthModule, Exercise } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// MODULE 1: FACE REBIRTH
// Source video: https://youtu.be/tX3eueEFCM8
// "How To Fix Asymmetry 5 Minutes Every Day"
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Exercise list for Face Rebirth — parsed from the YouTube video.
 * timestamp_sec / timestamp_label: where to seek the video for demo.
 * sides: if non-null, the session timer cycles through each side per set.
 *        e.g. sides: ['LEFT SIDE', 'RIGHT SIDE'] + sets: 3 = 6 total sets.
 */
const FACE_EXERCISES: Exercise[] = [
  {
    id: 1,
    name: 'Towel Jaw Resistance',
    sets: 3,
    duration_sec: 10,     // 10 seconds of max bite pressure per side
    rest_sec: 5,          // 5 second breather between sides/sets
    sides: ['LEFT SIDE', 'RIGHT SIDE'], // alternates: L, R, L, R, L, R = 6 total sets
    timestamp_sec: 95,    // 1:35 in the video
    timestamp_label: '1:35',
    description:
      'Bite a folded towel on one side. Hold maximum bite pressure for 10 sec. ' +
      'Switch sides each rep. Directly targets jaw asymmetry at the source.',
  },
  {
    id: 2,
    name: 'Full Tongue Mew',
    sets: 1,
    duration_sec: 180,    // 3 full minutes of continuous tongue pressure
    rest_sec: 10,
    sides: null,          // No sides — whole-palate contact
    timestamp_sec: 118,   // 1:58 in the video
    timestamp_label: '1:58',
    description:
      'Press the entire tongue flat against the palate — both front and back sections. ' +
      'Hold continuously for 3 minutes. Your highest-leverage daily exercise.',
  },
  {
    id: 3,
    name: 'Scalp Tension Release',
    sets: 3,
    duration_sec: 15,     // 15 seconds of frontalis/occipitalis movement
    rest_sec: 8,
    sides: null,          // Bilateral — both sides simultaneously
    timestamp_sec: 160,   // 2:40 in the video
    timestamp_label: '2:40',
    description:
      'Move your scalp front-to-back using the frontalis and occipitalis muscles. ' +
      'Releases chronic one-sided tension that pulls the face off-center over time.',
  },
  {
    id: 4,
    name: 'Cheek Hollow Hold',
    sets: 3,
    duration_sec: 10,
    rest_sec: 5,
    sides: ['WEAK SIDE', 'STRONG SIDE'], // work the weaker side first
    timestamp_sec: 190,   // 3:10 in the video
    timestamp_label: '3:10',
    description:
      'Hollow your cheek inward while pressing tongue into the opposite side. ' +
      'Targets internal mouth muscle imbalance. Hold firm — no half-reps.',
  },
]

/** Face Rebirth module configuration */
export const FACE_MODULE: RebirthModule = {
  id: 'face',
  name: 'Face Rebirth',
  tagline: 'Fix symmetry daily',
  accent: 'accent',           // Maps to colors.accent in tailwind.config.ts
  accentHex: '#E8A045',       // Warm amber — used for inline styles
  icon: '◈',                  // Unicode symbol — no emoji (avoids rendering inconsistency)
  route: '/ritual',           // Next.js App Router route
  comingSoon: false,          // Live and active
  exercises: FACE_EXERCISES,
}

// ═══════════════════════════════════════════════════════════════════════════
// MODULE 2: COMMUNICATION REBIRTH (Coming Soon)
//
// HOW TO ACTIVATE:
//   1. Set comingSoon: false
//   2. Fill in the exercises array with your routine
//   3. Create app/comms/page.tsx (copy app/ritual/page.tsx, swap the module)
//   4. Add 'comms' to ModuleId in types/index.ts
//   5. Optionally add a 'comms' color to tailwind.config.ts
// ═══════════════════════════════════════════════════════════════════════════

export const COMMS_MODULE: RebirthModule = {
  id: 'comms',
  name: 'Communication Rebirth',
  tagline: 'Speak with precision daily',
  accent: 'accent',           // Replace with 'comms' once you add it to Tailwind config
  accentHex: '#4A9EBF',       // Cool blue — differentiated from Face Rebirth amber
  icon: '◎',
  route: '/comms',
  comingSoon: true,           // ← flip to false when you build the route
  exercises: [],              // ← fill in when building this module
}

// ═══════════════════════════════════════════════════════════════════════════
// REGISTRY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * The master list of all modules — active and coming soon.
 * ORDER MATTERS:
 *   - First module = primary hero CTA on the dashboard
 *   - Remaining active modules = secondary cards
 *   - comingSoon modules = locked cards at the bottom
 *
 * To add a new module, append it here. Nothing else needs to change
 * for it to appear in the dashboard and nav.
 */
export const ALL_MODULES: RebirthModule[] = [
  FACE_MODULE,
  COMMS_MODULE,
  // Add future modules here ↓
]

// ── UTILITY FUNCTIONS ─────────────────────────────────────────────────────────

/** Returns all modules where comingSoon is false or undefined */
export function getActiveModules(): RebirthModule[] {
  return ALL_MODULES.filter((m) => !m.comingSoon)
}

/** Looks up a module by its ID string. Returns undefined if not found. */
export function getModule(id: string): RebirthModule | undefined {
  return ALL_MODULES.find((m) => m.id === id)
}

/**
 * Calculates the total wall-clock duration of a session in seconds.
 * Formula: for each exercise → (sets × sides × duration) + (sets × sides − 1) × rest
 * Used to display "~5 min" in the ritual page header.
 */
export function calcSessionDuration(exercises: Exercise[]): number {
  return exercises.reduce((acc, ex) => {
    const totalSets = ex.sets * (ex.sides?.length ?? 1) // e.g. 3 sets × 2 sides = 6
    return acc + ex.duration_sec * totalSets + ex.rest_sec * (totalSets - 1)
  }, 0)
}

/**
 * Formats a duration in seconds to a human-readable string.
 * Examples: 10 → "10s", 90 → "1m 30s", 180 → "3m"
 */
export function formatDuration(sec: number): string {
  if (sec >= 60) {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return s > 0 ? `${m}m ${s}s` : `${m}m`
  }
  return `${sec}s`
}
