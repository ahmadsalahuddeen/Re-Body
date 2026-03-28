// types/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Central type definitions for Project Body Rebirth.
//
// ADDING A NEW MODULE:
// 1. Add module ID to the `ModuleId` union type
// 2. Create a corresponding config in lib/modules.ts
// 3. Add your module-specific types here (e.g. CommunicationLog)
// ─────────────────────────────────────────────────────────────────────────────

// ── MODULE SYSTEM ─────────────────────────────────────────────────────────────

/**
 * Unique identifier for each rebirth module.
 * Add new module IDs here as you build them.
 */
export type ModuleId = 'face' | 'comms' | 'body' | 'sleep' // extend as needed

export interface RebirthModule {
  id: ModuleId
  name: string              // e.g. "Face Rebirth"
  tagline: string           // e.g. "Fix symmetry daily"
  accent: string            // Tailwind color class, e.g. "accent"
  accentHex: string         // Raw hex for inline styles, e.g. "#E8A045"
  icon: string              // Emoji or SVG path reference
  route: string             // App route, e.g. "/ritual"
  comingSoon?: boolean      // Renders as locked card on dashboard
  exercises: Exercise[]     // The session exercises for this module
}

// ── EXERCISE & SESSION ────────────────────────────────────────────────────────

export interface Exercise {
  id: number
  name: string
  sets: number
  duration_sec: number      // Work duration per set
  rest_sec: number          // Rest between sets
  sides: string[] | null    // e.g. ["LEFT SIDE", "RIGHT SIDE"] or null
  timestamp_sec: number     // YouTube video seek position
  timestamp_label: string   // Human-readable, e.g. "1:35"
  description: string       // Coaching cue shown on exercise card
}

export type SessionPhase = 'work' | 'rest' | 'complete'

export interface SessionState {
  exerciseIdx: number
  setIdx: number            // Current set (across all sides)
  sideIdx: number           // Current side index (0 or 1)
  phase: SessionPhase
  timeLeft: number          // Seconds remaining in current phase
  paused: boolean
}

// ── DATABASE RECORDS ──────────────────────────────────────────────────────────
// These match the Supabase table shapes exactly.

export interface WeightLog {
  id: string
  user_id: string
  weight_kg: number
  logged_at: string         // ISO timestamp
}

export interface HabitLog {
  id: string
  user_id: string
  date: string              // YYYY-MM-DD
  module_id: ModuleId       // Which module was completed
  completed: boolean
}

export interface ProgressImage {
  id: string
  user_id: string
  storage_path: string      // Path in Supabase storage bucket
  note: string | null
  is_worst_phase: boolean
  module_id: ModuleId       // Which module this photo belongs to
  created_at: string
  // Client-side only (not in DB):
  url?: string              // Signed URL, populated after fetch
}

// ── UI HELPERS ───────────────────────────────────────────────────────────────

export interface ToastMessage {
  id: string
  text: string
  type?: 'default' | 'success' | 'error'
}
