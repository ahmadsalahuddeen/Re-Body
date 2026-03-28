// app/page.tsx  ── DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
// "The War Room" — opening screen. Should feel focused and motivating.
//
// Layout:
//   1. Header with logo + sign-out
//   2. Identity anchors (worst vs now photos)
//   3. Primary module CTA (first active module = Face Rebirth)
//   4. Weight tracker
//   5. Habit calendar
//   6. All other modules (active + coming soon cards)
//
// Adding a new module: register it in lib/modules.ts — it auto-appears here.
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { ALL_MODULES, FACE_MODULE } from '@/lib/modules'
import { IdentityAnchors } from '@/components/modules/IdentityAnchors'
import { ModuleCard } from '@/components/modules/ModuleCard'
import { WeightTracker } from '@/components/modules/WeightTracker'
import { HabitCalendar } from '@/components/modules/HabitCalendar'
import { SectionLabel } from '@/components/ui/SectionLabel'

// Stagger animation for sections
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' },
  }),
}

export default function DashboardPage() {
  const { user, isDemoMode, signOut } = useAuth()

  // First module is always the primary hero module
  const primaryModule = FACE_MODULE
  // Other modules (not the primary, including coming soon)
  const otherModules = ALL_MODULES.filter((m) => m.id !== primaryModule.id)

  const userInitial = isDemoMode ? 'D' : (user?.email?.[0]?.toUpperCase() ?? '?')

  return (
    <div className="min-h-dvh bg-bg">
      {/* ── PAGE HEADER ── */}
      <header className="flex items-center justify-between px-4 pt-5 pb-2">
        <span className="font-display font-bold text-accent tracking-[0.25em] uppercase"
          style={{ fontSize: '12px' }}>
          PBR
        </span>
        <button
          onClick={signOut}
          className="w-8 h-8 rounded-full bg-accent/15 border border-accent
                     font-display font-bold text-accent text-sm
                     flex items-center justify-center
                     active:bg-accent active:text-bg transition-all"
          title="Sign out"
        >
          {userInitial}
        </button>
      </header>

      {/* ── CONTENT SECTIONS ── */}
      <div className="flex flex-col gap-5 pb-4">

        {/* 1. Identity Anchors */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
          <IdentityAnchors />
        </motion.div>

        {/* 2. Primary CTA — most important element on screen */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
          <ModuleCard module={primaryModule} primary />
        </motion.div>

        {/* 3. Weight Tracker */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show"
          className="px-4">
          <SectionLabel>Weight</SectionLabel>
          <WeightTracker />
        </motion.div>

        {/* 4. Habit Calendar for primary module */}
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show"
          className="px-4">
          <SectionLabel>This Month</SectionLabel>
          <HabitCalendar moduleId={primaryModule.id} label={primaryModule.name} />
        </motion.div>

        {/* 5. Other modules section */}
        {otherModules.length > 0 && (
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show"
            className="px-4">
            <SectionLabel>All Modules</SectionLabel>
            <div className="flex flex-col gap-2.5">
              {otherModules.map((mod) => (
                <ModuleCard key={mod.id} module={mod} />
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  )
}
