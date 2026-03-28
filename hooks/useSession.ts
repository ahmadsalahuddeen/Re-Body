// hooks/useSession.ts
// ─────────────────────────────────────────────────────────────────────────────
// Guided session engine — handles the timer loop, set/side/phase progression,
// and calls back when the session is complete.
//
// Designed to be module-agnostic: pass any Exercise[] array to it.
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Exercise, SessionPhase } from '@/types'

export interface SessionProgress {
  exerciseIdx: number
  setIdx: number          // Flat set index (counts across sides)
  totalSets: number       // Total sets for current exercise (sets × sides)
  sideLabel: string | null
  phase: SessionPhase
  timeLeft: number
  phaseDuration: number   // Total duration of current phase (for ring progress)
  paused: boolean
  progressPct: number     // Overall session progress 0–100
}

interface UseSessionOptions {
  exercises: Exercise[]
  onComplete: () => void
}

export function useSession({ exercises, onComplete }: UseSessionOptions) {
  const [active, setActive] = useState(false)
  const [exIdx, setExIdx] = useState(0)
  const [setIdx, setSetIdx] = useState(0)
  const [phase, setPhase] = useState<SessionPhase>('work')
  const [timeLeft, setTimeLeft] = useState(0)
  const [phaseDuration, setPhaseDuration] = useState(0)
  const [paused, setPaused] = useState(false)

  // Use refs for values accessed inside the interval callback
  const stateRef = useRef({ exIdx, setIdx, phase, timeLeft, paused, exercises })
  stateRef.current = { exIdx, setIdx, phase, timeLeft, paused, exercises }

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── HELPERS ────────────────────────────────────────────────────────────────

  const getEx = (idx: number) => exercises[idx]

  const getTotalSets = (ex: Exercise) => ex.sets * (ex.sides?.length ?? 1)

  const getSideLabel = (ex: Exercise, flatSetIdx: number): string | null => {
    if (!ex.sides) return null
    return ex.sides[flatSetIdx % ex.sides.length]
  }

  // Total session seconds — used for overall progress bar
  const totalSessionSec = exercises.reduce((acc, ex) => {
    const ts = getTotalSets(ex)
    return acc + ex.duration_sec * ts + ex.rest_sec * (ts - 1)
  }, 0)

  // Calculate elapsed seconds up to current point
  const calcElapsed = useCallback((eIdx: number, sIdx: number, ph: SessionPhase) => {
    let elapsed = 0
    for (let i = 0; i < eIdx; i++) {
      const ex = exercises[i]
      const ts = getTotalSets(ex)
      elapsed += ex.duration_sec * ts + ex.rest_sec * (ts - 1)
    }
    const ex = exercises[eIdx]
    if (!ex) return elapsed
    const ts = getTotalSets(ex)
    const perSet = ex.duration_sec + ex.rest_sec
    elapsed += sIdx * perSet
    if (ph === 'rest') elapsed += ex.duration_sec
    return elapsed
  }, [exercises]) // eslint-disable-line

  // ── ADVANCE PHASE ──────────────────────────────────────────────────────────
  const advance = useCallback(() => {
    const { exIdx, setIdx, exercises } = stateRef.current
    const ex = getEx(exIdx)
    if (!ex) { setActive(false); onComplete(); return }

    const totalSets = getTotalSets(ex)
    const nextSetIdx = setIdx + 1

    if (nextSetIdx >= totalSets) {
      // All sets done → move to next exercise
      const nextExIdx = exIdx + 1
      if (nextExIdx >= exercises.length) {
        // Session complete
        clearInterval(timerRef.current!)
        setActive(false)
        onComplete()
        return
      }
      // Brief rest before next exercise
      setExIdx(nextExIdx)
      setSetIdx(0)
      setPhase('rest')
      const dur = exercises[nextExIdx].rest_sec
      setTimeLeft(dur)
      setPhaseDuration(dur)
    } else if (phase === 'work') {
      // Go to rest
      setSetIdx(nextSetIdx)
      setPhase('rest')
      const dur = ex.rest_sec
      setTimeLeft(dur)
      setPhaseDuration(dur)
    } else {
      // Rest done → back to work (setIdx already incremented)
      setPhase('work')
      const dur = ex.duration_sec
      setTimeLeft(dur)
      setPhaseDuration(dur)
    }
  }, [phase, onComplete]) // eslint-disable-line

  // ── TIMER LOOP ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return
    timerRef.current = setInterval(() => {
      if (stateRef.current.paused) return
      setTimeLeft((prev) => {
        if (prev <= 1) { advance(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [active, advance])

  // ── PUBLIC API ─────────────────────────────────────────────────────────────

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

  const stop = useCallback(() => {
    clearInterval(timerRef.current!)
    setActive(false)
    setPaused(false)
  }, [])

  const togglePause = useCallback(() => setPaused((p) => !p), [])

  const skip = useCallback(() => {
    setTimeLeft(1) // will trigger advance on next tick
  }, [])

  // ── DERIVED STATE ──────────────────────────────────────────────────────────
  const ex = getEx(exIdx)
  const totalSets = ex ? getTotalSets(ex) : 0
  const progress: SessionProgress = {
    exerciseIdx: exIdx,
    setIdx,
    totalSets,
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
