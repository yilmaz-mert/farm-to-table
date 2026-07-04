'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Eye, EyeOff, Loader2, Package, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const ease: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]

interface OrderSuccessModalProps {
  open: boolean
  orderNumber: string
  email: string
  onClose: () => void
}

type ConversionState = 'idle' | 'loading' | 'success' | 'error'

export function OrderSuccessModal({
  open,
  orderNumber,
  email,
  onClose,
}: OrderSuccessModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const [showConvert, setShowConvert] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [conversion, setConversion] = useState<ConversionState>('idle')
  const [conversionError, setConversionError] = useState('')

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = prev
    }
  }, [open])

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setConversionError('Şifre en az 8 karakter olmalıdır.')
      return
    }
    setConversion('loading')
    setConversionError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        if (error.message.toLowerCase().includes('already registered')) {
          setConversionError('Bu e-posta adresiyle zaten bir hesap var. Giriş yapabilirsiniz.')
        } else {
          setConversionError(error.message)
        }
        setConversion('error')
        return
      }
      setConversion('success')
    } catch {
      setConversionError('Bir hata oluştu. Lütfen tekrar deneyin.')
      setConversion('error')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="success-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-bark-900/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Sipariş Tamamlandı"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.35, ease }}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
          >
            {/* Header */}
            <div className="relative flex items-center justify-center border-b border-border px-6 py-5">
              <h2 className="font-sans text-base font-semibold text-text">Sipariş Tamamlandı</h2>
              <button
                ref={closeRef}
                onClick={onClose}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-text"
                aria-label="Kapat"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {/* Success icon */}
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 20 }}
                className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-verdigris-100 dark:bg-verdigris-900"
              >
                <CheckCircle2 className="h-8 w-8 text-verdigris-600 dark:text-verdigris-300" aria-hidden />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4, ease }}
                className="text-center"
              >
                <p className="font-sans text-lg font-semibold text-text">
                  Teşekkürler! 🍒
                </p>
                <p className="mt-1 font-sans text-sm text-muted">
                  Siparişiniz alındı. Hasat günü kargoya verilecek.
                </p>

                {/* Order number */}
                <div className="mt-5 flex items-center justify-center gap-3 rounded-xl border border-border bg-raised px-4 py-3.5">
                  <Package className="h-5 w-5 shrink-0 text-accent" aria-hidden />
                  <div className="text-left">
                    <p className="font-sans text-[11px] text-subtle">Sipariş numarası</p>
                    <p className="font-mono text-sm font-bold tracking-wider text-text">
                      {orderNumber}
                    </p>
                  </div>
                </div>

                <p className="mt-3 font-sans text-xs text-subtle">
                  Onay e-postası <span className="font-medium text-muted">{email}</span> adresine gönderildi.
                </p>
              </motion.div>

              {/* 1-click account conversion */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="mt-6 border-t border-border pt-5"
              >
                {conversion === 'success' ? (
                  <div className="rounded-xl bg-verdigris-50 px-4 py-3 text-center dark:bg-verdigris-900/30">
                    <CheckCircle2 className="mx-auto mb-2 h-5 w-5 text-verdigris-600 dark:text-verdigris-400" aria-hidden />
                    <p className="font-sans text-sm font-semibold text-text">Hesabınız oluşturuldu!</p>
                    <p className="mt-0.5 font-sans text-xs text-muted">
                      Sipariş geçmişinizi hesabınızdan takip edebilirsiniz.
                    </p>
                  </div>
                ) : !showConvert ? (
                  <div className="text-center">
                    <p className="font-sans text-xs text-muted">
                      Sipariş geçmişini takip etmek ister misiniz?
                    </p>
                    <button
                      onClick={() => setShowConvert(true)}
                      className="mt-2 font-sans text-sm font-semibold text-primary underline-offset-2 hover:underline"
                    >
                      Ücretsiz hesap oluştur →
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCreateAccount} className="space-y-3">
                    <div>
                      <label className="mb-1.5 block font-sans text-xs font-medium text-muted">
                        Şifre belirleyin
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value)
                            if (conversionError) setConversionError('')
                          }}
                          placeholder="En az 8 karakter"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 font-sans text-sm text-text placeholder:text-subtle outline-none transition-colors focus:border-border-strong"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-muted"
                          aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" aria-hidden />
                          ) : (
                            <Eye className="h-4 w-4" aria-hidden />
                          )}
                        </button>
                      </div>
                      {conversionError && (
                        <p className="mt-1.5 font-sans text-xs text-red-600 dark:text-red-400">
                          {conversionError}
                        </p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={conversion === 'loading' || !password}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 font-sans text-sm font-semibold text-inverted transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {conversion === 'loading' && (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      )}
                      Hesabı Oluştur
                    </button>
                  </form>
                )}
              </motion.div>
            </div>

            {/* Footer */}
            <div className="border-t border-border px-6 py-4">
              <Link
                href="/"
                onClick={onClose}
                className="block w-full rounded-lg bg-raised py-2.5 text-center font-sans text-sm font-medium text-text transition-colors hover:bg-border"
              >
                Ana Sayfaya Dön
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
