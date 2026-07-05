'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus, ShoppingBag, Trash2, ShieldCheck, Clock } from 'lucide-react'
import {
  useCartStore,
  cartItemCount,
  cartTotal,
  getReservationSecondsLeft,
  type CartItem,
} from '@/store/cart'
import { useUIStore } from '@/store/ui'
import { getBlackoutInfo, type BlackoutInfo } from '@/lib/harvest'
import { formatPrice } from '@/lib/utils'

const ease: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]

const ITEM_ARTS = [
  'linear-gradient(135deg, oklch(36% 0.16 22), oklch(19% 0.09 22))',
  'linear-gradient(145deg, oklch(54% 0.17 18), oklch(28% 0.13 22))',
  'linear-gradient(150deg, oklch(44% 0.11 192), oklch(17% 0.045 192))',
  'linear-gradient(140deg, oklch(66% 0.13 16), oklch(36% 0.16 22))',
]

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function CartItemRow({
  item,
  index,
  onUpdate,
  onRemove,
}: {
  item: CartItem
  index: number
  onUpdate: (qty: number) => void
  onRemove: () => void
}) {
  const lineTotal = item.priceInKurus * item.quantity

  return (
    <div className="flex gap-3 py-4">
      {/* Art / image */}
      <div
        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl"
        style={{ background: ITEM_ARTS[index % ITEM_ARTS.length] }}
        aria-hidden
      >
        {item.imageUrl && (
          <Image src={item.imageUrl} alt="" fill sizes="64px" className="object-cover" />
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-sans text-sm font-semibold text-text">{item.name}</p>
            <p className="font-sans text-xs text-muted">{item.variant}</p>
          </div>
          <button
            onClick={onRemove}
            className="shrink-0 rounded-md p-1 text-subtle transition-colors hover:bg-raised hover:text-text"
            aria-label={`${item.name} ürününü sepetten kaldır`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>

        <div className="flex items-center justify-between">
          {/* Qty stepper */}
          <div className="flex items-center rounded-lg border border-border">
            <button
              onClick={() => onUpdate(item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="flex h-7 w-7 items-center justify-center text-muted transition-colors hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Adedi azalt"
            >
              <Minus className="h-3 w-3" aria-hidden />
            </button>
            <span className="w-6 text-center font-mono text-xs font-semibold text-text">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdate(item.quantity + 1)}
              disabled={item.quantity >= 9}
              className="flex h-7 w-7 items-center justify-center text-muted transition-colors hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Adedi artır"
            >
              <Plus className="h-3 w-3" aria-hidden />
            </button>
          </div>

          {/* Line total */}
          <AnimatePresence mode="wait">
            <motion.span
              key={lineTotal}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18 }}
              className="font-mono text-sm font-semibold text-text"
            >
              {formatPrice(lineTotal)}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export function CartDrawer() {
  const router = useRouter()
  const cartDrawerOpen = useUIStore((s) => s.cartDrawerOpen)
  const closeCartDrawer = useUIStore((s) => s.closeCartDrawer)

  const items = useCartStore((s) => s.items)
  const reservedAt = useCartStore((s) => s.reservedAt)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)

  const closeRef = useRef<HTMLButtonElement>(null)
  const [mounted, setMounted] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [blackout, setBlackout] = useState<BlackoutInfo>({ active: false, notice: null })

  useEffect(() => {
    setMounted(true)
    setBlackout(getBlackoutInfo())
  }, [])

  // TTL countdown
  useEffect(() => {
    function tick() {
      setSecondsLeft(getReservationSecondsLeft(reservedAt))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [reservedAt])

  // Scroll lock + Escape
  useEffect(() => {
    if (!cartDrawerOpen) return
    closeRef.current?.focus()
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeCartDrawer()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = prev
    }
  }, [cartDrawerOpen, closeCartDrawer])

  const count = mounted ? cartItemCount(items) : 0
  const subtotal = mounted ? cartTotal(items) : 0
  const activeItems = mounted ? items : []
  const reservationActive = secondsLeft > 0

  function goToCheckout() {
    closeCartDrawer()
    router.push('/checkout')
  }

  return (
    <AnimatePresence>
      {cartDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] bg-bark-900/60 backdrop-blur-[2px]"
            aria-hidden
            onClick={closeCartDrawer}
          />

          {/* Panel */}
          <motion.div
            key="cart-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Sepetiniz"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', ease, duration: 0.38 }}
            className="fixed right-0 top-0 z-[61] flex h-dvh w-full max-w-sm flex-col bg-surface shadow-2xl"
          >
            {/* ── Header ────────────────────────────────── */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="h-5 w-5 text-primary" aria-hidden />
                <h2 className="font-sans text-base font-semibold text-text">
                  Sepetiniz
                  {count > 0 && (
                    <span className="ml-2 rounded-full bg-cherry-wash px-2 py-0.5 font-mono text-xs font-bold text-primary">
                      {count}
                    </span>
                  )}
                </h2>
              </div>
              <button
                ref={closeRef}
                onClick={closeCartDrawer}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-text"
                aria-label="Sepeti kapat"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* ── Body ──────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto">
              {activeItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 px-5 py-16 text-center">
                  <ShoppingBag className="h-10 w-10 text-subtle" aria-hidden />
                  <div>
                    <p className="font-sans text-sm font-semibold text-text">Sepetiniz boş</p>
                    <p className="mt-1 font-sans text-xs text-muted">
                      Ürünleri incelemek için mağazaya dönün.
                    </p>
                  </div>
                  <button
                    onClick={closeCartDrawer}
                    className="mt-2 rounded-lg border border-border px-4 py-2 font-sans text-sm font-medium text-text transition-colors hover:bg-raised"
                  >
                    Mağazaya Dön
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-border px-5">
                  {activeItems.map((item, i) => (
                    <CartItemRow
                      key={item.variantId}
                      item={item}
                      index={i}
                      onUpdate={(qty) => updateQuantity(item.variantId, qty)}
                      onRemove={() => removeItem(item.variantId)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Footer ────────────────────────────────── */}
            {activeItems.length > 0 && (
              <div className="border-t border-border bg-surface px-5 pb-6 pt-4">
                {/* TTL countdown */}
                {reservationActive && (
                  <div className="mb-3 flex items-center gap-2 rounded-lg bg-cherry-wash px-3 py-2.5">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                    <p className="font-sans text-xs text-muted">
                      Rezervasyonunuz{' '}
                      <span className="font-semibold text-primary tabular-nums">
                        {formatSeconds(secondsLeft)}
                      </span>{' '}
                      içinde sona eriyor.
                    </p>
                  </div>
                )}

                {/* Blackout notice */}
                {blackout.active && (
                  <div className="mb-3 rounded-lg border border-border bg-raised px-3 py-2.5">
                    <p className="font-sans text-[11px] leading-relaxed text-muted">
                      🌙 {blackout.notice}
                    </p>
                  </div>
                )}

                {/* Subtotal */}
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-sans text-sm text-muted">Ara Toplam</span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={subtotal}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.18 }}
                      className="font-mono text-base font-bold text-text"
                    >
                      {formatPrice(subtotal)}
                    </motion.span>
                  </AnimatePresence>
                </div>

                {/* CTA */}
                <button
                  onClick={goToCheckout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-cta py-3.5 font-sans text-sm font-semibold text-inverted shadow-sm transition-all duration-150 hover:bg-cta/90 active:scale-[0.98]"
                >
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                  Güvenli Ödemeye Geç
                </button>

                <p className="mt-3 text-center font-sans text-[11px] text-subtle">
                  Kargo ücretsiz · SSL 256-bit · Organik sertifikalı
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
