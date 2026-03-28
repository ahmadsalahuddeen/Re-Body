// components/ui/Sparkline.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Canvas-based weight trend sparkline.
//
// WHY CANVAS (not SVG or a chart library)?
// - Canvas scales perfectly to any container width via ResizeObserver
// - No dependency on chart.js/recharts which would add ~200kb to the bundle
// - We want a very specific minimal aesthetic — custom drawn is the right call
// - Canvas handles high-DPI (retina) screens cleanly via devicePixelRatio
//
// HOW HIGH-DPI WORKS:
// A 300px canvas on a 2× screen has 600 physical pixels but 300 CSS pixels.
// If you draw at 300px CSS scale, it looks blurry because you're "stretching"
// 300 pixels to fill 600 pixels. The fix:
//   1. Set canvas.width = cssWidth × devicePixelRatio
//   2. ctx.scale(devicePixelRatio, devicePixelRatio)
//   3. Draw at CSS dimensions as normal
// Now you're drawing 600 physical pixels, which looks sharp on retina.
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useEffect, useRef } from 'react'

interface SparklineProps {
  data: number[]      // Weight values in chronological order (oldest → newest = left → right)
  height?: number     // CSS height in pixels (default 44)
  color?: string      // Line and fill color (default: accent amber)
}

export function Sparkline({ data, height = 44, color = '#E8A045' }: SparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // ── DRAW FUNCTION ─────────────────────────────────────────────────────────
    // Called on mount and whenever the container width changes (ResizeObserver)
    const draw = () => {
      const dpr = window.devicePixelRatio || 1
      const w = canvas.offsetWidth   // CSS width of the element

      // Set the canvas backing resolution to device pixel resolution
      canvas.width  = w * dpr
      canvas.height = height * dpr

      const ctx = canvas.getContext('2d')!
      ctx.scale(dpr, dpr) // All subsequent draw calls use CSS coordinates
      ctx.clearRect(0, 0, w, height)

      // Need at least 2 points to draw a line
      if (data.length < 2) return

      // Add padding around the min/max values so the line doesn't touch the edges
      const minVal = Math.min(...data) - 0.5
      const maxVal = Math.max(...data) + 0.5
      const range  = maxVal - minVal || 1  // Guard against flat line (division by zero)
      const pad    = 4 // px — keeps the dot and line from clipping at edges

      // Map each data point to canvas (x, y) coordinates
      // x: evenly spaced from left to right
      // y: inverted (higher weight = higher value = lower on screen? No — lower y = top)
      //    We invert so weight goes UP on the chart (higher value = higher line)
      const points = data.map((val, i) => ({
        x: pad + (i / (data.length - 1)) * (w - pad * 2),
        y: (height - pad) - ((val - minVal) / range) * (height - pad * 2),
      }))

      // ── GRADIENT FILL under the line ────────────────────────────────────────
      const gradient = ctx.createLinearGradient(0, 0, 0, height)
      gradient.addColorStop(0, `${color}22`) // Top: 13% opacity
      gradient.addColorStop(1, `${color}00`) // Bottom: 0% opacity (fade out)

      ctx.beginPath()
      ctx.moveTo(points[0].x, height)          // Start at bottom-left
      points.forEach((p) => ctx.lineTo(p.x, p.y)) // Up to the line
      ctx.lineTo(points[points.length - 1].x, height) // Back down to bottom-right
      ctx.closePath()
      ctx.fillStyle = gradient
      ctx.fill()

      // ── SMOOTH LINE through data points ─────────────────────────────────────
      // Instead of straight line segments (lineTo), we use quadratic curves
      // through midpoints. This creates a smooth flowing line without overshoot.
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)

      for (let i = 1; i < points.length; i++) {
        // Midpoint between current and previous point
        const midX = (points[i - 1].x + points[i].x) / 2
        const midY = (points[i - 1].y + points[i].y) / 2
        // Draw quadratic curve: control point = previous point, end = midpoint
        ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, midX, midY)
      }
      // Final segment to the last point
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y)

      ctx.strokeStyle = color
      ctx.lineWidth = 1.8
      ctx.lineJoin = 'round'
      ctx.stroke()

      // ── LAST POINT DOT ───────────────────────────────────────────────────────
      // Small filled circle at the most recent data point — indicates "now"
      const last = points[points.length - 1]
      ctx.beginPath()
      ctx.arc(last.x, last.y, 3, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
    }

    // ── RESIZE OBSERVER ───────────────────────────────────────────────────────
    // Redraws whenever the container changes width (orientation change, responsive layout)
    const ro = new ResizeObserver(draw)
    ro.observe(canvas)
    draw() // Initial draw

    return () => ro.disconnect() // Cleanup on unmount
  }, [data, height, color])

  return (
    <canvas
      ref={canvasRef}
      className="w-full block"
      style={{ height }}
      aria-label="Weight trend chart"
    />
  )
}
