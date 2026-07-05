'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore, getReservationSecondsLeft, isReservationActive } from '@/store/cart'
import { createClient } from '@/lib/supabase/client'

// Fallback values, used until the live fetch below resolves (or if it fails)
const DEFAULT_QUOTA_TOTAL = 50
const DEFAULT_QUOTA_REMAINING = 12
const HARVEST_CUTOFF_HOUR = 17 // 17:00 local time
const LIVE_SETTINGS_POLL_MS = 30_000

function secsUntilCutoff(): number {
  const now = new Date()
  const cutoff = new Date(now)
  cutoff.setHours(HARVEST_CUTOFF_HOUR, 0, 0, 0)
  if (now >= cutoff) cutoff.setDate(cutoff.getDate() + 1)
  return Math.max(0, Math.floor((cutoff.getTime() - now.getTime()) / 1000))
}

function hhmmParts(secs: number): { h: string; m: string } {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return { h: String(h).padStart(2, '0'), m: String(m).padStart(2, '0') }
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

  const [quotaTotal, setQuotaTotal] = useState(DEFAULT_QUOTA_TOTAL)
  const [quotaRemaining, setQuotaRemaining] = useState(DEFAULT_QUOTA_REMAINING)
  const [urgencyBlitzMode, setUrgencyBlitzMode] = useState(false)

  const reservedAt = useCartStore((s) => s.reservedAt)
  const items = useCartStore((s) => s.items)
  const clearCart = useCartStore((s) => s.clearCart)
  const hasItems = items.length > 0

  // Hydrate on client to avoid SSR mismatch
  useEffect(() => {
    setMounted(true)
    setCutoffSecs(secsUntilCutoff())
    setReserveSecs(getReservationSecondsLeft(reservedAt))

    const id = setInterval(() => {
      setCutoffSecs(secsUntilCutoff())
      setReserveSecs(getReservationSecondsLeft(reservedAt))

      const timeLeft = getReservationSecondsLeft(useCartStore.getState().reservedAt)
      if (
        useCartStore.getState().items.length > 0 &&
        timeLeft === 0 &&
        useCartStore.getState().reservedAt !== null
      ) {
        clearCart()
      }
    }, 1000)

    return () => clearInterval(id)
  }, [reservedAt, clearCart])

  // Admin-controlled quota + urgency mode — fetched on mount and polled so
  // changes made in /admin/settings show up without a full page reload.
  useEffect(() => {
    let cancelled = false

    async function fetchLiveSettings() {
      try {
        const supabase = createClient()
        const todayStr = new Date().toISOString().slice(0, 10)
        const [{ data: log }, { data: settings }] = await Promise.all([
          supabase
            .from('daily_harvest_logs')
            .select('total_box_quota, remaining_boxes')
            .eq('harvest_date', todayStr)
            .maybeSingle(),
          supabase.from('store_settings').select('urgency_blitz_mode').eq('id', 1).maybeSingle(),
        ])

        if (cancelled) return
        if (log) {
          setQuotaTotal(log.total_box_quota)
          setQuotaRemaining(log.remaining_boxes)
        }
        if (settings) {
          setUrgencyBlitzMode(settings.urgency_blitz_mode)
        }
      } catch (err) {
        console.error('[ScarcityBar] Failed to load live quota/settings:', err)
      }
    }

    fetchLiveSettings()
    const id = setInterval(fetchLiveSettings, LIVE_SETTINGS_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  const cartActive = mounted && hasItems && isReservationActive(reservedAt)
  const cartExpired = mounted && hasItems && !isReservationActive(reservedAt) && reservedAt !== null

  return (
    <div className="border-b border-border-brand bg-cherry-wash">
      <div className="container-page flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-[7px]">
        {/* Quota left */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden>
            {urgencyBlitzMode && (
              <motion.span
                className="absolute inset-0 rounded-full bg-cta"
                animate={{ scale: [1, 2.4], opacity: [0.6, 0] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut' }}
              />
            )}
            <span className="relative h-1.5 w-1.5 rounded-full bg-cta" />
          </span>
          <p
            className={`flex items-center gap-x-1 font-sans text-xs font-medium ${urgencyBlitzMode ? 'text-cta' : 'text-primary'}`}
          >
            {urgencyBlitzMode && <span aria-hidden>🔥</span>}
            <span>Bugünün hasatından</span>
            <span className="font-mono font-semibold tabular-nums">
              {quotaRemaining} / {quotaTotal}
            </span>
            <span>kutu kaldı</span>
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
          <p className="flex items-center gap-x-1 font-sans text-xs text-muted">
            <span>Hasat kapısı:</span>
            {mounted ? (
              <span className="flex items-center gap-x-1 font-mono font-medium text-text tabular-nums">
                <Tick value={hhmmParts(cutoffSecs).h} />
                <span className="text-subtle">sa</span>
                <span aria-hidden>:</span>
                <Tick value={hhmmParts(cutoffSecs).m} />
                <span className="text-subtle">dk</span>
              </span>
            ) : (
              <span className="font-semibold text-text">—</span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
