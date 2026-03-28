// components/modules/SessionComplete.tsx
// Full-screen completion moment. Shown after every finished session.

'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import type { ModuleId } from '@/types'

interface SessionCompleteProps {
  moduleId: ModuleId
  onDismiss: () => void
}

export function SessionComplete({ moduleId, onDismiss }: SessionCompleteProps) {
  const router = useRouter()
  const { state } = useAppStore()

  // Calculate streak for this module
  const moduleLogs = state.habitLogs.filter((h) => h.module_id === moduleId)
  const doneDates = new Set(moduleLogs.map((h) => h.date))
  let streak = 0
  const check = new Date()
  while (doneDates.has(check.toISOString().split('T')[0])) {
    streak++
    check.setDate(check.getDate() - 1)
  }

  const totalSessions = moduleLogs.length
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  }).toUpperCase()

  const handleHome = () => {
    onDismiss()
    router.push('/')
  }

  return (
    <motion.div
      className="fixed inset-0 z-[110] bg-bg flex flex-col
                 items-center justify-center px-8 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Checkmark */}
      <motion.div
        className="w-20 h-20 rounded-full bg-accent flex items-center justify-center
                   text-bg text-4xl mb-6"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
      >
        ✓
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex flex-col items-center gap-2"
      >
        <h1 className="font-display font-black text-ink uppercase leading-none"
          style={{ fontSize: 'clamp(40px, 12vw, 56px)' }}>
          RITUAL<br />COMPLETE
        </h1>
        <p className="font-body text-ink-sub text-sm mt-1">
          You showed up. That&apos;s everything.
        </p>
        <p className="font-display font-semibold text-accent uppercase tracking-[0.2em] mt-2"
          style={{ fontSize: '12px' }}>
          {today}
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="flex gap-3 mt-8 w-full max-w-xs"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <StatBox value={streak || 1} label="Day Streak" />
        <StatBox value={totalSessions} label="Total Sessions" />
      </motion.div>

      {/* CTA */}
      <motion.button
        className="w-full max-w-xs mt-10 bg-accent text-bg
                   font-display font-black text-lg uppercase tracking-[0.12em]
                   py-5 rounded-pill active:scale-[0.98] transition-transform"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        onClick={handleHome}
      >
        BACK TO BASE CAMP
      </motion.button>
    </motion.div>
  )
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex-1 bg-bg-2 border border-border rounded-card py-4 px-3">
      <p className="font-display font-black text-accent leading-none mb-1"
        style={{ fontSize: '40px' }}>
        {value}
      </p>
      <p className="font-display text-ink-muted uppercase tracking-widest"
        style={{ fontSize: '10px' }}>
        {label}
      </p>
    </div>
  )
}
