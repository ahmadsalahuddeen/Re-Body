// app/mirror/page.tsx  ── PROGRESS PHOTOS
// ─────────────────────────────────────────────────────────────────────────────
// "The Mirror" — private, honest progress photo system.
// Features: upload, gallery, lightbox, mark as worst phase, delete.
// All images served via Supabase signed URLs (never publicly accessible).
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { useData } from '@/hooks/useData'
import { SectionLabel } from '@/components/ui/SectionLabel'
import type { ProgressImage } from '@/types'

export default function MirrorPage() {
  const { state, showToast } = useAppStore()
  const { addPhoto, setWorstPhase, deletePhoto } = useData()

  const [pendingFile, setPendingFile]     = useState<File | null>(null)
  const [previewUrl, setPreviewUrl]       = useState<string | null>(null)
  const [note, setNote]                   = useState('')
  const [uploading, setUploading]         = useState(false)
  const [lightboxPhoto, setLightboxPhoto] = useState<ProgressImage | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── UPLOAD ──────────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleUpload = async () => {
    if (!pendingFile) return
    setUploading(true)
    const ok = await addPhoto(pendingFile, note, 'face')
    setUploading(false)
    if (ok) {
      setPendingFile(null)
      setPreviewUrl(null)
      setNote('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      showToast('Photo saved', 'success')
    }
  }

  const cancelUpload = () => {
    setPendingFile(null)
    setPreviewUrl(null)
    setNote('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── LIGHTBOX ACTIONS ─────────────────────────────────────────────────────────

  const handleMarkWorst = async () => {
    if (!lightboxPhoto) return
    const newVal = !lightboxPhoto.is_worst_phase
    await setWorstPhase(lightboxPhoto.id, newVal)
    setLightboxPhoto(null)
    showToast(newVal ? 'Set as worst phase' : 'Cleared', 'success')
  }

  const handleDelete = async () => {
    if (!lightboxPhoto) return
    if (!confirmDelete) { setConfirmDelete(true); return }
    await deletePhoto(lightboxPhoto.id, lightboxPhoto.storage_path)
    setLightboxPhoto(null)
    setConfirmDelete(false)
    showToast('Photo deleted')
  }

  return (
    <div className="min-h-dvh bg-bg pb-8">

      {/* ── HEADER ── */}
      <div className="px-4 pt-5 pb-4">
        <h1 className="font-display font-black text-ink uppercase leading-none"
          style={{ fontSize: '42px' }}>
          THE MIRROR
        </h1>
        <p className="font-body text-ink-muted text-sm mt-1">
          Private. Honest. Unfiltered.
        </p>
      </div>

      {/* ── UPLOAD ZONE ── */}
      <div className="px-4 mb-5">
        {!pendingFile ? (
          /* Empty state — tap to upload */
          <label
            className="block w-full border border-dashed border-border-bright
                       rounded-card py-8 text-center cursor-pointer bg-bg-2
                       hover:border-accent hover:bg-accent/5
                       active:scale-[0.99] transition-all duration-200"
          >
            <input
              ref={fileInputRef}
              type="file"
accept="image/*,.heic,.HEIC,.jpg,.jpeg,.png"
              // capture="environment"     /* Opens camera on mobile */
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="w-10 h-10 rounded-full bg-bg-3 flex items-center
                            justify-center mx-auto mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" className="text-ink-sub">
                <path d="M12 5v14M5 12l7-7 7 7"/>
              </svg>
            </div>
            <p className="font-display font-bold text-ink uppercase tracking-wider"
              style={{ fontSize: '14px' }}>
              Add Progress Photo
            </p>
            <p className="text-ink-muted text-xs mt-1">Tap to upload or take photo</p>
          </label>
        ) : (
          /* Preview + submit */
          <motion.div
            className="bg-bg-2 border border-border rounded-card p-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Preview */}
            <div className="relative w-full rounded-thumb overflow-hidden mb-3"
              style={{ maxHeight: '280px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl!} alt="Preview" className="w-full object-cover rounded-thumb" />
            </div>

            {/* Note */}
            <input
              type="text"
              placeholder="Optional note…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-bg-3 border border-border rounded-thumb
                         text-ink text-sm px-4 py-3 mb-3
                         placeholder:text-ink-muted
                         focus:outline-none focus:border-accent transition-colors"
            />

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={cancelUpload}
                className="flex-1 bg-bg-3 border border-border text-ink-sub
                           font-display font-bold uppercase tracking-widest text-xs
                           py-3.5 rounded-pill transition-colors
                           hover:border-border-bright hover:text-ink"
              >
                CANCEL
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 bg-accent text-bg font-display font-bold
                           uppercase tracking-widest text-sm py-3.5 rounded-pill
                           disabled:opacity-60 active:scale-[0.98] transition-all"
              >
                {uploading ? 'SAVING…' : 'SAVE PHOTO'}
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── PHOTO GALLERY ── */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel className="mb-0">Gallery</SectionLabel>
          <span className="font-display text-ink-muted uppercase tracking-widest"
            style={{ fontSize: '11px' }}>
            {state.photos.length} photo{state.photos.length !== 1 ? 's' : ''}
          </span>
        </div>

        {state.photos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3 opacity-20">📷</p>
            <p className="font-display font-semibold text-ink-muted uppercase tracking-wider"
              style={{ fontSize: '13px' }}>
              No photos yet.<br />Document the journey.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {state.photos.map((photo, i) => (
              <PhotoThumb
                key={photo.id}
                photo={photo}
                index={i}
                onClick={() => { setLightboxPhoto(photo); setConfirmDelete(false) }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── LIGHTBOX ── */}
      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            className="fixed inset-0 z-[150] bg-black/95 flex flex-col
                       items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setLightboxPhoto(null) }}
          >
            {/* Close */}
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-5 right-5 w-10 h-10 rounded-full
                         bg-bg-3 border border-border text-ink-sub text-xl
                         flex items-center justify-center"
            >
              ✕
            </button>

            {/* Image */}
            <div className="relative max-w-full max-h-[65vh] rounded-card overflow-hidden mx-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxPhoto.url}
                alt="Progress"
                className="max-w-full max-h-[65vh] object-contain rounded-card"
              />
            </div>

            {/* Meta */}
            <div className="w-full max-w-sm px-6 mt-4">
              <p className="font-display font-semibold text-accent uppercase tracking-widest"
                style={{ fontSize: '12px' }}>
                {new Date(lightboxPhoto.created_at).toLocaleDateString('en-US', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                }).toUpperCase()}
              </p>
              {lightboxPhoto.note && (
                <p className="text-ink-sub text-sm mt-1 leading-relaxed">
                  {lightboxPhoto.note}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleMarkWorst}
                  className="flex-1 bg-transparent border border-accent text-accent
                             font-display font-bold uppercase tracking-widest
                             py-3 rounded-pill transition-all active:bg-accent active:text-bg"
                  style={{ fontSize: '10px' }}
                >
                  {lightboxPhoto.is_worst_phase ? 'UNSET WORST' : 'SET AS WORST'}
                </button>
                <button
                  onClick={handleDelete}
                  className={`flex-1 border font-display font-bold uppercase
                              tracking-widest py-3 rounded-pill transition-all
                              ${confirmDelete
                                ? 'bg-red-500 border-red-500 text-white'
                                : 'border-red-500/50 text-red-400'
                              }`}
                  style={{ fontSize: '10px' }}
                >
                  {confirmDelete ? 'CONFIRM DELETE' : 'DELETE'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

// ── PHOTO THUMBNAIL ───────────────────────────────────────────────────────────

function PhotoThumb({
  photo,
  index,
  onClick,
}: {
  photo: ProgressImage
  index: number
  onClick: () => void
}) {
  const dateStr = new Date(photo.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  })

  return (
    <motion.button
      className="relative aspect-[3/4] rounded-thumb overflow-hidden
                 border border-border bg-bg-3 cursor-pointer
                 active:scale-[0.97] transition-transform duration-150"
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      {photo.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo.url} alt="Progress" className="w-full h-full object-cover" />
      )}

      {/* Date badge */}
      <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm
                      rounded px-2 py-0.5">
        <span className="font-display font-semibold text-ink-sub tracking-wider"
          style={{ fontSize: '10px' }}>
          {dateStr}
        </span>
      </div>

      {/* Worst phase badge */}
      {photo.is_worst_phase && (
        <div className="absolute top-2 left-2 bg-red-500 rounded px-2 py-0.5">
          <span className="font-display font-bold text-white tracking-widest uppercase"
            style={{ fontSize: '9px' }}>
            WORST
          </span>
        </div>
      )}
    </motion.button>
  )
}
