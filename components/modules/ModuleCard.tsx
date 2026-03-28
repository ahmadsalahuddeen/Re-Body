// components/modules/ModuleCard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Dashboard card for a single module. Used by the dashboard page.
// Shows streak, start CTA, or "coming soon" locked state.
// This component auto-adapts — just register a new module in lib/modules.ts.
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { useAppStore as useStore } from '@/lib/store'
import type { RebirthModule } from '@/types'
import { calcSessionDuration } from '@/lib/modules'
import { useMemo } from 'react'

interface ModuleCardProps {
  module: RebirthModule
  /** Show as primary full-width hero card (first/main module) */
  primary?: boolean
}

export function ModuleCard({ module: mod, primary = false }: ModuleCardProps) {
  const router = useRouter()
  const { state, showToast } = useStore()

  // Current streak for this module
  const streak = useMemo(() => {
    const moduleLogs = state.habitLogs.filter((h) => h.module_id === mod.id)
    const doneDates = new Set(
      moduleLogs.map((h) => {
        const d = new Date(h.date)
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      })
    )
    const now = new Date()
    let count = 0
    let check = new Date(now)
    while (true) {
      const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`
      if (doneDates.has(key)) { count++; check.setDate(check.getDate() - 1) }
      else break
    }
    return count
  }, [state.habitLogs, mod.id])

  const sessionMin = Math.ceil(calcSessionDuration(mod.exercises) / 60)

  // ── COMING SOON ─────────────────────────────────────────────────────────────
  if (mod.comingSoon) {
    return (
      <div
        className="bg-bg-2 border border-border rounded-card p-5
                   flex items-center justify-between opacity-50 cursor-default"
        onClick={() => showToast(`${mod.name} — coming soon`)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-bg-3 flex items-center justify-center">
            <span className="font-display font-black text-xl text-ink-muted">{mod.icon}</span>
          </div>
          <div>
            <p className="font-display font-bold text-ink uppercase tracking-wide" style={{ fontSize: '15px' }}>
              {mod.name}
            </p>
            <p className="font-display text-ink-muted uppercase tracking-widest mt-0.5"
              style={{ fontSize: '10px' }}>
              {mod.tagline}
            </p>
          </div>
        </div>
        <span className="font-display font-semibold text-ink-muted uppercase tracking-widest
                          bg-border rounded-pill px-3 py-1"
          style={{ fontSize: '10px' }}>
          SOON
        </span>
      </div>
    )
  }

  // ── PRIMARY HERO CARD ────────────────────────────────────────────────────────
  if (primary) {
    return (
      <div className="px-4">
        {/* Start button — the most important element on the screen */}
        <button
          onClick={() => router.push(mod.route)}
          className="w-full bg-accent text-bg font-display font-black
                     text-xl tracking-[0.12em] uppercase
                     py-5 rounded-pill border-none
                     animate-pulse-glow
                     active:scale-[0.97] active:[animation:none]
                     transition-transform duration-150"
        >
          START {mod.name.toUpperCase()}
        </button>

        {/* Meta row below button */}
        <div className="flex items-center justify-center gap-4 mt-3">
          {/* Flame streak */}
          <div className="flex items-center gap-1.5">
            <FlameIcon />
            <span className="font-display font-black text-accent leading-none" style={{ fontSize: '26px' }}>
              {streak}
            </span>
            <span className="font-display text-ink-sub uppercase tracking-widest" style={{ fontSize: '10px' }}>
              day streak
            </span>
          </div>
          <div className="w-px h-5 bg-border" />
          <span className="font-display text-ink-muted uppercase tracking-widest" style={{ fontSize: '10px' }}>
            ~{sessionMin} min · {mod.exercises.length} exercises
          </span>
        </div>
      </div>
    )
  }

  // ── SECONDARY CARD ───────────────────────────────────────────────────────────
  return (
    <div
      className="bg-bg-2 border border-border rounded-card p-5
                 cursor-pointer active:scale-[0.985] hover:border-border-bright
                 transition-all duration-150"
      onClick={() => router.push(mod.route)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-bg-3 flex items-center justify-center
                           border border-border">
            <span className="font-display font-black text-xl" style={{ color: mod.accentHex }}>
              {mod.icon}
            </span>
          </div>
          <div>
            <p className="font-display font-bold text-ink uppercase tracking-wide" style={{ fontSize: '15px' }}>
              {mod.name}
            </p>
            <p className="font-display text-ink-muted uppercase tracking-widest mt-0.5"
              style={{ fontSize: '10px' }}>
              ~{sessionMin} min · {mod.exercises.length} exercises
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display font-black leading-none" style={{ fontSize: '28px', color: mod.accentHex }}>
            {streak}
          </p>
          <p className="font-display text-ink-muted uppercase tracking-widest" style={{ fontSize: '9px' }}>
            streak
          </p>
        </div>
      </div>
    </div>
  )
}

function FlameIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent)">
      <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z"/>
    </svg>
  )
}
