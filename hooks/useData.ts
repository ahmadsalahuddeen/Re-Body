// hooks/useData.ts
// ─────────────────────────────────────────────────────────────────────────────
// Primary data hook. Abstracts Supabase vs demo mode behind one interface.
// Import this wherever you need to read or write app data.
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
  const supabase = createClient()

  // ── LOAD ALL DATA ──────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })

    if (isDemoMode) {
      dispatch({ type: 'SET_WEIGHTS',    payload: demo.demoGetWeights() })
      dispatch({ type: 'SET_HABIT_LOGS', payload: demo.demoGetHabits() })
      dispatch({ type: 'SET_PHOTOS',     payload: demo.demoGetPhotos() })
      dispatch({ type: 'SET_LOADING',    payload: false })
      return
    }

    if (!user) return

    try {
      const uid = user.id
      const [wRes, hRes, pRes] = await Promise.all([
        supabase
          .from('weight_logs')
          .select('*')
          .eq('user_id', uid)
          .order('logged_at', { ascending: false })
          .limit(30),
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

      // Generate signed URLs for all photos in parallel
      if (pRes.data?.length) {
        const withUrls = await Promise.all(
          pRes.data.map(async (p) => {
            const { data } = await supabase.storage
              .from('progress-images')
              .createSignedUrl(p.storage_path, 3600) // 1hr expiry
            return { ...p, url: data?.signedUrl || '' }
          })
        )
        dispatch({ type: 'SET_PHOTOS', payload: withUrls })
      } else {
        dispatch({ type: 'SET_PHOTOS', payload: [] })
      }
    } catch (err) {
      console.error('loadAll error:', err)
      showToast('Failed to load data', 'error')
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [user, isDemoMode, dispatch, showToast, supabase])

  // ── ADD WEIGHT ─────────────────────────────────────────────────────────────
  const addWeight = useCallback(async (weight_kg: number) => {
    if (isDemoMode) {
      const entry = demo.demoAddWeight(weight_kg)
      dispatch({ type: 'ADD_WEIGHT', payload: entry })
      return true
    }
    if (!user) return false

    const { data, error } = await supabase
      .from('weight_logs')
      .insert({ user_id: user.id, weight_kg, logged_at: new Date().toISOString() })
      .select()
      .single()

    if (error) { showToast('Failed to save weight', 'error'); return false }
    dispatch({ type: 'ADD_WEIGHT', payload: data })
    return true
  }, [user, isDemoMode, dispatch, showToast, supabase])

  // ── LOG HABIT ──────────────────────────────────────────────────────────────
  const logHabit = useCallback(async (module_id: ModuleId) => {
    const dateStr = new Date().toISOString().split('T')[0]

    if (isDemoMode) {
      const entry = demo.demoLogHabit(module_id)
      if (entry) dispatch({ type: 'ADD_HABIT_LOG', payload: entry })
      return true
    }
    if (!user) return false

    // Upsert — prevents duplicate logs for same day + module
    const { data, error } = await supabase
      .from('habit_logs')
      .upsert(
        { user_id: user.id, date: dateStr, module_id, completed: true },
        { onConflict: 'user_id,date,module_id' }
      )
      .select()
      .single()

    if (error) { console.error('logHabit error:', error); return false }
    dispatch({ type: 'ADD_HABIT_LOG', payload: data })
    return true
  }, [user, isDemoMode, dispatch, showToast, supabase])

  // ── ADD PHOTO ──────────────────────────────────────────────────────────────
  const addPhoto = useCallback(async (
    file: File,
    note: string,
    module_id: ModuleId
  ) => {
    if (isDemoMode) {
      // Store as base64 in localStorage
      const dataUrl = await fileToDataUrl(file)
      const entry = demo.demoAddPhoto(dataUrl, note, module_id)
      dispatch({ type: 'ADD_PHOTO', payload: entry })
      return true
    }
    if (!user) return false

    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${user.id}/${Date.now()}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('progress-images')
      .upload(path, file, { cacheControl: '3600' })

    if (upErr) { showToast('Upload failed', 'error'); return false }

    const { data: signedData } = await supabase.storage
      .from('progress-images')
      .createSignedUrl(path, 3600)

    const { data, error: dbErr } = await supabase
      .from('progress_images')
      .insert({ user_id: user.id, storage_path: path, note, is_worst_phase: false, module_id })
      .select()
      .single()

    if (dbErr) { showToast('Failed to save photo', 'error'); return false }
    dispatch({ type: 'ADD_PHOTO', payload: { ...data, url: signedData?.signedUrl || '' } })
    return true
  }, [user, isDemoMode, dispatch, showToast, supabase])

  // ── SET WORST PHASE ────────────────────────────────────────────────────────
  const setWorstPhase = useCallback(async (photoId: string, value: boolean) => {
    if (isDemoMode) {
      demo.demoSetWorstPhase(photoId)
      // Clear all, then set the one
      dispatch({ type: 'SET_PHOTOS', payload: demo.demoGetPhotos() })
      return
    }
    if (!user) return

    // Clear all worst phase flags, then set the target
    await supabase
      .from('progress_images')
      .update({ is_worst_phase: false })
      .eq('user_id', user.id)

    if (value) {
      await supabase
        .from('progress_images')
        .update({ is_worst_phase: true })
        .eq('id', photoId)
    }

    // Reload to sync
    loadAll()
  }, [user, isDemoMode, dispatch, supabase, loadAll])

  // ── DELETE PHOTO ──────────────────────────────────────────────────────────
  const deletePhoto = useCallback(async (photoId: string, storagePath?: string) => {
    if (isDemoMode) {
      demo.demoDeletePhoto(photoId)
      dispatch({ type: 'DELETE_PHOTO', payload: photoId })
      return true
    }
    if (!user) return false

    if (storagePath) {
      await supabase.storage.from('progress-images').remove([storagePath])
    }
    const { error } = await supabase.from('progress_images').delete().eq('id', photoId)
    if (error) { showToast('Failed to delete', 'error'); return false }
    dispatch({ type: 'DELETE_PHOTO', payload: photoId })
    return true
  }, [user, isDemoMode, dispatch, showToast, supabase])

  return { loadAll, addWeight, logHabit, addPhoto, setWorstPhase, deletePhoto }
}

// ── HELPERS ──────────────────────────────────────────────────────────────────

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
