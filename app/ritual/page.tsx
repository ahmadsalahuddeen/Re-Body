// app/ritual/page.tsx  ── FACE REBIRTH RITUAL
// ─────────────────────────────────────────────────────────────────────────────
// "The Ritual" — the heart of the app. Focused. Immersive.
//
// Sections:
//   1. YouTube video embed with timestamp jumping
//   2. Exercise breakdown cards
//   3. "Begin Guided Session" CTA → triggers full-screen overlay
//   4. Session complete screen (auto-logs habit on completion)
//
// To build a new module's ritual page (e.g. Communication Rebirth):
//   Copy this file → app/comms/page.tsx
//   Change FACE_MODULE → COMMS_MODULE
//   That's it.
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { FACE_MODULE, calcSessionDuration, formatDuration } from '@/lib/modules'
import { GuidedSession } from '@/components/modules/GuidedSession'
import { SessionComplete } from '@/components/modules/SessionComplete'
import { useData } from '@/hooks/useData'
import { useAppStore } from '@/lib/store'
import { SectionLabel } from '@/components/ui/SectionLabel'
import type { Exercise } from '@/types'

const MOD = FACE_MODULE
const YT_VIDEO_ID = 'tX3eueEFCM8'

export default function RitualPage() {
  const [sessionOpen, setSessionOpen] = useState(false)
  const [sessionDone, setSessionDone] = useState(false)
  const { logHabit } = useData()
  const { showToast } = useAppStore()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const totalSec = calcSessionDuration(MOD.exercises)
  const totalMin = Math.ceil(totalSec / 60)

  // Seek YouTube embed to specific timestamp
  const seekTo = (seconds: number) => {
    if (!iframeRef.current) return
    const base = `https://www.youtube.com/embed/${YT_VIDEO_ID}`
    iframeRef.current.src = `${base}?enablejsapi=1&modestbranding=1&rel=0&start=${seconds}&autoplay=1`
  }

  const handleSessionComplete = async () => {
    setSessionOpen(false)
    await logHabit(MOD.id)
    setSessionDone(true)
  }

  return (
    <>
      <div className="min-h-dvh bg-bg">

        {/* ── VIDEO EMBED ── */}
        <div className="px-4 pt-4">
          <div className="relative w-full rounded-card overflow-hidden border border-border bg-black"
            style={{ paddingTop: '56.25%' }}>
            <iframe
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${YT_VIDEO_ID}?modestbranding=1&rel=0`}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
              allowFullScreen
              title="Face Rebirth Routine"
            />
          </div>
        </div>

        {/* ── PAGE HEADER ── */}
        <div className="flex items-end justify-between px-4 pt-6 pb-0">
          <h1 className="font-display font-black text-ink uppercase leading-none"
            style={{ fontSize: '40px', letterSpacing: '0.01em' }}>
            FACE<br />REBIRTH
          </h1>
          <div className="text-right font-display text-ink-sub pb-1" style={{ fontSize: '12px' }}>
            <span className="text-accent font-bold">~{totalMin} min</span><br />
            {MOD.exercises.length} exercises<br />
            daily ritual
          </div>
        </div>

        {/* ── EXERCISE LIST ── */}
        <div className="px-4 pt-5 pb-4 flex flex-col gap-3">
          <SectionLabel>The Exercises</SectionLabel>
          {MOD.exercises.map((ex, i) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              index={i}
              onSeek={seekTo}
            />
          ))}
        </div>

        {/* ── BEGIN SESSION CTA ── */}
        <div className="px-4 pb-8">
          <button
            onClick={() => setSessionOpen(true)}
            className="w-full bg-accent text-bg font-display font-black
                       text-xl uppercase tracking-[0.1em]
                       py-5 rounded-pill
                       active:scale-[0.98] transition-transform duration-150"
          >
            BEGIN GUIDED SESSION
          </button>
        </div>

      </div>

      {/* ── GUIDED SESSION OVERLAY ── */}
      <GuidedSession
        exercises={MOD.exercises}
        isOpen={sessionOpen}
        onClose={() => setSessionOpen(false)}
        onComplete={handleSessionComplete}
        accentHex={MOD.accentHex}
      />

      {/* ── COMPLETION SCREEN ── */}
      {sessionDone && (
        <SessionComplete
          moduleId={MOD.id}
          onDismiss={() => setSessionDone(false)}
        />
      )}
    </>
  )
}

// ── EXERCISE CARD ─────────────────────────────────────────────────────────────

interface ExerciseCardProps {
  exercise: Exercise
  index: number
  onSeek: (seconds: number) => void
}

function ExerciseCard({ exercise: ex, index, onSeek }: ExerciseCardProps) {
  const sides = ex.sides ? ex.sides.length : 1
  const totalSets = ex.sets * sides

  return (
    <motion.div
      className="bg-bg-2 border border-border rounded-card p-4
                 hover:border-border-bright transition-colors duration-200
                 relative overflow-hidden group"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: 'easeOut' }}
    >
      {/* Left accent bar — visible on hover */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent
                      opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      {/* Top row: number + name + timestamp */}
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="font-display font-bold text-accent tracking-[0.2em] uppercase mb-1"
            style={{ fontSize: '11px' }}>
            0{ex.id}
          </p>
          <h3 className="font-display font-black text-ink uppercase leading-tight"
            style={{ fontSize: '22px', letterSpacing: '0.01em' }}>
            {ex.name}
          </h3>
        </div>

        {/* Timestamp link — seeks video to this exercise */}
        <button
          onClick={() => onSeek(ex.timestamp_sec)}
          className="flex items-center gap-1.5 bg-bg-3 border border-border
                     rounded-lg px-2.5 py-1.5 shrink-0
                     font-display font-semibold text-ink-sub
                     hover:border-accent hover:text-accent
                     transition-colors duration-150"
          style={{ fontSize: '12px' }}
          title={`Jump to ${ex.timestamp_label} in video`}
        >
          <svg width="9" height="10" viewBox="0 0 9 10" fill="currentColor">
            <path d="M0 0l9 5-9 5V0z"/>
          </svg>
          {ex.timestamp_label}
        </button>
      </div>

      {/* Pills: sets · duration · rest · sides */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        <Pill accent>{totalSets > 1 ? `${totalSets} sets` : '1 set'}</Pill>
        <Pill>{formatDuration(ex.duration_sec)}</Pill>
        <Pill>{ex.rest_sec}s rest</Pill>
        {ex.sides && <Pill>each side</Pill>}
      </div>

      {/* Description */}
      <p className="text-ink-sub leading-relaxed mt-3" style={{ fontSize: '13px' }}>
        {ex.description}
      </p>
    </motion.div>
  )
}

function Pill({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span className={`px-2.5 py-1 rounded-full border text-xs font-medium ${
      accent
        ? 'border-accent/40 text-accent bg-accent/8'
        : 'border-border text-ink-sub'
    }`}
      style={{ fontSize: '11px' }}>
      {children}
    </span>
  )
}
