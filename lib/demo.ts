// lib/demo.ts
// ─────────────────────────────────────────────────────────────────────────────
// Demo mode data layer — uses localStorage instead of Supabase.
//
// WHY THIS EXISTS:
// Users should be able to try the full app without creating an account.
// This module mirrors the exact same function signatures as the Supabase
// calls in hooks/useData.ts so the hook can swap between them transparently.
//
// WHERE DATA IS STORED:
// Browser localStorage under the key prefix "pbr_".
// Data is device-local and survives page refreshes but not clearing storage.
//
// LIMITATIONS vs REAL MODE:
//   - No multi-device sync
//   - Photos stored as base64 strings (can get large over time)
//   - No server-side validation
//   - Data lost if user clears browser storage
// ─────────────────────────────────────────────────────────────────────────────

import type { WeightLog, HabitLog, ProgressImage, ModuleId } from '@/types'

// localStorage key names — all prefixed with 'pbr_' to avoid collisions
const KEYS = {
  weights: 'pbr_weights',
  habits:  'pbr_habits',
  photos:  'pbr_photos',
} as const

// ── INTERNAL HELPERS ──────────────────────────────────────────────────────────

/**
 * Safely reads a JSON array from localStorage.
 * Returns empty array on any error (missing key, malformed JSON, SSR).
 */
function read<T>(key: string): T[] {
  if (typeof window === 'undefined') return [] // SSR guard — localStorage doesn't exist server-side
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return [] // Malformed JSON — treat as empty
  }
}

/** Safely writes a JSON array to localStorage. Silently fails if storage is full. */
function write<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // QuotaExceededError — base64 photos can fill storage. Fail silently.
    console.warn('[PBR Demo] localStorage write failed — storage may be full')
  }
}

/** Generates a simple unique ID for demo records (no UUID library needed) */
function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ── WEIGHT LOGS ──────────────────────────────────────────────────────────────

/** Returns all weight logs, newest first (mirrors Supabase ORDER BY logged_at DESC) */
export function demoGetWeights(): WeightLog[] {
  return read<WeightLog>(KEYS.weights)
}

/**
 * Adds a new weight entry and persists it.
 * Returns the created record so the caller can optimistically update UI state.
 */
export function demoAddWeight(weight_kg: number): WeightLog {
  const entry: WeightLog = {
    id: uid(),
    user_id: 'demo',
    weight_kg,
    logged_at: new Date().toISOString(),
  }
  write(KEYS.weights, [entry, ...demoGetWeights()]) // prepend — newest first
  return entry
}

// ── HABIT LOGS ───────────────────────────────────────────────────────────────

/** Returns all habit logs, newest first */
export function demoGetHabits(): HabitLog[] {
  return read<HabitLog>(KEYS.habits)
}

/**
 * Logs a habit completion for today.
 * Returns null if the user already logged this module today (prevents duplicates).
 * Mirrors the UNIQUE(user_id, date, module_id) constraint in Supabase.
 */
export function demoLogHabit(module_id: ModuleId): HabitLog | null {
  const dateStr = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const current = demoGetHabits()

  // Check for existing log today for this module
  const alreadyLogged = current.find(
    (h) => h.date === dateStr && h.module_id === module_id
  )
  if (alreadyLogged) return null // Duplicate — caller should ignore

  const entry: HabitLog = {
    id: uid(),
    user_id: 'demo',
    date: dateStr,
    module_id,
    completed: true,
  }
  write(KEYS.habits, [entry, ...current])
  return entry
}

// ── PROGRESS PHOTOS ───────────────────────────────────────────────────────────

/** Returns all photos, newest first */
export function demoGetPhotos(): ProgressImage[] {
  return read<ProgressImage>(KEYS.photos)
}

/**
 * Saves a new progress photo.
 * In demo mode, dataUrl is a base64-encoded image string (from FileReader).
 * In live mode, this would be a Supabase signed URL instead.
 */
export function demoAddPhoto(
  dataUrl: string,   // base64 data URL from FileReader.readAsDataURL()
  note: string,
  module_id: ModuleId
): ProgressImage {
  const entry: ProgressImage = {
    id: uid(),
    user_id: 'demo',
    storage_path: '',       // No real storage path in demo mode
    note: note || null,
    is_worst_phase: false,  // Never the worst phase by default
    module_id,
    created_at: new Date().toISOString(),
    url: dataUrl,           // base64 string doubles as the "URL" in demo mode
  }
  write(KEYS.photos, [entry, ...demoGetPhotos()])
  return entry
}

/**
 * Sets one photo as "worst phase" and clears the flag on all others.
 * Mirrors the Supabase logic of: UPDATE SET is_worst_phase=false WHERE user_id=?
 * then UPDATE SET is_worst_phase=true WHERE id=?
 */
export function demoSetWorstPhase(photoId: string): void {
  const photos = demoGetPhotos().map((p) => ({
    ...p,
    is_worst_phase: p.id === photoId, // true for the target, false for everyone else
  }))
  write(KEYS.photos, photos)
}

/** Permanently removes a photo from localStorage */
export function demoDeletePhoto(photoId: string): void {
  write(KEYS.photos, demoGetPhotos().filter((p) => p.id !== photoId))
}
