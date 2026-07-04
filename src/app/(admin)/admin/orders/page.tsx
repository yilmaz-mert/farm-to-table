'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  X,
  Loader2,
  Truck,
  Link as LinkIcon,
  Filter,
  RefreshCw,
  Ban,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'
import { cn } from '@/lib/utils'

type OrderStatus =
  | 'pending_payment'
  | 'new_order'
  | 'harvesting'
  | 'packed'
  | 'shipped'
  | 'cancelled'

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  city: string
  total_amount: number
  status: OrderStatus
  tracking_number: string | null
  invoice_url: string | null
  created_at: string
  reserved_until: string | null
}

const STATUS_META: Record<
  OrderStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  pending_payment: {
    label: 'Ödeme Bekleniyor',
    color: 'text-amber-400',
    bg: 'bg-amber-950/40 border-amber-800/30',
    dot: 'bg-amber-400',
  },
  new_order: {
    label: 'Yeni Sipariş',
    color: 'text-blue-400',
    bg: 'bg-blue-950/40 border-blue-800/30',
    dot: 'bg-blue-400',
  },
  harvesting: {
    label: 'Hasatta',
    color: 'text-orange-400',
    bg: 'bg-orange-950/40 border-orange-800/30',
    dot: 'bg-orange-400',
  },
  packed: {
    label: 'Paketlendi',
    color: 'text-purple-400',
    bg: 'bg-purple-950/40 border-purple-800/30',
    dot: 'bg-purple-400',
  },
  shipped: {
    label: 'Kargoya Verildi',
    color: 'text-verdigris-400',
    bg: 'bg-verdigris-900/30 border-verdigris-800/30',
    dot: 'bg-verdigris-400',
  },
  cancelled: {
    label: 'İptal',
    color: 'text-subtle',
    bg: 'bg-raised border-border',
    dot: 'bg-subtle',
  },
}

const STATUS_ORDER: OrderStatus[] = [
  'pending_payment',
  'new_order',
  'harvesting',
  'packed',
  'shipped',
]

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  pending_payment: 'new_order',
  new_order: 'harvesting',
  harvesting: 'packed',
  packed: 'shipped',
  shipped: null,
  cancelled: null,
}

const NEXT_LABEL: Record<OrderStatus, string> = {
  pending_payment: 'Onayla',
  new_order: 'Hasata Al',
  harvesting: 'Paketlendi',
  packed: 'Kargoya Ver',
  shipped: '',
  cancelled: '',
}

const FILTER_LABELS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tümü' },
  { value: 'pending_payment', label: 'Ödeme Bekl.' },
  { value: 'new_order', label: 'Yeni' },
  { value: 'harvesting', label: 'Hasatta' },
  { value: 'packed', label: 'Paket' },
  { value: 'shipped', label: 'Kargo' },
  { value: 'cancelled', label: 'İptal' },
]

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface DetailModalProps {
  order: Order
  onClose: () => void
  onSave: (id: string, tracking: string, invoice: string) => Promise<void>
}

