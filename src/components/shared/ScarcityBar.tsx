'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore, getReservationSecondsLeft, isReservationActive } from '@/store/cart'

// TODO: replace with real-time Supabase subscription once schema is ready
const DAILY_QUOTA_TOTAL = 50
const DAILY_QUOTA_REMAINING = 12
const HARVEST_CUTOFF_HOUR = 17 // 17:00 local time

function secsUntilCutoff(): number {
  const now = new Date()
  const cutoff = new Date(now)
  cutoff.setHours(HARVEST_CUTOFF_HOUR, 0, 0, 0)
  if (now >= cutoff) cutoff.setDate(cutoff.getDate() + 1)
  return Math.max(0, Math.floor((cutoff.getTime() - now.getTime()) / 1000))
}

function fmtHHMM(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return `${String(h).padStart(2, '0')}s ${String(m).padStart(2, '0')}d`
}

function fmtMMSS(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function Tick({ value }: { value: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={value}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="inline-block tabular-nums font-mono"
      >
        {value}
      </motion.span>
    </AnimatePresence>
  )
}

export function ScarcityBar() {
  const [cutoffSecs, setCutoffSecs] = useState<number>(0)
  const [reserveSecs, setReserveSecs] = useState<number>(0)
  const [mounted, setMounted] = useState(false)

  const reservedAt = useCartStore((s) => s.reservedAt)
  const items = useCartStore((s) => s.items)
  const hasItems = items.length > 0

  // Hydrate on client to avoid SSR mismatch
  useEffect(() => {
    setMounted(true)
    setCutoffSecs(secsUntilCutoff())
    setReserveSecs(getReservationSecondsLeft(reservedAt))

    const id = setInterval(() => {
      setCutoffSecs(secsUntilCutoff())
      setReserveSecs(getReservationSecondsLeft(reservedAt))
    }, 1000)

    return () => clearInterval(id)
  }, [reservedAt])

  const cartActive = mounted && hasItems && isReservationActive(reservedAt)
  const cartExpired = mounted && hasItems && !isReservationActive(reservedAt) && reservedAt !== null

  return (
    <div className="border-b border-border-brand bg-cherry-wash">
      <div className="container-page flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-[7px]">
        {/* Quota left */}
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cta" aria-hidden />
          <p className="font-sans text-xs font-medium text-primary">
            Bugünün hasatından{' '}
            <span className="font-mono font-semibold">
              {DAILY_QUOTA_REMAINING}&thinsp;/&thinsp;{DAILY_QUOTA_TOTAL}
            </span>{' '}
            kutu kaldı
          </p>
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-5">
          {/* Cart reservation badge */}
          <AnimatePresence>
            {cartActive && (
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-1.5 font-sans text-xs font-medium text-accent"
              >
                <span aria-hidden>⏳</span>
                <span>
                  Rezervasyon:{' '}
                  <Tick value={fmtMMSS(reserveSecs)} />
                </span>
              </motion.div>
            )}
            {cartExpired && (
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.25 }}
                className="font-sans text-xs font-medium text-cta"
              >
                Rezervasyon doldu — stoklar değişmiş olabilir
              </motion.div>
            )}
          </AnimatePresence>

          {/* Harvest cutoff countdown */}
          <p className="font-sans text-xs text-muted">
            Hasat kapısı:{' '}
            <span className="font-semibold text-text">
              {mounted ? <Tick value={fmtHHMM(cutoffSecs)} /> : '—'}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
