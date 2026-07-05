'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle2, AlertTriangle, Flame, Image as ImageIcon, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { saveAdminSettings } from './actions'

function buildMediaPath(prefix: string, file: File): string {
  const ext = file.name.split('.').pop() ?? 'jpg'
  return `${prefix}-${Date.now()}.${ext}`
}

interface ProductDraft {
  id: string
  name: string
  package_weight_kg: number
  total_price: string
  price_per_kg: string
  image_url: string | null
  description: string
  marketing_copy: string
}

interface GalleryDraft {
  slot_index: number
  kind: 'harvest' | 'unboxing'
  image_url: string | null
  title: string
  harvest_time: string
  location_tag: string
}

const GALLERY_SLOT_COUNT = 6

function defaultGallerySlots(): GalleryDraft[] {
  return Array.from({ length: GALLERY_SLOT_COUNT }, (_, i) => ({
    slot_index: i + 1,
    kind: 'harvest' as const,
    image_url: null,
    title: '',
    harvest_time: '',
    location_tag: '',
  }))
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors ${
        checked ? 'border-primary bg-primary' : 'border-border bg-raised'
      }`}
    >
      <motion.span
        className="h-6 w-6 rounded-full bg-inverted shadow-sm"
        animate={{ x: checked ? 26 : 3 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  )
}

function SectionCard({
  emoji,
  title,
  children,
}: {
  emoji: string
  title: string
  children: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="mb-4 flex items-center gap-2 font-sans text-sm font-semibold text-text">
        <span aria-hidden>{emoji}</span>
        {title}
      </h2>
      {children}
    </div>
  )
}

function ImageUploadRow({
  label,
  imageUrl,
  uploading,
  onFileSelected,
}: {
  label: string
  imageUrl: string | null
  uploading: boolean
  onFileSelected: (file: File) => void
}) {
  return (
    <div className="rounded-xl border border-border bg-raised p-4">
      <p className="mb-3 font-sans text-sm font-semibold text-text">{label}</p>
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
          {imageUrl ? (
            // Admin-only thumbnail preview — plain <img> keeps this independent of next/image's remote-pattern config
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={`${label} önizleme`} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-5 w-5 text-subtle" aria-hidden />
          )}
        </div>
        <label className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-background font-sans text-sm font-medium text-text transition-colors hover:bg-raised active:scale-[0.99]">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Upload className="h-4 w-4" aria-hidden />
          )}
          {uploading ? 'Yükleniyor…' : 'Görsel Seç'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) onFileSelected(file)
            }}
          />
        </label>
      </div>
    </div>
  )
}

function VideoUploadRow({
  label,
  hint,
  videoUrl,
  uploading,
  onFileSelected,
}: {
  label: string
  hint: string
  videoUrl: string | null
  uploading: boolean
  onFileSelected: (file: File) => void
}) {
  return (
    <div className="rounded-xl border border-border bg-raised p-4">
      <p className="mb-1 font-sans text-sm font-semibold text-text">{label}</p>
      <p className="mb-3 font-sans text-xs text-muted">{hint}</p>
      <div className="flex items-center gap-3">
        <div className="flex h-11 flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 font-sans text-xs text-muted">
          {videoUrl ? (
            <>
              <CheckCircle2 className="h-4 w-4 shrink-0 text-verdigris-500" aria-hidden />
              <span className="truncate">Video yüklendi</span>
            </>
          ) : (
            <span>Henüz video yok</span>
          )}
        </div>
        <label className="flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 font-sans text-sm font-medium text-text transition-colors hover:bg-raised active:scale-[0.99]">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Upload className="h-4 w-4" aria-hidden />
          )}
          {uploading ? 'Yükleniyor…' : 'Video Seç'}
          <input
            type="file"
            accept="video/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) onFileSelected(file)
            }}
          />
        </label>
      </div>
    </div>
  )
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  const [products, setProducts] = useState<ProductDraft[]>([])
  // Resilient defaults — used whenever today has no daily_harvest_logs row
  // yet. The view must never block on a missing row; Save upserts instead.
  const [dailyBoxLimit, setDailyBoxLimit] = useState(50)
  const [boxesRemaining, setBoxesRemaining] = useState(50)
  const [urgencyBlitzMode, setUrgencyBlitzMode] = useState(false)
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null)
  const [heroVideoUrl, setHeroVideoUrl] = useState<string | null>(null)
  const [productsBgUrl, setProductsBgUrl] = useState<string | null>(null)
  const [featuresBgUrl, setFeaturesBgUrl] = useState<string | null>(null)
  const [gallerySlots, setGallerySlots] = useState<GalleryDraft[]>(defaultGallerySlots())

  const [uploadingHero, setUploadingHero] = useState(false)
  const [uploadingHeroVideo, setUploadingHeroVideo] = useState(false)
  const [uploadingProductsBg, setUploadingProductsBg] = useState(false)
  const [uploadingFeaturesBg, setUploadingFeaturesBg] = useState(false)
  const [uploadingProductId, setUploadingProductId] = useState<string | null>(null)
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null)

  const todayStr = new Date().toISOString().slice(0, 10)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    try {
      const [productsRes, logRes, settingsRes, galleryRes] = await Promise.all([
        supabase
          .from('products')
          .select(
            'id, name, package_weight_kg, total_price, price_per_kg, image_url, description, marketing_copy'
          )
          .eq('is_active', true)
          .order('package_weight_kg'),
        supabase
          .from('daily_harvest_logs')
          .select('total_box_quota, remaining_boxes')
          .eq('harvest_date', todayStr)
          .maybeSingle(),
        supabase
          .from('store_settings')
          .select(
            'urgency_blitz_mode, hero_image_url, hero_video_url, products_bg_url, features_bg_url'
          )
          .eq('id', 1)
          .maybeSingle(),
        supabase.from('gallery_shots').select('*').order('slot_index'),
      ])

      setProducts(
        (productsRes.data ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          package_weight_kg: p.package_weight_kg,
          total_price: p.total_price.toFixed(2),
          price_per_kg: p.price_per_kg.toFixed(2),
          image_url: p.image_url,
          description: p.description ?? '',
          marketing_copy: p.marketing_copy ?? '',
        }))
      )

      // No row for today yet is not an error — keep the 50/50 fallback
      // already in state and let Save create it via upsert.
      if (logRes.data) {
        setDailyBoxLimit(logRes.data.total_box_quota)
        setBoxesRemaining(logRes.data.remaining_boxes)
      }

      if (settingsRes.data) {
        setUrgencyBlitzMode(settingsRes.data.urgency_blitz_mode)
        setHeroImageUrl(settingsRes.data.hero_image_url)
        setHeroVideoUrl(settingsRes.data.hero_video_url)
        setProductsBgUrl(settingsRes.data.products_bg_url)
        setFeaturesBgUrl(settingsRes.data.features_bg_url)
      }

      // Merge fetched rows onto the 6 default slots by position — a slot
      // with no row yet (migration not applied, or a gap) still renders an
      // empty editable card rather than disappearing from the grid.
      const bySlot = new Map((galleryRes.data ?? []).map((g) => [g.slot_index, g]))
      setGallerySlots(
        defaultGallerySlots().map((fallback) => {
          const row = bySlot.get(fallback.slot_index)
          return row
            ? {
                slot_index: row.slot_index,
                kind: row.kind,
                image_url: row.image_url,
                title: row.title,
                harvest_time: row.harvest_time,
                location_tag: row.location_tag,
              }
            : fallback
        })
      )
    } catch (err) {
      setError('Ayarlar yüklenemedi. Sayfayı yenileyip tekrar deneyin.')
      console.error('[AdminSettings] fetchAll failed:', err)
    } finally {
      setLoading(false)
    }
  }, [todayStr])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    if (!savedAt) return
    const id = setTimeout(() => setSavedAt(null), 2600)
    return () => clearTimeout(id)
  }, [savedAt])

  async function uploadToStoreMedia(file: File, path: string): Promise<string | null> {
    // Uploads go straight from the browser to Supabase Storage — NOT
    // through a Server Action. Server Actions have a body size limit (Next
    // enforced 1MB by default); routing raw file bytes through one caused
    // "Body exceeded 1 MB limit (413)" for any real photo. Only the
    // resulting short public URL string goes through saveAdminSettings.
    const supabase = createClient()
    const { error: uploadError } = await supabase.storage
      .from('store-media')
      .upload(path, file, { cacheControl: '3600', upsert: true })

    if (uploadError) {
      setError(`Görsel yüklenemedi: ${uploadError.message}`)
      return null
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('store-media').getPublicUrl(path)
    return publicUrl
  }

  async function handleHeroFile(file: File) {
    setUploadingHero(true)
    const url = await uploadToStoreMedia(file, buildMediaPath('hero/background', file))
    if (url) setHeroImageUrl(url)
    setUploadingHero(false)
  }

  async function handleHeroVideoFile(file: File) {
    setUploadingHeroVideo(true)
    const url = await uploadToStoreMedia(file, buildMediaPath('hero/video', file))
    if (url) setHeroVideoUrl(url)
    setUploadingHeroVideo(false)
  }

  async function handleProductsBgFile(file: File) {
    setUploadingProductsBg(true)
    const url = await uploadToStoreMedia(file, buildMediaPath('sections/products-bg', file))
    if (url) setProductsBgUrl(url)
    setUploadingProductsBg(false)
  }

  async function handleFeaturesBgFile(file: File) {
    setUploadingFeaturesBg(true)
    const url = await uploadToStoreMedia(file, buildMediaPath('sections/features-bg', file))
    if (url) setFeaturesBgUrl(url)
    setUploadingFeaturesBg(false)
  }

  async function handleProductFile(productId: string, file: File) {
    setUploadingProductId(productId)
    const url = await uploadToStoreMedia(file, buildMediaPath(`products/${productId}`, file))
    if (url) {
      setProducts((ps) => ps.map((p) => (p.id === productId ? { ...p, image_url: url } : p)))
    }
    setUploadingProductId(null)
  }

  async function handleGalleryFile(slotIndex: number, file: File) {
    setUploadingSlot(slotIndex)
    const url = await uploadToStoreMedia(file, buildMediaPath(`gallery/slot-${slotIndex}`, file))
    if (url) {
      setGallerySlots((gs) =>
        gs.map((g) => (g.slot_index === slotIndex ? { ...g, image_url: url } : g))
      )
    }
    setUploadingSlot(null)
  }

  function updateGallerySlot(slotIndex: number, patch: Partial<GalleryDraft>) {
    setGallerySlots((gs) =>
      gs.map((g) => (g.slot_index === slotIndex ? { ...g, ...patch } : g))
    )
  }

  async function handleSaveAll() {
    setSaving(true)
    setError(null)
    try {
      for (const p of products) {
        if (!p.name.trim()) {
          throw new Error(`${p.package_weight_kg} kg paket için ürün başlığı boş olamaz.`)
        }
        const total = parseFloat(p.total_price)
        const perKg = parseFloat(p.price_per_kg)
        if (!Number.isFinite(total) || !Number.isFinite(perKg) || total <= 0 || perKg <= 0) {
          throw new Error(`${p.name} için geçersiz fiyat değeri.`)
        }
      }

      const total = Math.max(0, Math.round(dailyBoxLimit))
      const remaining = Math.max(0, Math.min(total, Math.round(boxesRemaining)))

      // Routed through a service-role Server Action (see ./actions.ts) —
      // writing via the anon browser client + RLS was silently matching
      // zero rows for accounts RLS didn't recognize as admin, which is why
      // saves looked successful but never reached the database.
      const result = await saveAdminSettings({
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          package_weight_kg: p.package_weight_kg,
          total_price: parseFloat(p.total_price),
          price_per_kg: parseFloat(p.price_per_kg),
          image_url: p.image_url,
          description: p.description,
          marketing_copy: p.marketing_copy,
        })),
        harvestDate: todayStr,
        totalBoxQuota: total,
        remainingBoxes: remaining,
        urgencyBlitzMode,
        heroImageUrl,
        heroVideoUrl,
        productsBgUrl,
        featuresBgUrl,
        gallerySlots: gallerySlots.map((g) => ({
          slot_index: g.slot_index,
          kind: g.kind,
          image_url: g.image_url,
          title: g.title,
          harvest_time: g.harvest_time,
          location_tag: g.location_tag,
        })),
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      setDailyBoxLimit(total)
      setBoxesRemaining(remaining)
      setSavedAt(Date.now())
    } catch (err) {
      console.error('SUPABASE SAVE ERROR:', err)
      setError(err instanceof Error ? err.message : 'Kaydedilemedi. Lütfen tekrar deneyin.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" aria-label="Yükleniyor" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4 pb-4 scrollbar-none">
        {/* Fiyat Yönetimi */}
        <SectionCard emoji="📦" title="Fiyat Yönetimi">
          <div className="space-y-3">
            {products.map((p, i) => (
              <div key={p.id} className="rounded-xl border border-border bg-raised p-4">
                <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-subtle">
                  {p.package_weight_kg} kg paket
                </p>
                <label className="mb-3 block">
                  <span className="mb-1 block font-sans text-[11px] font-medium text-subtle">
                    Ana Ürün Başlığı
                  </span>
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => {
                      const v = e.target.value
                      setProducts((ps) => ps.map((x, xi) => (xi === i ? { ...x, name: v } : x)))
                    }}
                    placeholder="ör. Organik Kiraz · 1 kg"
                    className="w-full rounded-lg border-2 border-primary/40 bg-background px-3 py-3 font-sans text-base font-semibold text-text outline-none focus:border-primary"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1 block font-sans text-[11px] font-medium text-subtle">
                      Paket (₺)
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={p.total_price}
                      onChange={(e) => {
                        const v = e.target.value
                        setProducts((ps) =>
                          ps.map((x, xi) => (xi === i ? { ...x, total_price: v } : x))
                        )
                      }}
                      className="w-full rounded-lg border border-border bg-background px-3 py-3 font-mono text-base text-text outline-none focus:border-primary"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block font-sans text-[11px] font-medium text-subtle">
                      KG başı (₺)
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={p.price_per_kg}
                      onChange={(e) => {
                        const v = e.target.value
                        setProducts((ps) =>
                          ps.map((x, xi) => (xi === i ? { ...x, price_per_kg: v } : x))
                        )
                      }}
                      className="w-full rounded-lg border border-border bg-background px-3 py-3 font-mono text-base text-text outline-none focus:border-primary"
                    />
                  </label>
                </div>
                <div className="mt-3 space-y-3">
                  <label className="block">
                    <span className="mb-1 block font-sans text-[11px] font-medium text-subtle">
                      Ürün Başlığı
                    </span>
                    <input
                      type="text"
                      value={p.description}
                      onChange={(e) => {
                        const v = e.target.value
                        setProducts((ps) =>
                          ps.map((x, xi) => (xi === i ? { ...x, description: v } : x))
                        )
                      }}
                      placeholder="ör. Organik Kiraz · 1 kg"
                      className="w-full rounded-lg border border-border bg-background px-3 py-3 font-sans text-sm text-text outline-none focus:border-primary"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block font-sans text-[11px] font-medium text-subtle">
                      Paket Açıklaması
                    </span>
                    <textarea
                      value={p.marketing_copy}
                      onChange={(e) => {
                        const v = e.target.value
                        setProducts((ps) =>
                          ps.map((x, xi) => (xi === i ? { ...x, marketing_copy: v } : x))
                        )
                      }}
                      rows={2}
                      placeholder="ör. İlk tanışma için ideal. Tek sıra dizilmiş, 26 mm+ kalibre kiraz."
                      className="w-full resize-none rounded-lg border border-border bg-background px-3 py-3 font-sans text-sm text-text outline-none focus:border-primary"
                    />
                  </label>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <p className="font-sans text-sm text-muted">Aktif paket bulunamadı.</p>
            )}
          </div>
        </SectionCard>

        {/* Hasat Kotası ve Aciliyet */}
        <SectionCard emoji="🔥" title="Hasat Kotası ve Aciliyet">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block font-sans text-[11px] font-medium text-subtle">
                  Günlük Kota
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={dailyBoxLimit}
                  onChange={(e) => setDailyBoxLimit(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-3 font-mono text-lg font-semibold text-text outline-none focus:border-primary"
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-sans text-[11px] font-medium text-subtle">
                  Kalan Kutu
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={boxesRemaining}
                  onChange={(e) => setBoxesRemaining(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-3 font-mono text-lg font-semibold text-text outline-none focus:border-primary"
                />
              </label>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-raised p-4">
              <div className="flex items-center gap-2.5">
                <Flame
                  className={`h-4 w-4 ${urgencyBlitzMode ? 'text-cta' : 'text-subtle'}`}
                  aria-hidden
                />
                <div>
                  <p className="font-sans text-sm font-medium text-text">Aciliyet Modu</p>
                  <p className="font-sans text-xs text-muted">
                    Vitrindeki duyuru çubuğunu kırmızı nabızla vurgular
                  </p>
                </div>
              </div>
              <ToggleSwitch
                checked={urgencyBlitzMode}
                onChange={setUrgencyBlitzMode}
                label="Aciliyet modunu aç/kapat"
              />
            </div>
          </div>
        </SectionCard>

        {/* Görsel ve Medya Yönetimi */}
        <SectionCard emoji="🖼️" title="Görsel ve Medya Yönetimi">
          <div className="space-y-3">
            <ImageUploadRow
              label="Hero Arkaplan Görseli"
              imageUrl={heroImageUrl}
              uploading={uploadingHero}
              onFileSelected={handleHeroFile}
            />
            <VideoUploadRow
              label="Hero Arkaplan Videosu"
              hint="Varsa görselin yerine sessiz, otomatik oynatılan video gösterilir."
              videoUrl={heroVideoUrl}
              uploading={uploadingHeroVideo}
              onFileSelected={handleHeroVideoFile}
            />
            <ImageUploadRow
              label="Ürünler Bölümü Arkaplanı"
              imageUrl={productsBgUrl}
              uploading={uploadingProductsBg}
              onFileSelected={handleProductsBgFile}
            />
            <ImageUploadRow
              label="Hikaye & Şeffaflık Arkaplanı"
              imageUrl={featuresBgUrl}
              uploading={uploadingFeaturesBg}
              onFileSelected={handleFeaturesBgFile}
            />
            {products.map((p) => (
              <ImageUploadRow
                key={p.id}
                label={`${p.name} · ${p.package_weight_kg} kg`}
                imageUrl={p.image_url}
                uploading={uploadingProductId === p.id}
                onFileSelected={(file) => handleProductFile(p.id, file)}
              />
            ))}
          </div>
        </SectionCard>

        {/* Bugün Bahçeden Kareler — 6-slot gallery manager */}
        <SectionCard emoji="🍒" title="Bugün Bahçeden Kareler">
          <div className="grid gap-4 sm:grid-cols-2">
            {gallerySlots.map((slot) => (
              <div
                key={slot.slot_index}
                className="space-y-3 rounded-xl border border-border bg-raised p-4"
              >
                <p className="font-sans text-[11px] font-medium uppercase tracking-[0.14em] text-subtle">
                  Kare {slot.slot_index}
                </p>

                <div className="flex items-center gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
                    {slot.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={slot.image_url}
                        alt={`Kare ${slot.slot_index} önizleme`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-subtle" aria-hidden />
                    )}
                  </div>
                  <label className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-background font-sans text-sm font-medium text-text transition-colors hover:bg-raised active:scale-[0.99]">
                    {uploadingSlot === slot.slot_index ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Upload className="h-4 w-4" aria-hidden />
                    )}
                    {uploadingSlot === slot.slot_index ? 'Yükleniyor…' : 'Görsel Seç'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingSlot === slot.slot_index}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        e.target.value = ''
                        if (file) handleGalleryFile(slot.slot_index, file)
                      }}
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1 block font-sans text-[11px] font-medium text-subtle">
                    Başlık / Müşteri Açılış Notu
                  </span>
                  <input
                    type="text"
                    value={slot.title}
                    onChange={(e) =>
                      updateGallerySlot(slot.slot_index, { title: e.target.value })
                    }
                    placeholder="ör. Günün ilk kasası"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 font-sans text-sm text-text outline-none focus:border-primary"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1 block font-sans text-[11px] font-medium text-subtle">
                      Hasat Saati
                    </span>
                    <input
                      type="text"
                      value={slot.harvest_time}
                      onChange={(e) =>
                        updateGallerySlot(slot.slot_index, { harvest_time: e.target.value })
                      }
                      placeholder="ör. Bu sabah 06:42"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm text-text outline-none focus:border-primary"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block font-sans text-[11px] font-medium text-subtle">
                      Konum / Parsel Etiketi
                    </span>
                    <input
                      type="text"
                      value={slot.location_tag}
                      onChange={(e) =>
                        updateGallerySlot(slot.slot_index, { location_tag: e.target.value })
                      }
                      placeholder="ör. Parsel 3"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 font-sans text-sm text-text outline-none focus:border-primary"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

      </div>

      {/* Sticky save bar — thumb-reachable on mobile. Errors are anchored
          here (not in the scrollable content above) so a failed save is
          never missed just because the admin isn't scrolled to where the
          banner would otherwise render. */}
      <div className="sticky bottom-0 shrink-0 border-t border-border bg-surface/95 p-4 backdrop-blur-sm">
        {error && (
          <div className="mb-3 flex items-start gap-2.5 rounded-xl border border-red-800/30 bg-red-950/30 p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden />
            <p className="font-sans text-sm text-red-400">{error}</p>
          </div>
        )}
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-sans text-base font-semibold text-inverted shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99]"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            <CheckCircle2 className="h-5 w-5" aria-hidden />
          )}
          Değişiklikleri Canlıya Al
        </button>

        <AnimatePresence>
          {savedAt && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 text-center font-sans text-xs font-medium text-verdigris-500"
            >
              Değişiklikler canlıya alındı ✓
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
