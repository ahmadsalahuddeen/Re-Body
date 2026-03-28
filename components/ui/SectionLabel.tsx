// components/ui/SectionLabel.tsx
// Consistent uppercase section label used throughout the app.

import { clsx } from 'clsx'

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={clsx(
      'font-display font-semibold text-ink-muted uppercase tracking-[0.24em] mb-3',
      className
    )}
      style={{ fontSize: '11px' }}
    >
      {children}
    </p>
  )
}
