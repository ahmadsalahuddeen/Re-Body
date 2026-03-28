// components/modules/WeightTracker.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Weight tracking card: large display number, sparkline trend, quick-add input.
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { useData } from '@/hooks/useData'
import { Sparkline } from '@/components/ui/Sparkline'
import { Card } from '@/components/ui/Card'

export function WeightTracker() {
  const { state } = useAppStore()
  const { addWeight } = useData()
  const { showToast } = useAppStore()
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)

  const weights = state.weights
  const latest = weights[0]
  const prev = weights[1]

  // Calculate trend vs previous entry
  const trend = latest && prev
    ? parseFloat((latest.weight_kg - prev.weight_kg).toFixed(1))
    : null

  // Sparkline data: oldest → newest
  const sparkData = weights.slice(0, 14).map((w) => w.weight_kg).reverse()

  const handleAdd = async () => {
    const val = parseFloat(input)
    if (!val || val < 20 || val > 400) {
      showToast('Enter a valid weight', 'error')
      return
    }
    setSaving(true)
    const ok = await addWeight(val)
    setSaving(false)
    if (ok) {
      setInput('')
      showToast('Weight logged', 'success')
    }
  }

  return (
    <Card>
      {/* Weight display */}
      <div className="flex items-end gap-2 mb-1">
        <AnimatePresence mode="wait">
          <motion.span
            key={latest?.weight_kg ?? 'empty'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display font-black text-ink leading-none"
            style={{ fontSize: '64px' }}
          >
            {latest ? parseFloat(String(latest.weight_kg)).toFixed(1) : '—'}
          </motion.span>
        </AnimatePresence>
        <span className="font-display text-ink-sub mb-2" style={{ fontSize: '20px' }}>kg</span>
      </div>

      {/* Trend indicator */}
      {trend !== null && (
        <p className={`text-sm mb-3 font-medium ${
          trend < 0 ? 'text-green-400' : trend > 0 ? 'text-red-400' : 'text-ink-sub'
        }`}>
          {trend < 0 ? '▼' : trend > 0 ? '▲' : '—'}{' '}
          {trend === 0 ? 'No change' : `${Math.abs(trend)} kg from last`}
        </p>
      )}

      {/* Sparkline */}
      {sparkData.length >= 2 && (
        <div className="mb-4">
          <Sparkline data={sparkData} height={44} />
        </div>
      )}

      {/* Quick-add input */}
      <div className="flex gap-2">
        <input
          type="number"
          inputMode="decimal"
          placeholder="Enter weight (kg)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="flex-1 bg-bg/60 border border-border rounded-thumb
                     text-ink text-base px-4 py-3
                     placeholder:text-ink-muted
                     focus:outline-none focus:border-accent transition-colors"
        />
        <button
          onClick={handleAdd}
          disabled={saving}
          className="bg-accent/15 border border-accent text-accent
                     font-display font-bold tracking-widest uppercase text-sm
                     px-4 py-3 rounded-thumb
                     disabled:opacity-50
                     active:bg-accent active:text-bg
                     transition-all duration-150"
          style={{ fontSize: '12px' }}
        >
          {saving ? '...' : 'LOG'}
        </button>
      </div>
    </Card>
  )
}
