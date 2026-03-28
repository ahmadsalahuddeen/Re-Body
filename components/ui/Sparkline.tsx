// components/ui/Sparkline.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Minimal canvas sparkline for weight trend.
// Uses requestAnimationFrame for smooth drawing on high-DPI screens.
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useEffect, useRef } from 'react'

interface SparklineProps {
  data: number[]          // Weight values, oldest first
  height?: number
  color?: string
}

export function Sparkline({ data, height = 44, color = '#E8A045' }: SparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const draw = () => {
      const dpr = window.devicePixelRatio || 1
      const w = canvas.offsetWidth
      const h = height

      canvas.width  = w * dpr
      canvas.height = h * dpr

      const ctx = canvas.getContext('2d')!
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, w, h)

      if (data.length < 2) return

      const min = Math.min(...data) - 0.5
      const max = Math.max(...data) + 0.5
      const range = max - min || 1
      const pad = 4 // edge padding

      // Map data to canvas coordinates
      const pts = data.map((v, i) => ({
        x: pad + (i / (data.length - 1)) * (w - pad * 2),
        y: (h - pad) - ((v - min) / range) * (h - pad * 2),
      }))

      // ── GRADIENT FILL ───────────────────────────────────────────────────
      const grad = ctx.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0, `${color}22`)
      grad.addColorStop(1, `${color}00`)

      ctx.beginPath()
      ctx.moveTo(pts[0].x, h)
      pts.forEach((p) => ctx.lineTo(p.x, p.y))
      ctx.lineTo(pts[pts.length - 1].x, h)
      ctx.closePath()
      ctx.fillStyle = grad
      ctx.fill()

      // ── LINE ────────────────────────────────────────────────────────────
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) {
        // Smooth curve via midpoints
        const cp = {
          x: (pts[i - 1].x + pts[i].x) / 2,
          y: (pts[i - 1].y + pts[i].y) / 2,
        }
        ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, cp.x, cp.y)
      }
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y)
      ctx.strokeStyle = color
      ctx.lineWidth = 1.8
      ctx.lineJoin = 'round'
      ctx.stroke()

      // ── LAST POINT DOT ──────────────────────────────────────────────────
      const last = pts[pts.length - 1]
      ctx.beginPath()
      ctx.arc(last.x, last.y, 3, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
    }

    // Use ResizeObserver to redraw when container width changes
    const ro = new ResizeObserver(draw)
    ro.observe(canvas)
    draw()
    return () => ro.disconnect()
  }, [data, height, color])

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ height, display: 'block' }}
    />
  )
}
