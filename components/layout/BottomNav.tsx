// components/layout/BottomNav.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Mobile-first sticky bottom navigation.
// Active module routes are derived from ALL_MODULES — add a module in
// lib/modules.ts and it auto-appears here (if comingSoon: false).
//
// Designed for thumb reach: icons + short labels, no text-heavy nav.
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { getActiveModules } from '@/lib/modules'

// ── STATIC NAV ITEMS ─────────────────────────────────────────────────────────
// These are always present regardless of modules

const STATIC_ITEMS = [
  {
    label: 'HOME',
    href: '/',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 12L12 3l9 9"/>
        <path d="M9 21V12h6v9"/>
        <path d="M5 10v11h14V10"/>
      </svg>
    ),
  },
  {
    label: 'MIRROR',
    href: '/mirror',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <path d="M21 15l-5-5L5 21"/>
      </svg>
    ),
  },
]

export function BottomNav() {
  const pathname = usePathname()
  const activeModules = getActiveModules()

  // Build module nav items from the module registry
  const moduleItems = activeModules.map((mod) => ({
    label: mod.name.replace(' Rebirth', '').toUpperCase(),
    href: mod.route,
    icon: (
      <span className="font-display font-black text-lg leading-none">{mod.icon}</span>
    ),
  }))

  const allItems = [STATIC_ITEMS[0], ...moduleItems, STATIC_ITEMS[1]]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe
                 bg-bg/90 backdrop-blur-xl
                 border-t border-border"
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {allItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl
                         transition-colors duration-150 relative min-w-[56px]"
            >
              {/* Active indicator dot */}
              {active && (
                <motion.div
                  layoutId="nav-active-dot"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1
                             rounded-full bg-accent"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              {/* Icon */}
              <span className={`transition-colors duration-150 ${
                active ? 'text-accent' : 'text-ink-muted'
              }`}>
                {item.icon}
              </span>

              {/* Label */}
              <span className={`font-display font-semibold tracking-wider
                               transition-colors duration-150
                               ${active ? 'text-accent' : 'text-ink-muted'}
                               `}
                style={{ fontSize: '9px', letterSpacing: '0.18em' }}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
