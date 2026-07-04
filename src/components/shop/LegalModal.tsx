'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const ease: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]

interface LegalModalProps {
  open: boolean
  title: string
  content: string
  onClose: () => void
}

export function LegalModal({ open, title, content, onClose }: LegalModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = prev
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="legal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-bark-900/70 p-4 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.3, ease }}
            className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-sans text-base font-semibold text-text">{title}</h2>
              <button
                ref={closeRef}
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-text"
                aria-label="Kapat"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto p-6">
              <pre className="whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-muted">
                {content}
              </pre>
            </div>

            {/* Footer */}
            <div className="border-t border-border px-6 py-4">
              <button
                onClick={onClose}
                className="w-full rounded-lg bg-raised py-2.5 font-sans text-sm font-semibold text-text transition-colors hover:bg-border"
              >
                Anladım, Kapat
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
