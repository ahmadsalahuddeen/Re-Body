// lib/store.ts
// ─────────────────────────────────────────────────────────────────────────────
// Simple React context-based state store with localStorage demo-mode support.
// We keep this framework-agnostic (no Zustand/Redux) to minimize dependencies.
//
// The store handles:
//   - Weight logs
//   - Habit logs (per module)
//   - Progress photos
//   - Toast notifications
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import React, { createContext, useContext, useReducer, useCallback } from 'react'
import type { WeightLog, HabitLog, ProgressImage, ToastMessage } from '@/types'

// ── STATE SHAPE ───────────────────────────────────────────────────────────────

interface AppState {
  weights: WeightLog[]
  habitLogs: HabitLog[]
  photos: ProgressImage[]
  toasts: ToastMessage[]
  isLoading: boolean
}

const initialState: AppState = {
  weights: [],
  habitLogs: [],
  photos: [],
  toasts: [],
  isLoading: true,
}

// ── ACTIONS ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_WEIGHTS'; payload: WeightLog[] }
  | { type: 'ADD_WEIGHT'; payload: WeightLog }
  | { type: 'SET_HABIT_LOGS'; payload: HabitLog[] }
  | { type: 'ADD_HABIT_LOG'; payload: HabitLog }
  | { type: 'SET_PHOTOS'; payload: ProgressImage[] }
  | { type: 'ADD_PHOTO'; payload: ProgressImage }
  | { type: 'UPDATE_PHOTO'; payload: Partial<ProgressImage> & { id: string } }
  | { type: 'DELETE_PHOTO'; payload: string }
  | { type: 'ADD_TOAST'; payload: ToastMessage }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_WEIGHTS':
      return { ...state, weights: action.payload }
    case 'ADD_WEIGHT':
      return { ...state, weights: [action.payload, ...state.weights] }
    case 'SET_HABIT_LOGS':
      return { ...state, habitLogs: action.payload }
    case 'ADD_HABIT_LOG':
      return { ...state, habitLogs: [action.payload, ...state.habitLogs] }
    case 'SET_PHOTOS':
      return { ...state, photos: action.payload }
    case 'ADD_PHOTO':
      return { ...state, photos: [action.payload, ...state.photos] }
    case 'UPDATE_PHOTO':
      return {
        ...state,
        photos: state.photos.map((p) =>
          p.id === action.payload.id ? { ...p, ...action.payload } : p
        ),
      }
    case 'DELETE_PHOTO':
      return { ...state, photos: state.photos.filter((p) => p.id !== action.payload) }
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.payload] }
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.payload) }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    default:
      return state
  }
}

// ── CONTEXT ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
  showToast: (text: string, type?: ToastMessage['type']) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const showToast = useCallback((text: string, type: ToastMessage['type'] = 'default') => {
    const id = Math.random().toString(36).slice(2)
    dispatch({ type: 'ADD_TOAST', payload: { id, text, type } })
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 2500)
  }, [])

  return (
    <AppContext.Provider value={{ state, dispatch, showToast }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppStore() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppStore must be used within AppProvider')
  return ctx
}
