// components/ui/TimerRing.tsx
// ─────────────────────────────────────────────────────────────────────────────
// SVG arc progress ring used in the guided session timer.
// Animates via CSS transition on stroke-dashoffset for smooth countdown.
// ─────────────────────────────────────────────────────────────────────────────

'use client'

interface TimerRingProps {
  timeLeft: number      // Current seconds remaining
  duration: number      // Total seconds for this phase
  phase: 'work' | 'rest' | 'complete'
  size?: number         // SVG width/height in px
}

const RADIUS = 80
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function TimerRing({ timeLeft, duration, phase, size = 196 }: TimerRingProps) {
  // 0 = fully filled, CIRCUMFERENCE = fully empty
  const fraction = duration > 0 ? timeLeft / duration : 0
  const offset = CIRCUMFERENCE * (1 - fraction)

  const strokeColor = phase === 'rest' ? 'var(--rest-color)' : 'var(--accent)'
  const glowColor   = phase === 'rest' ? 'rgba(74,158,191,0.35)' : 'var(--accent-glow)'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* SVG Ring */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 196 196"
        style={{ transform: 'rotate(-90deg)' }}
        className="absolute inset-0"
      >
        {/* Track */}
        <circle
          cx="98" cy="98" r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="6"
        />
        {/* Progress arc */}
        <circle
          cx="98" cy="98" r={RADIUS}
          fill="none"
          stroke={strokeColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1s linear, stroke 0.4s ease',
            filter: `drop-shadow(0 0 8px ${glowColor})`,
          }}
        />
      </svg>

      {/* Center: time number */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-display font-black leading-none"
          style={{
            fontSize: size > 160 ? '58px' : '42px',
            color: strokeColor,
            transition: 'color 0.4s ease',
          }}
        >
          {timeLeft}
        </span>
      </div>
    </div>
  )
}
