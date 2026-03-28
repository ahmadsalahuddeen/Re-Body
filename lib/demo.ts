// lib/demo.ts
// ─────────────────────────────────────────────────────────────────────────────
// Demo mode data layer — uses localStorage instead of Supabase.
// Lets users try the app without creating an account.
// All functions mirror the API layer so they're interchangeable.
// ─────────────────────────────────────────────────────────────────────────────

import type { WeightLog, HabitLog, ProgressImage, ModuleId } from '@/types'

const KEY = {
  weights: 'pbr_weights',
  habits:  'pbr_habits',
  photos:  'pbr_photos',
}

function read<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}

function write<T>(key: string, data: T[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ── WEIGHTS ──────────────────────────────────────────────────────────────────

export function demoGetWeights(): WeightLog[] {
  return read<WeightLog>(KEY.weights)
}

export function demoAddWeight(weight_kg: number): WeightLog {
  const entry: WeightLog = {
    id: uid(),
    user_id: 'demo',
    weight_kg,
    logged_at: new Date().toISOString(),
  }
  const current = demoGetWeights()
  write(KEY.weights, [entry, ...current])
  return entry
}

// ── HABITS ───────────────────────────────────────────────────────────────────

export function demoGetHabits(): HabitLog[] {
  return read<HabitLog>(KEY.habits)
}

export function demoLogHabit(module_id: ModuleId): HabitLog | null {
  const dateStr = new Date().toISOString().split('T')[0]
  const current = demoGetHabits()
  // Prevent duplicate for same day + module
  if (current.find((h) => h.date === dateStr && h.module_id === module_id)) return null
  const entry: HabitLog = {
    id: uid(),
    user_id: 'demo',
    date: dateStr,
    module_id,
    completed: true,
  }
  write(KEY.habits, [entry, ...current])
  return entry
}

// ── PHOTOS ───────────────────────────────────────────────────────────────────

export function demoGetPhotos(): ProgressImage[] {
  return read<ProgressImage>(KEY.photos)
}

export function demoAddPhoto(
  dataUrl: string,
  note: string,
  module_id: ModuleId
): ProgressImage {
  const entry: ProgressImage = {
    id: uid(),
    user_id: 'demo',
    storage_path: '',
    note: note || null,
    is_worst_phase: false,
    module_id,
    created_at: new Date().toISOString(),
    url: dataUrl,
  }
  const current = demoGetPhotos()
  write(KEY.photos, [entry, ...current])
  return entry
}

export function demoSetWorstPhase(photoId: string) {
  const photos = demoGetPhotos().map((p) => ({
    ...p,
    is_worst_phase: p.id === photoId,
  }))
  write(KEY.photos, photos)
}

export function demoDeletePhoto(photoId: string) {
  write(KEY.photos, demoGetPhotos().filter((p) => p.id !== photoId))
}
