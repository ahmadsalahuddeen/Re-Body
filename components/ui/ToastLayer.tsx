// components/ui/ToastLayer.tsx
// Global toast notification layer — rendered once in root layout.

'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'

export function ToastLayer() {
  const { state } = useAppStore()

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200]
                    flex flex-col items-center gap-2 pointer-events-none">
      <AnimatePresence>
        {state.toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className={`px-5 py-3 rounded-pill backdrop-blur-xl whitespace-nowrap
                        font-display font-semibold tracking-widest uppercase
                        border text-sm
                        ${toast.type === 'error'
                          ? 'bg-red-500/20 border-red-500/40 text-red-400'
                          : toast.type === 'success'
                            ? 'bg-green-500/20 border-green-500/40 text-green-400'
                            : 'bg-bg-3/95 border-border-bright text-ink'
                        }`}
            style={{ fontSize: '11px', letterSpacing: '0.18em' }}
          >
            {toast.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
