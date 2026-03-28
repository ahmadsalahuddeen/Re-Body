// components/modules/IdentityAnchors.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Two-photo identity anchor: "Worst Phase" vs "Now".
// These are discipline triggers — raw, honest, motivating.
// Tapping opens the mirror/photo gallery.
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import Image from 'next/image'

export function IdentityAnchors() {
  const router = useRouter()
  const { state } = useAppStore()

  const worst  = state.photos.find((p) => p.is_worst_phase)
  const latest = state.photos.find((p) => !p.is_worst_phase) ?? state.photos[0]

  const goToMirror = () => router.push('/mirror')

  return (
    <div className="grid grid-cols-2 gap-2.5 px-4">
      {/* ── WORST PHASE ── */}
      <button
        onClick={goToMirror}
        className="relative aspect-[3/4] rounded-card overflow-hidden
                   border border-border bg-bg-3
                   active:scale-[0.97] transition-transform duration-150"
        style={{ filter: worst ? 'saturate(0.25) brightness(0.75)' : undefined }}
      >
        {worst?.url ? (
          <Image src={worst.url} alt="Worst phase" fill className="object-cover" />
        ) : (
          <PlaceholderContent label="Tap to set worst phase" />
        )}
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5
                        bg-gradient-to-t from-black/80 to-transparent">
          <p className="font-display font-semibold text-ink-sub uppercase tracking-widest"
            style={{ fontSize: '10px' }}>
            WORST PHASE
          </p>
        </div>
      </button>

      {/* ── NOW ── */}
      <button
        onClick={goToMirror}
        className="relative aspect-[3/4] rounded-card overflow-hidden
                   border border-accent bg-bg-3
                   shadow-[0_0_20px_rgba(232,160,69,0.15)]
                   active:scale-[0.97] transition-transform duration-150"
      >
        {latest?.url ? (
          <Image src={latest.url} alt="Now" fill className="object-cover" />
        ) : (
          <PlaceholderContent label="Add first photo" />
        )}
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5
                        bg-gradient-to-t from-black/80 to-transparent">
          <p className="font-display font-semibold text-accent uppercase tracking-widest"
            style={{ fontSize: '10px' }}>
            NOW
          </p>
        </div>
      </button>
    </div>
  )
}

function PlaceholderContent({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
      {/* Camera icon */}
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.5"
        className="text-ink-ghost">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
      <span className="font-display font-semibold text-ink-muted text-center uppercase tracking-wider"
        style={{ fontSize: '9px' }}>
        {label}
      </span>
    </div>
  )
}
