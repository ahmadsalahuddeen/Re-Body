// components/modules/GuidedSession.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Full-screen guided session overlay. Used by any ritual page.
// Module-agnostic — pass exercises and onComplete callback.
// Covers the entire screen when active, restoring the page underneath when done.
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from '@/hooks/useSession'
import { TimerRing } from '@/components/ui/TimerRing'
import type { Exercise } from '@/types'

interface GuidedSessionProps {
  exercises: Exercise[]
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  accentHex?: string
}

export function GuidedSession({
  exercises,
  isOpen,
  onClose,
  onComplete,
  accentHex = '#E8A045',
}: GuidedSessionProps) {
  const { active, progress, start, stop, togglePause, skip } = useSession({
    exercises,
    onComplete,
  })

  // Start session when overlay opens
  const handleOpen = () => { if (!active) start() }

  const currentEx = exercises[progress.exerciseIdx]

  const handleClose = () => {
    stop()
    onClose()
  }

  return (
    <AnimatePresence onExitComplete={() => {}}>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] bg-bg flex flex-col
                     items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onAnimationComplete={handleOpen}
        >
          {/* ── TOP BAR ── */}
          <div className="absolute top-0 left-0 right-0">
            {/* Progress bar */}
            <div className="h-0.5 bg-border">
              <motion.div
                className="h-full bg-accent"
                animate={{ width: `${progress.progressPct}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            {/* Exercise counter + close */}
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <span className="font-display font-semibold text-ink-muted uppercase tracking-widest"
                style={{ fontSize: '11px' }}>
                Exercise {progress.exerciseIdx + 1} of {exercises.length}
              </span>
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-full bg-bg-3 border border-border
                           text-ink-sub flex items-center justify-center
                           hover:border-border-bright hover:text-ink
                           transition-colors text-lg"
                aria-label="Close session"
              >
                ✕
              </button>
            </div>
          </div>

          {/* ── MAIN CONTENT ── */}
          <div className="flex flex-col items-center text-center px-10 gap-2">
            {/* Phase label */}
            <AnimatePresence mode="wait">
              <motion.span
                key={progress.phase}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="font-display font-bold uppercase tracking-[0.3em]"
                style={{
                  fontSize: '12px',
                  color: progress.phase === 'rest' ? 'var(--rest-color)' : accentHex,
                }}
              >
                {progress.phase === 'rest' ? 'REST' : 'WORK'}
              </motion.span>
            </AnimatePresence>

            {/* Exercise name */}
            <AnimatePresence mode="wait">
              <motion.h1
                key={currentEx?.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.03 }}
                className="font-display font-black text-ink uppercase leading-none"
                style={{ fontSize: 'clamp(32px, 9vw, 52px)', letterSpacing: '0.01em' }}
              >
                {currentEx?.name ?? 'DONE'}
              </motion.h1>
            </AnimatePresence>

            {/* Set counter */}
            <p className="font-body text-ink-sub tracking-wider" style={{ fontSize: '14px' }}>
              Set {progress.setIdx + 1} of {progress.totalSets}
            </p>

            {/* Side label */}
            {progress.sideLabel && (
              <motion.p
                key={progress.sideLabel}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-display font-bold uppercase tracking-[0.2em] mt-1"
                style={{ fontSize: '13px', color: accentHex }}
              >
                {progress.sideLabel}
              </motion.p>
            )}

            {/* Timer ring */}
            <div className="my-8">
              <TimerRing
                timeLeft={progress.timeLeft}
                duration={progress.phaseDuration}
                phase={progress.phase}
                size={196}
              />
            </div>
          </div>

          {/* ── CONTROLS ── */}
          <div className="absolute bottom-10 left-0 right-0 flex gap-3 px-6">
            <button
              onClick={togglePause}
              className="flex-1 bg-bg-3 border border-border text-ink-sub
                         font-display font-bold uppercase tracking-[0.15em] text-sm
                         py-4 rounded-pill
                         hover:border-border-bright hover:text-ink
                         transition-all duration-150"
            >
              {progress.paused ? 'RESUME' : 'PAUSE'}
            </button>
            <button
              onClick={skip}
              className="flex-1 bg-transparent border font-display font-bold
                         uppercase tracking-[0.15em] text-sm
                         py-4 rounded-pill
                         transition-all duration-150"
              style={{ borderColor: accentHex, color: accentHex }}
            >
              SKIP →
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
