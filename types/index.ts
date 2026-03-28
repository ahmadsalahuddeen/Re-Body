// types/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Central TypeScript type definitions for the entire app.
//
// WHY ONE FILE?
// Keeping all shared types in one place means:
//   - You see the full data model at a glance
//   - No circular import issues between files
//   - Easy to find "what shape does a Photo have?" without hunting
//
// HOW TO ADD A NEW MODULE (e.g. Communication Rebirth):
//   1. Add its ID to the ModuleId union below: 'face' | 'comms'
//   2. Register it in lib/modules.ts
//   3. That's all the type system needs
// ─────────────────────────────────────────────────────────────────────────────

// ── MODULE SYSTEM ─────────────────────────────────────────────────────────────

/**
 * Unique string ID for each rebirth module.
 * Used as foreign key in habit_logs and progress_images tables.
 * Add a new literal here when building a new module.
 */
export type ModuleId = 'face' | 'comms' // extend as needed: | 'body' | 'sleep'

/**
 * Full configuration object for a rebirth module.
 * Registered in lib/modules.ts — one object per module.
 * The dashboard, nav, and habit tracking all read from this shape.
 */
export interface RebirthModule {
  id: ModuleId            // Unique ID — matches DB module_id column
  name: string            // Display name, e.g. "Face Rebirth"
  tagline: string         // Short description, e.g. "Fix symmetry daily"
  accent: string          // Tailwind color class for this module's accent
  accentHex: string       // Raw hex value for inline styles where Tailwind can't reach
  icon: string            // Single character icon (unicode symbol, not emoji)
  route: string           // Next.js route, e.g. "/ritual"
  comingSoon?: boolean    // If true, renders as locked card — not a real route yet
  exercises: Exercise[]   // The ordered list of exercises for this module's session
}

// ── EXERCISE & SESSION ────────────────────────────────────────────────────────

/**
 * A single exercise in a module's session routine.
 * Populated from lib/modules.ts — parsed from the source video.
 */
export interface Exercise {
  id: number
  name: string                // Display name shown in exercise card and session overlay
  sets: number                // How many sets (multiplied by sides.length for total sets)
  duration_sec: number        // Work duration per set in seconds
  rest_sec: number            // Rest duration between sets in seconds
  sides: string[] | null      // e.g. ["LEFT SIDE", "RIGHT SIDE"] — null if no sides
  timestamp_sec: number       // Where to seek the YouTube video for this exercise
  timestamp_label: string     // Human-readable version, e.g. "1:35"
  description: string         // Coaching cue shown on the exercise card
}

/**
 * Which phase the guided session timer is currently in.
 * - 'work'     → counting down the exercise duration
 * - 'rest'     → counting down the rest period between sets
 * - 'complete' → all exercises done (triggers completion screen)
 */
export type SessionPhase = 'work' | 'rest' | 'complete'

/**
 * Internal state snapshot for the session timer hook.
 * Consumed by GuidedSession.tsx to render the correct UI.
 */
export interface SessionState {
  exerciseIdx: number   // Index into the exercises array (0-based)
  setIdx: number        // Flat set index counting across all sides
  sideIdx: number       // Which side we're on (index into exercise.sides)
  phase: SessionPhase
  timeLeft: number      // Seconds remaining in current phase
  paused: boolean
}

// ── DATABASE RECORDS ──────────────────────────────────────────────────────────
// These interfaces mirror the Supabase table columns exactly.
// If you add a column to the DB, add it here too.

/** One weight entry. Stored in the weight_logs table. */
export interface WeightLog {
  id: string
  user_id: string
  weight_kg: number     // Stored as NUMERIC(5,2) in Postgres — e.g. 82.40
  logged_at: string     // ISO 8601 timestamp string from Postgres
}

/**
 * One habit completion record. Stored in the habit_logs table.
 * The UNIQUE(user_id, date, module_id) constraint prevents double-logging.
 */
export interface HabitLog {
  id: string
  user_id: string
  date: string          // YYYY-MM-DD format — DATE column in Postgres
  module_id: ModuleId   // Which module was completed (links to ALL_MODULES)
  completed: boolean    // Always true when inserted — reserved for future undo feature
}

/**
 * One progress photo record. Stored in the progress_images table.
 * The actual image file lives in Supabase Storage — this is just the metadata.
 */
export interface ProgressImage {
  id: string
  user_id: string
  storage_path: string      // Path inside the 'progress-images' bucket: "{uid}/{timestamp}.jpg"
  note: string | null       // Optional caption the user typed
  is_worst_phase: boolean   // If true, shown as the "Worst Phase" anchor on the dashboard
  module_id: ModuleId       // Which module this photo was uploaded under
  created_at: string        // ISO 8601 timestamp — used for sorting and date display
  // ↓ Client-side only — not stored in DB, populated after fetching signed URL
  url?: string              // Supabase signed URL (expires after 1 hour)
}

// ── UI HELPERS ───────────────────────────────────────────────────────────────

/**
 * A single toast notification.
 * Managed by AppProvider in lib/store.tsx.
 * Auto-dismissed after 2.5 seconds.
 */
export interface ToastMessage {
  id: string                                    // Random ID used as React key and for removal
  text: string                                  // Message to display
  type?: 'default' | 'success' | 'error'       // Controls color: white / green / red
}
