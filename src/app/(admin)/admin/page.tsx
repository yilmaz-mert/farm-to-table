'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Minus,
  Plus,
  Save,
  TrendingUp,
  Package,
  ShoppingBag,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'

interface HarvestLog {
  id: string
  harvest_date: string
  total_box_quota: number
  remaining_boxes: number
}

interface Product {
  id: string
  name: string
  package_weight_kg: number
  total_price: number
  price_per_kg: number
  is_active: boolean
}

interface OrderStats {
  total: number
  revenue: number
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function QuotaController({ log, onUpdate }: { log: HarvestLog; onUpdate: () => void }) {
  const [remaining, setRemaining] = useState(log.remaining_boxes)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const total = log.total_box_quota
  const pct = total > 0 ? Math.round((remaining / total) * 100) : 0
  const supabase = createClient()

  async function applyDelta(delta: number) {
    const next = Math.max(0, Math.min(total, remaining + delta))
    if (next === remaining) return
    setRemaining(next)
    setSaving(true)
    setSaved(false)
    await supabase
      .from('daily_harvest_logs')
      .update({ remaining_boxes: next })
      .eq('id', log.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
    onUpdate()
  }

  async function resetToQuota() {
    setRemaining(total)
    setSaving(true)
    setSaved(false)
    await supabase
      .from('daily_harvest_logs')
      .update({ remaining_boxes: total })
      .eq('id', log.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
    onUpdate()
  }

  const STEPS = [-5, -1, 1, 5]

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
            Günlük Kota
          </p>
          <p className="mt-0.5 font-sans text-sm font-medium text-muted">
            {formatDate(log.harvest_date)}
          </p>
        </div>
        {saving ? (
          <Loader2 className="mt-1 h-4 w-4 animate-spin text-subtle" aria-hidden />
        ) : saved ? (
          <CheckCircle2 className="mt-1 h-4 w-4 text-verdigris-500" aria-hidden />
        ) : null}
      </div>

      {/* Big numbers */}
      <div className="mb-5 flex items-baseline gap-3">
        <span className="font-mono text-5xl font-bold tabular-nums text-text">
          {remaining}
        </span>
        <span className="font-mono text-xl text-subtle">/ {total}</span>
        <span className="font-sans text-sm text-muted">kutu kaldı</span>
      </div>

      {/* Progress bar */}
      <div className="mb-5 h-2.5 overflow-hidden rounded-full bg-raised">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={remaining}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={`Kalan kutu: ${remaining} / ${total}`}
        />
      </div>

      {/* Delta buttons */}
      <div className="mb-4 grid grid-cols-4 gap-2">
        {STEPS.map((step) => (
          <button
            key={step}
            onClick={() => applyDelta(step)}
            className={`flex h-12 items-center justify-center rounded-xl border font-mono text-sm font-semibold transition-all active:scale-95 ${
              step < 0
                ? 'border-border bg-raised text-muted hover:bg-border hover:text-text'
                : 'border-primary/30 bg-cherry-wash text-primary hover:bg-cherry-wash/70'
            }`}
            aria-label={`${step > 0 ? '+' : ''}${step} kutu`}
          >
            {step > 0 ? '+' : ''}
            {step}
          </button>
        ))}
      </div>

      {/* Reset */}
      <button
        onClick={resetToQuota}
        className="w-full rounded-xl border border-border py-2.5 font-sans text-sm font-medium text-muted transition-colors hover:bg-raised hover:text-text active:scale-[0.99]"
      >
        Toplam Kotaya Sıfırla ({total})
      </button>
    </div>
  )
}

function PriceEditor({ products, onUpdate }: { products: Product[]; onUpdate: () => void }) {
  const [edits, setEdits] = useState<Record<string, { total: string; perKg: string }>>(() =>
    Object.fromEntries(
      products.map((p) => [
        p.id,
        {
          total: p.total_price.toFixed(2),
          perKg: p.price_per_kg.toFixed(2),
        },
      ])
    )
  )
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const supabase = createClient()

  async function saveProduct(id: string) {
    const edit = edits[id]
    const total = parseFloat(edit.total)
    const perKg = parseFloat(edit.perKg)
    if (isNaN(total) || isNaN(perKg) || total <= 0 || perKg <= 0) return
    setSaving((s) => ({ ...s, [id]: true }))
    await supabase
      .from('products')
      .update({ total_price: total, price_per_kg: perKg, updated_at: new Date().toISOString() })
      .eq('id', id)
    setSaving((s) => ({ ...s, [id]: false }))
    setSaved((s) => ({ ...s, [id]: true }))
    setTimeout(() => setSaved((s) => ({ ...s, [id]: false })), 1800)
    onUpdate()
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center gap-2">
        <Package className="h-4 w-4 text-accent" aria-hidden />
        <h2 className="font-sans text-sm font-semibold text-text">Paket Fiyatları</h2>
      </div>

      <div className="space-y-4">
        {products.map((product) => {
          const edit = edits[product.id]
          const isSaving = saving[product.id]
          const isSaved = saved[product.id]
          return (
            <div key={product.id} className="rounded-xl border border-border bg-raised p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="font-sans text-sm font-semibold text-text">{product.name}</p>
                  <p className="font-mono text-xs text-muted">{product.package_weight_kg} kg</p>
                </div>
                {isSaved ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-verdigris-500" aria-hidden />
                ) : (
                  <span className="font-mono text-xs text-subtle">
                    {formatPrice(product.total_price * 100)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                <div>
                  <label className="mb-1 block font-sans text-[10px] font-medium text-subtle">
                    Paket (₺)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={edit.total}
                    onChange={(e) =>
                      setEdits((ed) => ({
                        ...ed,
                        [product.id]: { ...ed[product.id], total: e.target.value },
                      }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm text-text outline-none focus:border-primary"
                    aria-label="Paket fiyatı"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-sans text-[10px] font-medium text-subtle">
                    KG başı (₺)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={edit.perKg}
                    onChange={(e) =>
                      setEdits((ed) => ({
                        ...ed,
                        [product.id]: { ...ed[product.id], perKg: e.target.value },
                      }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm text-text outline-none focus:border-primary"
                    aria-label="Kilogram başı fiyat"
                  />
                </div>
                <button
                  onClick={() => saveProduct(product.id)}
                  disabled={isSaving}
                  className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-primary text-inverted transition-opacity disabled:opacity-60 active:scale-95"
                  aria-label={`${product.name} fiyatını kaydet`}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Save className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [log, setLog] = useState<HarvestLog | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<OrderStats>({ total: 0, revenue: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const todayStr = new Date().toISOString().slice(0, 10)

  const fetchData = useCallback(async () => {
    const [logRes, productsRes, ordersRes] = await Promise.all([
      supabase
        .from('daily_harvest_logs')
        .select('*')
        .eq('harvest_date', todayStr)
        .maybeSingle(),
      supabase
        .from('products')
        .select('id, name, package_weight_kg, total_price, price_per_kg, is_active')
        .eq('is_active', true)
        .order('package_weight_kg'),
      supabase
        .from('orders')
        .select('total_amount, status')
        .gte('created_at', `${todayStr}T00:00:00Z`),
    ])

    if (logRes.data) {
      setLog(logRes.data)
    } else {
      // No row for today yet — upsert (not insert) so a second admin tab
      // loading at the same moment can't race into a duplicate-key error.
      // If this itself fails, fall back to a client-side default so the
      // dashboard never shows a dead-end "not found" state.
      const { data: newLog } = await supabase
        .from('daily_harvest_logs')
        .upsert(
          { harvest_date: todayStr, total_box_quota: 50, remaining_boxes: 50 },
          { onConflict: 'harvest_date' }
        )
        .select()
        .single()
      setLog(
        newLog ?? {
          id: todayStr,
          harvest_date: todayStr,
          total_box_quota: 50,
          remaining_boxes: 50,
        }
      )
    }

    setProducts(productsRes.data ?? [])

    const orders = ordersRes.data ?? []
    setStats({
      total: orders.length,
      revenue: orders
        .filter((o) => o.status !== 'cancelled' && o.status !== 'pending_payment')
        .reduce((sum, o) => sum + (o.total_amount ?? 0), 0),
    })

    setLoading(false)
  }, [supabase, todayStr])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" aria-label="Yükleniyor" />
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 pb-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-accent">
            <ShoppingBag className="h-4 w-4" aria-hidden />
            <span className="font-sans text-xs font-medium text-muted">Bugünkü Sipariş</span>
          </div>
          <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-text">
            {stats.total}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-accent">
            <TrendingUp className="h-4 w-4" aria-hidden />
            <span className="font-sans text-xs font-medium text-muted">Bugünkü Ciro</span>
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-text">
            {formatPrice(stats.revenue * 100)}
          </p>
        </div>
      </div>

      {/* Harvest quota */}
      {log && <QuotaController log={log} onUpdate={fetchData} />}

      {/* Price editor */}
      {products.length > 0 && <PriceEditor products={products} onUpdate={fetchData} />}
    </div>
  )
}
