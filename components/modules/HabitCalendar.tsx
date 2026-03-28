// components/modules/HabitCalendar.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Monthly dot grid calendar showing habit completion per day.
// Works with any module — pass the moduleId to filter logs.
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { Card } from '@/components/ui/Card'
import type { ModuleId } from '@/types'

interface HabitCalendarProps {
  moduleId: ModuleId
  label?: string
}

export function HabitCalendar({ moduleId, label = 'Face Rebirth' }: HabitCalendarProps) {
  const { state } = useAppStore()

  const { days, streak, doneDates } = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const today = now.getDate()

    // Filter habit logs for this module
    const moduleLogs = state.habitLogs.filter((h) => h.module_id === moduleId)
    const doneDates = new Set(
      moduleLogs.map((h) => {
        const d = new Date(h.date)
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      })
    )

    // Build day array
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1
      const key = `${year}-${month}-${d}`
      return { day: d, done: doneDates.has(key), isToday: d === today }
    })

    // Calculate current streak (count backwards from today)
    let streak = 0
    let check = new Date(year, month, today)
    while (true) {
      const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`
      if (doneDates.has(key)) {
        streak++
        check.setDate(check.getDate() - 1)
      } else break
    }

    return { days, streak, doneDates }
  }, [state.habitLogs, moduleId])

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-display font-bold text-ink uppercase tracking-wide" style={{ fontSize: '15px' }}>
          {label}
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className="font-display font-black text-accent leading-none" style={{ fontSize: '28px' }}>
            {streak}
          </span>
          <span className="font-display font-medium text-ink-muted uppercase tracking-wider" style={{ fontSize: '10px' }}>
            streak
          </span>
        </div>
      </div>

      {/* Dot grid — 7 columns (Sun–Sat visual rhythm) */}
      <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {days.map(({ day, done, isToday }) => (
          <div
            key={day}
            title={`${day} — ${done ? 'Done' : 'Missed'}`}
            className={`aspect-square rounded-full border transition-all duration-200 ${
              done
                ? 'bg-accent border-accent'
                : isToday
                  ? 'bg-transparent border-accent animate-dot-pulse'
                  : 'bg-transparent border-border'
            }`}
          />
        ))}
      </div>

      {/* Month label */}
      <p className="font-display text-ink-muted mt-3 tracking-widest uppercase"
        style={{ fontSize: '10px' }}>
        {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </p>
    </Card>
  )
}
