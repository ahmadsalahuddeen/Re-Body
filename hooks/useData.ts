// hooks/useData.ts
// ─────────────────────────────────────────────────────────────────────────────
// Primary data access hook — all reads and writes flow through here.
//
// WHY A SINGLE HOOK FOR ALL DATA?
// It abstracts two completely different backends (Supabase vs localStorage demo)
// behind one interface. Components don't need to know which backend is active.
// They just call addWeight(), logHabit(), addPhoto() etc.
//
// PATTERN:
//   1. Check isDemoMode → use lib/demo.ts (localStorage)
//   2. Otherwise → use Supabase client + dispatch to update global store
//
// OPTIMISTIC UPDATES:
// For adds, we dispatch to the store immediately (before the network call
// finishes) so the UI updates instantly. This is what makes it feel snappy.
// If the Supabase call fails, we show a toast error — the store retains the
// optimistic entry for now (simple apps don't need rollback logic).
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import * as demo from '@/lib/demo'
import { useAppStore } from '@/lib/store'
import { useAuth } from '@/hooks/useAuth'
import type { ModuleId } from '@/types'

export function useData() {
  const { user, isDemoMode } = useAuth()
  const { dispatch, showToast } = useAppStore()

  // Create Supabase client inside the hook (safe — runs in browser)
  const supabase = createClient()

  // ── LOAD ALL DATA ──────────────────────────────────────────────────────────
  /**
   * Fetches all user data in parallel and loads it into the global store.
   * Called once after login in AuthGate.tsx.
   * In demo mode: reads from localStorage.
   * In live mode: runs 3 Supabase queries in parallel (weights, habits, photos).
   * Photos need an extra step: generate signed URLs from storage paths.
   */
  const loadAll = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })

    // ── DEMO MODE PATH ──────────────────────────────────────────────────────
    if (isDemoMode) {
      dispatch({ type: 'SET_WEIGHTS',    payload: demo.demoGetWeights() })
      dispatch({ type: 'SET_HABIT_LOGS', payload: demo.demoGetHabits() })
      dispatch({ type: 'SET_PHOTOS',     payload: demo.demoGetPhotos() })
      dispatch({ type: 'SET_LOADING',    payload: false })
      return
    }

    // ── SUPABASE PATH ───────────────────────────────────────────────────────
    if (!user) return

    try {
      const uid = user.id

      // Run all three queries in parallel — no dependency between them
      const [wRes, hRes, pRes] = await Promise.all([
        supabase
          .from('weight_logs')
          .select('*')
          .eq('user_id', uid)
          .order('logged_at', { ascending: false })
          .limit(30), // Last 30 entries is plenty for the sparkline

        supabase
          .from('habit_logs')
          .select('*')
          .eq('user_id', uid)
          .order('date', { ascending: false }),

        supabase
          .from('progress_images')
          .select('*')
          .eq('user_id', uid)
          .order('created_at', { ascending: false }),
      ])

      dispatch({ type: 'SET_WEIGHTS',    payload: wRes.data || [] })
      dispatch({ type: 'SET_HABIT_LOGS', payload: hRes.data || [] })

      // Photos need signed URLs — Supabase Storage images aren't publicly accessible.
      // createSignedUrl() generates a temporary URL that expires in 1 hour.
      // We generate all URLs in parallel (another Promise.all) for speed.
      if (pRes.data?.length) {
        const withUrls = await Promise.all(
          pRes.data.map(async (p) => {
            const { data } = await supabase.storage
              .from('progress-images')   // bucket name
              .createSignedUrl(p.storage_path, 3600) // 3600 seconds = 1 hour expiry
            return { ...p, url: data?.signedUrl || '' }
          })
        )
        dispatch({ type: 'SET_PHOTOS', payload: withUrls })
      } else {
        dispatch({ type: 'SET_PHOTOS', payload: [] })
      }
    } catch (err) {
      console.error('[useData] loadAll error:', err)
      showToast('Failed to load data', 'error')
    } finally {
      // Always clear loading state — even if something failed
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [user, isDemoMode, dispatch, showToast, supabase])

  // ── ADD WEIGHT ─────────────────────────────────────────────────────────────
  /**
   * Logs a new weight entry. Optimistically updates the store.
   * Returns true on success, false on failure.
   */
  const addWeight = useCallback(async (weight_kg: number): Promise<boolean> => {
    // Demo mode: write to localStorage and update store
    if (isDemoMode) {
      const entry = demo.demoAddWeight(weight_kg)
      dispatch({ type: 'ADD_WEIGHT', payload: entry })
      return true
    }
    if (!user) return false

    const { data, error } = await supabase
      .from('weight_logs')
      .insert({ user_id: user.id, weight_kg, logged_at: new Date().toISOString() })
      .select()    // Return the created row (includes DB-generated id and timestamps)
      .single()

    if (error) {
      showToast('Failed to save weight', 'error')
      return false
    }

    dispatch({ type: 'ADD_WEIGHT', payload: data })
    return true
  }, [user, isDemoMode, dispatch, showToast, supabase])

  // ── LOG HABIT ──────────────────────────────────────────────────────────────
  /**
   * Records that the user completed a module session today.
   * Uses upsert to prevent duplicate logs (same user + same date + same module).
   */
  const logHabit = useCallback(async (module_id: ModuleId): Promise<boolean> => {
    const dateStr = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    if (isDemoMode) {
      const entry = demo.demoLogHabit(module_id)
      if (entry) dispatch({ type: 'ADD_HABIT_LOG', payload: entry })
      return true
    }
    if (!user) return false

    // upsert with onConflict: if a row already exists for (user_id, date, module_id),
    // update it instead of throwing a unique constraint error.
    // This means the user can "re-complete" the same session and it just updates.
    const { data, error } = await supabase
      .from('habit_logs')
      .upsert(
        { user_id: user.id, date: dateStr, module_id, completed: true },
        { onConflict: 'user_id,date,module_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('[useData] logHabit error:', error)
      return false
    }
    dispatch({ type: 'ADD_HABIT_LOG', payload: data })
    return true
  }, [user, isDemoMode, dispatch, supabase])

  // ── ADD PHOTO ──────────────────────────────────────────────────────────────
  /**
   * Uploads a progress photo and saves its metadata.
   * Live mode: uploads file to Supabase Storage, then inserts metadata row.
   * Demo mode: converts file to base64 and saves to localStorage.
   *
   * Storage path convention: "{user_id}/{timestamp}.{ext}"
   * The user_id prefix is what the Storage RLS policy checks.
   */
  const addPhoto = useCallback(async (
    file: File,
    note: string,
    module_id: ModuleId
  ): Promise<boolean> => {
    if (isDemoMode) {
      // Convert File to base64 data URL for localStorage storage
      const dataUrl = await fileToDataUrl(file)
      const entry = demo.demoAddPhoto(dataUrl, note, module_id)
      dispatch({ type: 'ADD_PHOTO', payload: entry })
      return true
    }
    if (!user) return false

    // Build a unique storage path — user_id prefix is required by Storage RLS
    const ext  = file.name.split('.').pop() || 'jpg'
    const path = `${user.id}/${Date.now()}.${ext}`

    // Step 1: Upload the file to Storage
    const { error: uploadErr } = await supabase.storage
      .from('progress-images')
      .upload(path, file, { cacheControl: '3600' })

    if (uploadErr) {
      showToast('Upload failed', 'error')
      return false
    }

    // Step 2: Generate a signed URL so we can display the image immediately
    const { data: signedData } = await supabase.storage
      .from('progress-images')
      .createSignedUrl(path, 3600)

    // Step 3: Insert metadata row in the database
    const { data, error: dbErr } = await supabase
      .from('progress_images')
      .insert({ user_id: user.id, storage_path: path, note: note || null, is_worst_phase: false, module_id })
      .select()
      .single()

    if (dbErr) {
      showToast('Failed to save photo', 'error')
      return false
    }

    // Combine the DB row with the signed URL into one object for the store
    dispatch({ type: 'ADD_PHOTO', payload: { ...data, url: signedData?.signedUrl || '' } })
    return true
  }, [user, isDemoMode, dispatch, showToast, supabase])

  // ── SET WORST PHASE ────────────────────────────────────────────────────────
  /**
   * Marks one photo as "worst phase" and clears the flag on all others.
   * The worst phase photo is used as the left anchor on the dashboard.
   * Pass value=false to unset (clear the flag without setting another).
   */
  const setWorstPhase = useCallback(async (photoId: string, value: boolean): Promise<void> => {
    if (isDemoMode) {
      // Demo: update localStorage, then reload photos into store
      if (value) demo.demoSetWorstPhase(photoId)
      dispatch({ type: 'SET_PHOTOS', payload: demo.demoGetPhotos() })
      return
    }
    if (!user) return

    // Step 1: Clear the flag on ALL of the user's photos
    await supabase
      .from('progress_images')
      .update({ is_worst_phase: false })
      .eq('user_id', user.id)

    // Step 2: Set it on just the target (if value is true)
    if (value) {
      await supabase
        .from('progress_images')
        .update({ is_worst_phase: true })
        .eq('id', photoId)
    }

    // Reload to get the fresh state (simpler than manually patching the store)
    loadAll()
  }, [user, isDemoMode, dispatch, supabase, loadAll])

  // ── DELETE PHOTO ──────────────────────────────────────────────────────────
  /**
   * Permanently deletes a photo — removes from Storage and the database.
   * In demo mode: removes from localStorage.
   */
  const deletePhoto = useCallback(async (
    photoId: string,
    storagePath?: string  // Needed to delete from Supabase Storage (not needed in demo)
  ): Promise<boolean> => {
    if (isDemoMode) {
      demo.demoDeletePhoto(photoId)
      dispatch({ type: 'DELETE_PHOTO', payload: photoId })
      return true
    }
    if (!user) return false

    // Delete from Storage first (best effort — don't block on failure)
    if (storagePath) {
      await supabase.storage.from('progress-images').remove([storagePath])
    }

    // Delete the metadata row from the database
    const { error } = await supabase
      .from('progress_images')
      .delete()
      .eq('id', photoId)

    if (error) {
      showToast('Failed to delete', 'error')
      return false
    }

    // Remove from store immediately (optimistic — no refetch needed)
    dispatch({ type: 'DELETE_PHOTO', payload: photoId })
    return true
  }, [user, isDemoMode, dispatch, showToast, supabase])

  return { loadAll, addWeight, logHabit, addPhoto, setWorstPhase, deletePhoto }
}

// ── FILE HELPER ───────────────────────────────────────────────────────────────

/**
 * Converts a File object to a base64 data URL string.
 * Used in demo mode to store images in localStorage without a real server.
 * Example output: "data:image/jpeg;base64,/9j/4AAQSk..."
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file) // Triggers onload when done
  })
}
