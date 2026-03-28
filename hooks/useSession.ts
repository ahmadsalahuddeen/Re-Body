// hooks/useSession.ts
// ─────────────────────────────────────────────────────────────────────────────
// Guided session timer engine.
//
// WHAT IT DOES:
// Manages the state machine for a timed exercise session:
//   work (count down) → rest (count down) → next set → ... → complete
//
// WHY A HOOK (not component state)?
// The timer logic is complex and needs refs to avoid stale closures inside
// setInterval. Isolating it here keeps GuidedSession.tsx purely presentational.
//
// MODULE-AGNOSTIC:
// Takes an Exercise[] array — works for any module's routine.
// Face Rebirth, Communication Rebirth, etc. all use this same engine.
//
// SIDES LOGIC:
// If an exercise has sides: ['LEFT', 'RIGHT'] and sets: 3,
// the total sets = 3 × 2 = 6, cycling: L, R, L, R, L, R
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Exercise, SessionPhase } from '@/types'

// ── PUBLIC INTERFACE ──────────────────────────────────────────────────────────

/**
 * The derived progress state exposed to the UI component.
 * Everything the component needs to render — no raw state exposed.
 */
export interface SessionProgress {
  exerciseIdx: number       // Current exercise index (0-based) into the exercises array
  setIdx: number            // Current set number within the exercise (0-based flat index)
  totalSets: number         // Total sets for current exercise (sets × sides count)
  sideLabel: string | null  // e.g. "LEFT SIDE" or null if exercise has no sides
  phase: SessionPhase       // 'work' | 'rest' | 'complete'
  timeLeft: number          // Seconds remaining in current phase
  phaseDuration: number     // Total seconds in current phase (for ring progress = timeLeft/phaseDuration)
  paused: boolean
  progressPct: number       // 0–100 — overall session completion for the top progress bar
}

interface UseSessionOptions {
  exercises: Exercise[]
  /** Called when all exercises and sets are done. Caller handles habit logging. */
  onComplete: () => void
}

// ── HOOK ─────────────────────────────────────────────────────────────────────

