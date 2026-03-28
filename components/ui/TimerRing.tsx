// components/ui/TimerRing.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Circular SVG countdown ring for the guided session timer.
//
// HOW THE RING ANIMATION WORKS:
// SVG circles can be "partially drawn" using stroke-dasharray + stroke-dashoffset.
//   stroke-dasharray  = total circumference (the dash is as long as the full circle)
//   stroke-dashoffset = how much of the dash to skip from the start
//
// When offset = 0            → fully drawn ring (timer full)
// When offset = circumference → nothing drawn (timer at 0)
//
// Formula: offset = circumference × (1 - timeLeft/totalDuration)
//
// We animate via CSS `transition: stroke-dashoffset 1s linear` which creates
// a smooth second-by-second countdown without JavaScript animation loops.
//
// The SVG is rotated -90deg so the ring starts at the top (12 o'clock position)
// rather than the right side (3 o'clock, SVG default).
// ─────────────────────────────────────────────────────────────────────────────

'use client'

interface TimerRingProps {
  timeLeft: number          // Current seconds remaining in this phase
  duration: number          // Total seconds for this phase (used to calculate fill fraction)
  phase: 'work' | 'rest' | 'complete'
  size?: number             // SVG width and height in pixels (default 196)
}

// These must match the SVG viewBox and circle coordinates
const RADIUS       = 80              // Circle radius in SVG units
const CIRCUMFERENCE = 2 * Math.PI * RADIUS  // ≈ 502.65 — full circle length

export function TimerRing({ timeLeft, duration, phase, size = 196 }: TimerRingProps) {
  // Calculate how much of the ring to "fill" based on remaining time
  // fraction 1.0 = full ring (timer just started), 0.0 = empty ring (timer done)
  const fraction = duration > 0 ? timeLeft / duration : 0
  // dashoffset 0 = full ring, CIRCUMFERENCE = empty ring
  const dashOffset = CIRCUMFERENCE * (1 - fraction)

  // Color changes between work (amber) and rest (blue) phases
  const strokeColor = phase === 'rest' ? 'var(--rest-color)' : 'var(--accent)'
  const glowColor   = phase === 'rest'
    ? 'rgba(74, 158, 191, 0.35)'    // cool blue glow during rest
    : 'var(--accent-glow)'          // warm amber glow during work

  return (
    <div className="relative" style={{ width: size, height: size }}>

      {/* ── SVG RING ── */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 196 196"
        // Rotate so progress starts at 12 o'clock instead of 3 o'clock
        style={{ transform: 'rotate(-90deg)' }}
        className="absolute inset-0"
        aria-hidden="true" // Decorative — the time number below is the real content
      >
        {/* Background track — always fully visible, dim */}
        <circle
          cx="98" cy="98"
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="6"
        />

        {/* Progress arc — animates via CSS transition */}
        <circle
          cx="98" cy="98"
          r={RADIUS}
          fill="none"
          stroke={strokeColor}
          strokeWidth="6"
          strokeLinecap="round"           // Rounded ends look more premium
          strokeDasharray={CIRCUMFERENCE} // Dash spans the full circle
          strokeDashoffset={dashOffset}   // Changes every second
          style={{
            // 1s linear matches the 1s setInterval in useSession.ts
            transition: 'stroke-dashoffset 1s linear, stroke 0.4s ease',
            // Glow effect — enhances the premium feel
            filter: `drop-shadow(0 0 8px ${glowColor})`,
          }}
        />
      </svg>

      {/* ── COUNTDOWN NUMBER (centered over the ring) ── */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-display font-black leading-none tabular-nums"
          style={{
            fontSize: size > 160 ? '58px' : '42px',
            color: strokeColor,
            // Smooth color change when switching between work/rest phases
            transition: 'color 0.4s ease',
          }}
          aria-live="polite"  // Screen reader announces the countdown
          aria-label={`${timeLeft} seconds remaining`}
        >
          {timeLeft}
        </span>
      </div>

    </div>
  )
}
