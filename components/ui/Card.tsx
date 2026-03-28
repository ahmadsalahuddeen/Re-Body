// components/ui/Card.tsx
// Reusable dark card — the standard container for dashboard sections.

import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  /** Render as button — adds hover/active styles */
  clickable?: boolean
  onClick?: () => void
  accentBorder?: boolean
}

export function Card({ children, className, clickable, onClick, accentBorder }: CardProps) {
  const base = clsx(
    'bg-bg-2 border rounded-card p-5',
    accentBorder
      ? 'border-accent shadow-[0_0_20px_rgba(232,160,69,0.15)]'
      : 'border-border',
    clickable && 'cursor-pointer transition-all duration-150 active:scale-[0.985] hover:border-border-bright',
    className,
  )

  if (clickable) {
    return (
      <div role="button" tabIndex={0} className={base} onClick={onClick}
        onKeyDown={(e) => e.key === 'Enter' && onClick?.()}>
        {children}
      </div>
    )
  }

  return <div className={base}>{children}</div>
}