export function useSession({ exercises, onComplete }: UseSessionOptions) {
  // Whether the overlay is running (not paused — just whether the session started)
  const [active, setActive]             = useState(false)
  // Current position in the exercise array
  const [exIdx, setExIdx]               = useState(0)
  // Flat set index — counts across all sets × sides for the current exercise
  const [setIdx, setSetIdx]             = useState(0)
  // Current timer phase
  const [phase, setPhase]               = useState<SessionPhase>('work')
  // Seconds remaining
  const [timeLeft, setTimeLeft]         = useState(0)
  // Total seconds in current phase (for progress ring calculation)
  const [phaseDuration, setPhaseDuration] = useState(0)
  // Is the timer paused?
  const [paused, setPaused]             = useState(false)

  // Refs are used inside setInterval callbacks to read current values without
  // causing stale closures. Without refs, the interval would always see the
  // values from when it was created, not the latest state.
  const stateRef = useRef({ exIdx, setIdx, phase, paused, exercises })
  stateRef.current = { exIdx, setIdx, phase, paused, exercises }

  // Holds the setInterval handle so we can clear it on cleanup/pause
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── HELPERS ────────────────────────────────────────────────────────────────

  /** Total sets for an exercise accounting for sides (e.g. 3 sets × 2 sides = 6) */
  const getTotalSets = (ex: Exercise): number =>
    ex.sets * (ex.sides?.length ?? 1)

  /**
   * Resolves the side label for the current flat set index.
   * Example: sides=['LEFT','RIGHT'], flatIdx=3 → 'RIGHT' (3 % 2 = 1)
   */
  const getSideLabel = (ex: Exercise, flatSetIdx: number): string | null => {
    if (!ex.sides) return null
    return ex.sides[flatSetIdx % ex.sides.length]
  }

  /**
   * Calculates total elapsed seconds up to the current position.
   * Used to derive the overall progress bar percentage.
   */
  const totalSessionSec = exercises.reduce((acc, ex) => {
    const ts = getTotalSets(ex)
    return acc + ex.duration_sec * ts + ex.rest_sec * (ts - 1)
  }, 0)

  const calcElapsed = useCallback(
    (eIdx: number, sIdx: number, ph: SessionPhase): number => {
      let elapsed = 0
      // Sum all completed exercises
      for (let i = 0; i < eIdx; i++) {
        const ex = exercises[i]
        const ts = getTotalSets(ex)
        elapsed += ex.duration_sec * ts + ex.rest_sec * (ts - 1)
      }
      // Add progress within current exercise
      const ex = exercises[eIdx]
      if (!ex) return elapsed
      elapsed += sIdx * (ex.duration_sec + ex.rest_sec) // completed sets
      if (ph === 'rest') elapsed += ex.duration_sec     // current set's work is done
      return elapsed
    },
    [exercises] // eslint-disable-line react-hooks/exhaustive-deps
  )

  // ── ADVANCE PHASE ──────────────────────────────────────────────────────────
  /**
   * Called when timeLeft reaches 0. Moves the session to the next phase:
   *   work → rest → next set's work → ... → complete
   *
   * Uses stateRef.current to read the latest state inside the setInterval callback.
   */
  const advance = useCallback(() => {
    const { exIdx, setIdx, exercises } = stateRef.current
    const ex = exercises[exIdx]
    if (!ex) { setActive(false); onComplete(); return }

    const totalSets = getTotalSets(ex)
    const nextSetIdx = setIdx + 1

    if (phase === 'work') {
      if (nextSetIdx >= totalSets) {
        // All sets done for this exercise → move to next exercise
        const nextExIdx = exIdx + 1
        if (nextExIdx >= exercises.length) {
          // All exercises done → session complete!
          clearInterval(timerRef.current!)
          setActive(false)
          onComplete()
          return
        }
        // Brief rest before the next exercise starts
        const nextEx = exercises[nextExIdx]
        setExIdx(nextExIdx)
        setSetIdx(0)
        setPhase('rest')
        setTimeLeft(nextEx.rest_sec)
        setPhaseDuration(nextEx.rest_sec)
      } else {
        // More sets to go → go to rest
        setSetIdx(nextSetIdx)
        setPhase('rest')
        setTimeLeft(ex.rest_sec)
        setPhaseDuration(ex.rest_sec)
      }
    } else {
      // Rest phase ended → back to work (setIdx was already incremented)
      setPhase('work')
      setTimeLeft(ex.duration_sec)
      setPhaseDuration(ex.duration_sec)
    }
  }, [phase, onComplete]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── TIMER LOOP ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return

    timerRef.current = setInterval(() => {
      // Read paused from ref (not state) to avoid stale closure
      if (stateRef.current.paused) return

      setTimeLeft((prev) => {
        if (prev <= 1) {
          advance() // Triggers next phase
          return 0
        }
        return prev - 1
      })
    }, 1000) // Fires every 1 second

    // Clear interval on unmount or when active becomes false
    return () => clearInterval(timerRef.current!)
  }, [active, advance])

  // ── PUBLIC API ─────────────────────────────────────────────────────────────

  /** Starts the session from exercise 0, set 0, work phase */
  const start = useCallback(() => {
    if (!exercises.length) return
    const ex = exercises[0]
    setExIdx(0)
    setSetIdx(0)
    setPhase('work')
    setTimeLeft(ex.duration_sec)
    setPhaseDuration(ex.duration_sec)
    setPaused(false)
    setActive(true)
  }, [exercises])

  /** Stops the session and resets. Used when the user taps the close button. */
  const stop = useCallback(() => {
    clearInterval(timerRef.current!)
    setActive(false)
    setPaused(false)
  }, [])

  /** Toggles pause/resume without losing the current timer position */
  const togglePause = useCallback(() => setPaused((p) => !p), [])

  /**
   * Skips the current phase immediately.
   * Sets timeLeft to 1 so the interval triggers advance() on the next tick
   * (rather than calling advance() directly, which avoids a double-advance race).
   */
  const skip = useCallback(() => {
    setTimeLeft(1)
  }, [])

  // ── DERIVED PROGRESS ────────────────────────────────────────────────────────
  // Build the progress snapshot that GuidedSession.tsx uses to render
  const ex = exercises[exIdx]
  const progress: SessionProgress = {
    exerciseIdx: exIdx,
    setIdx,
    totalSets: ex ? getTotalSets(ex) : 0,
    sideLabel: ex ? getSideLabel(ex, setIdx) : null,
    phase,
    timeLeft,
    phaseDuration,
    paused,
    progressPct: totalSessionSec > 0
      ? Math.min(100, (calcElapsed(exIdx, setIdx, phase) / totalSessionSec) * 100)
      : 0,
  }

  return { active, progress, start, stop, togglePause, skip }
}
