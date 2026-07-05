'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, CreditCard, ShieldCheck, AlertTriangle } from 'lucide-react'
import { confirmSandboxPayment } from '@/app/(shop)/checkout/actions'

const ease: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]

// Iyzico's own published sandbox test card — not a real card, safe to
// display as a pre-filled reference for what a sandbox charge would use.
const TEST_CARD = {
  number: '5528 7900 0000 0008',
  holder: 'Test Kullanıcı',
  expiry: '12/30',
  cvc: '123',
}

interface IyzicoSandboxModalProps {
  open: boolean
  /** DB orders.id — the row confirmSandboxPayment actually updates. */
  orderId: string
  /** Human-readable "DK-YYYYMMDD-XXXX" label, display only. */
  orderNumber: string
  amountLabel: string
  onClose: () => void
  onConfirmed: () => void
}

export function IyzicoSandboxModal({
  open,
  orderId,
  orderNumber,
  amountLabel,
  onClose,
  onConfirmed,
}: IyzicoSandboxModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !confirming) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = prev
    }
  }, [open, onClose, confirming])

  async function handleConfirm() {
    setConfirming(true)
    setError(null)
    const result = await confirmSandboxPayment(orderId)
    if (!result.success) {
      setError(result.error)
      setConfirming(false)
      return
    }
    onConfirmed()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="iyzico-sandbox-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-bark-900/70 p-4 backdrop-blur-sm"
          onClick={confirming ? undefined : onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Iyzico Test Ödeme Simülasyonu"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.3, ease }}
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header — mimics Iyzico's own hosted checkout chrome */}
            <div className="flex items-center justify-between border-b border-border bg-raised px-6 py-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent" aria-hidden />
                <span className="font-sans text-sm font-semibold text-text">
                  Iyzico Test Ödeme Simülasyonu
                </span>
              </div>
              {!confirming && (
                <button
                  ref={closeRef}
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-border hover:text-text"
                  aria-label="Kapat"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>

            <div className="p-6">
              <p className="mb-5 font-sans text-xs leading-relaxed text-muted">
                API anahtarları henüz tanımlı olmadığı için gerçek bir ödeme alınmayacak. Aşağıdaki
                test kartıyla ödemeyi simüle edebilirsiniz —{' '}
                <span className="font-mono font-medium text-text">{orderNumber}</span> numaralı
                sipariş, onayınızın ardından ödendi olarak işaretlenecektir.
              </p>

              {/* Mock card visual */}
              <div className="mb-5 rounded-xl bg-gradient-to-br from-cherry-700 to-cherry-900 p-5 text-white shadow-md">
                <div className="mb-6 flex items-center justify-between">
                  <CreditCard className="h-6 w-6" aria-hidden />
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/70">
                    Sandbox
                  </span>
                </div>
                <p className="font-mono text-lg tracking-[0.12em]">{TEST_CARD.number}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-wide text-white/60">
                      Kart Sahibi
                    </p>
                    <p className="font-mono text-xs">{TEST_CARD.holder}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-wide text-white/60">
                      Son Kul.
                    </p>
                    <p className="font-mono text-xs">{TEST_CARD.expiry}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-wide text-white/60">
                      CVC
                    </p>
                    <p className="font-mono text-xs">{TEST_CARD.cvc}</p>
                  </div>
                </div>
              </div>

              <div className="mb-5 flex items-center justify-between rounded-lg border border-border bg-raised px-4 py-3">
                <span className="font-sans text-sm text-muted">Tahsil Edilecek Tutar</span>
                <span className="font-mono text-base font-bold text-text">{amountLabel}</span>
              </div>

              {error && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-800/30 bg-red-950/30 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden />
                  <p className="font-sans text-xs text-red-400">{error}</p>
                </div>
              )}

              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-sans text-sm font-semibold text-inverted shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99]"
              >
                {confirming ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                )}
                {confirming ? 'Onaylanıyor…' : 'Ödemeyi Onayla ve Simüle Et'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