function DetailModal({ order, onClose, onSave }: DetailModalProps) {
  const [tracking, setTracking] = useState(order.tracking_number ?? '')
  const [invoice, setInvoice] = useState(order.invoice_url ?? '')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
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
  }, [onClose])

  async function handleSave() {
    setSaving(true)
    await onSave(order.id, tracking, invoice)
    setSaving(false)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 flex items-end bg-bark-950/80 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Sipariş detayları"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'tween', ease: [0.25, 0.46, 0.45, 0.94], duration: 0.32 }}
        className="w-full rounded-t-2xl border-t border-border bg-surface p-5 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border" />

        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="font-mono text-xs text-muted">{order.order_number}</p>
            <p className="font-sans text-base font-semibold text-text">{order.customer_name}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-subtle hover:bg-raised"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block font-sans text-xs font-medium text-muted">
              <Truck className="mr-1 inline h-3.5 w-3.5" aria-hidden />
              Kargo Takip Numarası
            </label>
            <input
              ref={inputRef}
              type="text"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="YK12345678901"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 font-mono text-sm text-text outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block font-sans text-xs font-medium text-muted">
              <LinkIcon className="mr-1 inline h-3.5 w-3.5" aria-hidden />
              Fatura URL
            </label>
            <input
              type="url"
              value={invoice}
              onChange={(e) => setInvoice(e.target.value)}
              placeholder="https://fatura.example.com/..."
              className="w-full rounded-xl border border-border bg-background px-4 py-3 font-mono text-sm text-text outline-none focus:border-primary"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-sans text-sm font-semibold text-inverted disabled:opacity-60 active:scale-[0.99]"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Kaydet
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function OrderCard({
  order,
  onStatusChange,
  onDetailOpen,
}: {
  order: Order
  onStatusChange: (id: string, status: OrderStatus) => Promise<void>
  onDetailOpen: (order: Order) => void
}) {
  const [advancing, setAdvancing] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const meta = STATUS_META[order.status]
  const next = NEXT_STATUS[order.status]
  const nextLabel = NEXT_LABEL[order.status]
  const canCancel = order.status !== 'cancelled' && order.status !== 'shipped'

  async function advance() {
    if (!next) return
    setAdvancing(true)
    await onStatusChange(order.id, next)
    setAdvancing(false)
  }

  async function cancel() {
    setCancelling(true)
    await onStatusChange(order.id, 'cancelled')
    setCancelling(false)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      {/* Status strip */}
      <div className={cn('px-4 py-2.5 border-b', meta.bg)}>
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', meta.dot)} aria-hidden />
          <span className={cn('font-sans text-xs font-semibold', meta.color)}>
            {meta.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3.5">
        <div className="mb-2.5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[11px] text-muted">{order.order_number}</p>
            <p className="mt-0.5 truncate font-sans text-sm font-semibold text-text">
              {order.customer_name}
            </p>
            <p className="font-sans text-xs text-muted">
              {order.city} · {formatTimestamp(order.created_at)}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono text-sm font-bold text-text">
              {formatPrice(order.total_amount * 100)}
            </p>
            {order.tracking_number && (
              <p className="mt-0.5 font-mono text-[10px] text-verdigris-400">
                {order.tracking_number}
              </p>
            )}
          </div>
        </div>

        {/* Contact info */}
        <p className="mb-3.5 font-sans text-xs text-subtle">{order.customer_phone}</p>

        {/* Action row */}
        <div className="flex items-center gap-2">
          {canCancel && (
            <button
              onClick={cancel}
              disabled={cancelling}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-subtle transition-colors hover:border-red-800/30 hover:bg-red-950/20 hover:text-red-400 disabled:opacity-50 active:scale-95"
              aria-label="Siparişi iptal et"
            >
              {cancelling ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Ban className="h-4 w-4" aria-hidden />
              )}
            </button>
          )}

          <button
            onClick={() => onDetailOpen(order)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-subtle transition-colors hover:bg-raised hover:text-text active:scale-95"
            aria-label="Takip no ve fatura gir"
          >
            <Truck className="h-4 w-4" aria-hidden />
          </button>

          {next ? (
            <button
              onClick={advance}
              disabled={advancing}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary font-sans text-sm font-semibold text-inverted transition-opacity disabled:opacity-60 active:scale-[0.99]"
              aria-label={`${nextLabel} → ${STATUS_META[next].label}`}
            >
              {advancing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <>
                  {nextLabel}
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </>
              )}
            </button>
          ) : (
            <div className="h-11 flex-1 rounded-xl border border-border bg-raised" />
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const supabase = createClient()

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select(
        'id, order_number, customer_name, customer_email, customer_phone, city, total_amount, status, tracking_number, invoice_url, created_at, reserved_until'
      )
      .order('created_at', { ascending: false })
      .limit(200)
    setOrders((data as Order[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  async function handleStatusChange(id: string, status: OrderStatus) {
    if (status !== 'pending_payment') {
      await supabase.from('orders').update({ status, reserved_until: null }).eq('id', id)
    } else {
      await supabase.from('orders').update({ status }).eq('id', id)
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status, reserved_until: null } : o))
    )
  }

  async function handleDetailSave(id: string, tracking: string, invoice: string) {
    await supabase
      .from('orders')
      .update({ tracking_number: tracking || null, invoice_url: invoice || null })
      .eq('id', id)
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? { ...o, tracking_number: tracking || null, invoice_url: invoice || null }
          : o
      )
    )
  }

  const visible =
    filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  const countByStatus = (s: OrderStatus) => orders.filter((o) => o.status === s).length

  return (
    <>
      <div className="flex flex-col pb-4">
        {/* Refresh strip */}
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <span className="font-sans text-xs text-muted">
            {orders.length} sipariş
          </span>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-1.5 font-sans text-xs font-medium text-accent disabled:opacity-50"
            aria-label="Siparişleri yenile"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} aria-hidden />
            Yenile
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
          {FILTER_LABELS.map(({ value, label }) => {
            const count =
              value === 'all'
                ? orders.length
                : countByStatus(value as OrderStatus)
            return (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 font-sans text-xs font-medium transition-colors',
                  filter === value
                    ? 'border-primary bg-cherry-wash text-primary'
                    : 'border-border bg-raised text-muted hover:bg-border'
                )}
              >
                {label}
                {count > 0 && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 font-mono text-[10px]',
                      filter === value
                        ? 'bg-primary/20 text-primary'
                        : 'bg-border text-subtle'
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Order cards */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-accent" aria-label="Yükleniyor" />
          </div>
        ) : visible.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <p className="font-sans text-sm font-semibold text-text">Sipariş bulunamadı</p>
            <p className="mt-1 font-sans text-xs text-muted">
              {filter === 'all' ? 'Henüz sipariş yok.' : 'Bu filtre için sipariş yok.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 px-4 pt-1">
            {visible.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
                onDetailOpen={setDetailOrder}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail / tracking drawer */}
      <AnimatePresence>
        {detailOrder && (
          <DetailModal
            order={detailOrder}
            onClose={() => setDetailOrder(null)}
            onSave={handleDetailSave}
          />
        )}
      </AnimatePresence>
    </>
  )
}
