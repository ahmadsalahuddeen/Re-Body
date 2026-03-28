// lib/store.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Global app state — React Context + useReducer.
//
// WHY NOT ZUSTAND/REDUX?
// This app's state is simple and predictable: arrays of weights, habits, photos,
// and a toast queue. Context + useReducer handles it cleanly without adding
// a dependency. If the app grows significantly, swapping to Zustand is trivial
// since the shape here is already action-based.
//
// WHAT LIVES HERE:
//   - weights, habitLogs, photos — loaded once on auth, updated optimistically
//   - toasts — ephemeral notifications, auto-removed after 2.5s
//   - isLoading — initial data fetch state
//
// WHAT DOES NOT LIVE HERE:
//   - Auth state → lives in hooks/useAuth.tsx (separate concern)
//   - Session timer state → lives in hooks/useSession.ts (local to that hook)
//   - Pending upload file → lives in mirror/page.tsx (local component state)
// ─────────────────────────────────────────────────────────────────────────────

'use client' // This file renders JSX (AppProvider returns a Provider element)

import React, { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react'
import type { WeightLog, HabitLog, ProgressImage, ToastMessage } from '@/types'

// ── STATE SHAPE ───────────────────────────────────────────────────────────────

interface AppState {
  weights: WeightLog[]          // All weight entries for the user, newest first
  habitLogs: HabitLog[]         // All habit completions, newest first
  photos: ProgressImage[]       // All progress photos, newest first (includes signed URLs)
  toasts: ToastMessage[]        // Queue of active toast notifications
  isLoading: boolean            // True during initial data fetch after login
}

const initialState: AppState = {
  weights: [],
  habitLogs: [],
  photos: [],
  toasts: [],
  isLoading: true, // Start loading so the auth gate shows a spinner, not a flash
}

// ── ACTIONS ───────────────────────────────────────────────────────────────────
// Typed discriminated union — TypeScript will catch any typo in action.type

type Action =
  // Bulk-set after initial data load from Supabase or demo localStorage
  | { type: 'SET_WEIGHTS';    payload: WeightLog[] }
  | { type: 'SET_HABIT_LOGS'; payload: HabitLog[] }
  | { type: 'SET_PHOTOS';     payload: ProgressImage[] }
  // Optimistic single-record additions (don't wait for refetch)
  | { type: 'ADD_WEIGHT';     payload: WeightLog }
  | { type: 'ADD_HABIT_LOG';  payload: HabitLog }
  | { type: 'ADD_PHOTO';      payload: ProgressImage }
  // Photo mutations
  | { type: 'UPDATE_PHOTO';   payload: Partial<ProgressImage> & { id: string } }
  | { type: 'DELETE_PHOTO';   payload: string } // payload = photo ID
  // Toast queue management
  | { type: 'ADD_TOAST';      payload: ToastMessage }
  | { type: 'REMOVE_TOAST';   payload: string }  // payload = toast ID
  // Loading flag
  | { type: 'SET_LOADING';    payload: boolean }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    // ── Bulk loads (replace entire array) ────────────────────────────────────
    case 'SET_WEIGHTS':
      return { ...state, weights: action.payload }
    case 'SET_HABIT_LOGS':
      return { ...state, habitLogs: action.payload }
    case 'SET_PHOTOS':
      return { ...state, photos: action.payload }

    // ── Optimistic additions (prepend to keep newest-first order) ─────────────
    case 'ADD_WEIGHT':
      return { ...state, weights: [action.payload, ...state.weights] }
    case 'ADD_HABIT_LOG':
      return { ...state, habitLogs: [action.payload, ...state.habitLogs] }
    case 'ADD_PHOTO':
      return { ...state, photos: [action.payload, ...state.photos] }

    // ── Photo mutations ───────────────────────────────────────────────────────
    case 'UPDATE_PHOTO':
      return {
        ...state,
        photos: state.photos.map((p) =>
          p.id === action.payload.id
            ? { ...p, ...action.payload } // Merge partial update into existing record
            : p
        ),
      }
    case 'DELETE_PHOTO':
      return {
        ...state,
        photos: state.photos.filter((p) => p.id !== action.payload),
      }

    // ── Toast queue ───────────────────────────────────────────────────────────
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.payload] }
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.payload) }

    // ── Loading ───────────────────────────────────────────────────────────────
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    default:
      return state
  }
}

// ── CONTEXT ───────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
  /**
   * Convenience wrapper: shows a toast and auto-removes it after 2.5s.
   * Use this everywhere instead of dispatching ADD_TOAST + REMOVE_TOAST manually.
   *
   * @example
   * showToast('Weight logged', 'success')
   * showToast('Upload failed', 'error')
   * showToast('Copied to clipboard') // defaults to white/neutral
   */
  showToast: (text: string, type?: ToastMessage['type']) => void
}

// null initial value — we throw if used outside Provider (better DX than silent bugs)
const AppContext = createContext<AppContextValue | null>(null)

/** Wraps the app to provide global state. Must be an ancestor of any useAppStore() caller. */
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Stable reference — won't cause re-renders in components that only call showToast
  const showToast = useCallback(
    (text: string, type: ToastMessage['type'] = 'default') => {
      const id = Math.random().toString(36).slice(2) // Simple unique ID
      dispatch({ type: 'ADD_TOAST', payload: { id, text, type } })
      // Auto-dismiss after 2.5 seconds
      setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 2500)
    },
    [] // No deps — dispatch is stable from useReducer
  )

  return (
    <AppContext.Provider value={{ state, dispatch, showToast }}>
      {children}
    </AppContext.Provider>
  )
}

/**
 * Access global app state and dispatch from any Client Component.
 * Throws a descriptive error if called outside AppProvider.
 *
 * @example
 * const { state, dispatch, showToast } = useAppStore()
 * console.log(state.weights)          // All weight logs
 * dispatch({ type: 'ADD_WEIGHT', payload: newEntry }) // Direct dispatch
 * showToast('Saved!')                 // Convenience toast
 */
export function useAppStore() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppStore must be used within <AppProvider>')
  return ctx
}
