// components/layout/AuthScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Full-screen auth UI. Sign in, sign up, or demo mode.
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'

export function AuthScreen() {
  const { signIn, signUp, enterDemoMode } = useAuth()
  const [mode, setMode]       = useState<'signin' | 'signup'>('signin')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    if (!email.trim() || !password) { setError('Email and password required.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }

    setLoading(true)
    const err = mode === 'signin'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password)
    setLoading(false)

    if (err) setError(err)
  }

  return (
    <div className="fixed inset-0 bg-bg flex flex-col items-center justify-center px-6 pt-safe">
      {/* Background grain texture */}
      <div className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(232,160,69,0.12), transparent)`
        }}
      />

      <motion.div
        className="relative w-full max-w-sm flex flex-col items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Logo */}
        <span className="font-display text-label text-accent tracking-[0.3em] mb-12">
          PROJECT BODY REBIRTH
        </span>

        {/* Headline */}
        <h1 className="font-display text-display-lg text-center text-ink uppercase leading-none mb-3">
          DISCIPLINE<br />DAILY
        </h1>
        <p className="text-ink-sub text-sm text-center leading-relaxed mb-10">
          Your private discipline system.<br />
          Every rep. Every day. Tracked.
        </p>

        {/* Error */}
        {error && (
          <motion.div
            className="w-full bg-red-500/10 border border-red-500/30 rounded-thumb px-4 py-3 text-sm text-red-400 mb-4"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        {/* Form */}
        <div className="w-full flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            autoComplete="email"
            className="w-full bg-bg-3 border border-border rounded-thumb px-4 py-4
                       text-ink text-base placeholder:text-ink-muted
                       focus:outline-none focus:border-accent transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            autoComplete="current-password"
            className="w-full bg-bg-3 border border-border rounded-thumb px-4 py-4
                       text-ink text-base placeholder:text-ink-muted
                       focus:outline-none focus:border-accent transition-colors"
          />

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-accent text-bg font-display font-bold text-lg
                       tracking-[0.12em] uppercase py-4 rounded-pill
                       disabled:opacity-60 active:scale-[0.98]
                       transition-all duration-150 mt-1"
          >
            {loading ? '...' : mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </button>
        </div>

        {/* Toggle mode */}
        <p className="text-ink-muted text-sm mt-5">
          {mode === 'signin' ? "No account? " : "Have an account? "}
          <button
            className="text-accent underline-offset-2 hover:underline"
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}
          >
            {mode === 'signin' ? 'Create one' : 'Sign in'}
          </button>
        </p>

        {/* Divider */}
        <div className="flex items-center gap-3 w-full my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-ink-muted text-xs font-display tracking-widest">OR</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Demo mode */}
        <button
          onClick={enterDemoMode}
          className="w-full border border-border text-ink-sub font-display font-semibold
                     text-sm tracking-[0.12em] uppercase py-4 rounded-pill
                     hover:border-border-bright hover:text-ink
                     active:scale-[0.98] transition-all duration-150"
        >
          CONTINUE IN DEMO MODE
        </button>
        <p className="text-ink-muted text-xs text-center mt-3 leading-relaxed">
          No account needed. Data saved locally on this device.
        </p>
      </motion.div>
    </div>
  )
}
