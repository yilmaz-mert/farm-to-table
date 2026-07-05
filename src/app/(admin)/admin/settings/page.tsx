'use client'

import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle2, AlertTriangle, Flame, Image as ImageIcon, Upload, X } from 'lucide-react'
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
  highlight_badge: string
}

type GalleryCategory = 'bahceden' | 'kutu_acilisi' | 'hasat_ani'

const GALLERY_CATEGORY_OPTIONS: { value: GalleryCategory; label: string }[] = [
  { value: 'bahceden', label: 'Bahçeden' },
  { value: 'kutu_acilisi', label: 'Kutu Açılışı' },
  { value: 'hasat_ani', label: 'Hasat Anı' },
]

interface GalleryDraft {
  slot_index: number
  category: GalleryCategory
  image_url: string | null
  title: string
  harvest_time: string
  location_tag: string
}

const GALLERY_SLOT_COUNT = 6

function defaultGallerySlots(): GalleryDraft[] {
  return Array.from({ length: GALLERY_SLOT_COUNT }, (_, i) => ({
    slot_index: i + 1,
    category: 'bahceden' as const,
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
  onRemove,
}: {
  label: string
  imageUrl: string | null
  uploading: boolean
  onFileSelected: (file: File) => void
  onRemove?: () => void
}) {
  return (
    <div className="rounded-xl border border-border bg-raised p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="font-sans text-sm font-semibold text-text">{label}</p>
        {imageUrl && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1 rounded-md px-2 py-1 font-sans text-xs font-medium text-red-400 transition-colors hover:bg-red-950/30"
            aria-label={`${label} — görseli kaldır`}
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Görseli Kaldır
          </button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
          {imageUrl ? (
            // A fixed 64x64 next/image request — not the full original file
            // (potentially several MB) just to paint a thumbnail this small.
            <Image
              src={imageUrl}
              alt={`${label} önizleme`}
              fill
              sizes="64px"
              className="object-cover"
            />
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
  onRemove,
}: {
  label: string
  hint: string
  videoUrl: string | null
  uploading: boolean
  onFileSelected: (file: File) => void
  onRemove?: () => void
}) {
  return (
    <div className="rounded-xl border border-border bg-raised p-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="font-sans text-sm font-semibold text-text">{label}</p>
        {videoUrl && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1 rounded-md px-2 py-1 font-sans text-xs font-medium text-red-400 transition-colors hover:bg-red-950/30"
            aria-label={`${label} — videoyu kaldır`}
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Videoyu Kaldır
          </button>
        )}
      </div>
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

/**
 * Isolated + memoized on purpose: this is the heaviest subtree on the page
 * (6 cards × image preview + 3 text inputs each). Without React.memo here,
 * editing any unrelated field elsewhere on the settings page (a product
 * price, the hero toggle, harvest quota) re-renders all 6 gallery cards
 * along with everything else, since all state used to live in one
 * top-level component. As long as the props below stay referentially
 * stable (see the useCallback wrapping in AdminSettingsPage), React skips
 * this whole subtree on renders that don't actually touch gallery state.
 */
const GalleryManager = memo(function GalleryManager({
  gallerySlots,
  uploadingSlot,
  onFileSelected,
  onUpdateSlot,
  onRemoveImage,
}: {
  gallerySlots: GalleryDraft[]
  uploadingSlot: number | null
  onFileSelected: (slotIndex: number, file: File) => void
  onUpdateSlot: (slotIndex: number, patch: Partial<GalleryDraft>) => void
  onRemoveImage: (slotIndex: number) => void
}) {
  return (
    <SectionCard emoji="🍒" title="Bugün Bahçeden Kareler">
      <div className="grid gap-4 sm:grid-cols-2">
        {gallerySlots.map((slot) => (
          <div
            key={slot.slot_index}
            className="space-y-3 rounded-xl border border-border bg-raised p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-sans text-[11px] font-medium uppercase tracking-[0.14em] text-subtle">
                Kare {slot.slot_index}
              </p>
              {slot.image_url && (
                <button
                  type="button"
                  onClick={() => onRemoveImage(slot.slot_index)}
                  className="flex items-center gap-1 rounded-md px-2 py-1 font-sans text-xs font-medium text-red-400 transition-colors hover:bg-red-950/30"
                  aria-label={`Kare ${slot.slot_index} — görseli kaldır`}
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                  Görseli Kaldır
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
                {slot.image_url ? (
                  // A fixed 64x64 next/image request — not the full original
                  // camera-resolution upload just to paint a thumbnail.
                  <Image
                    src={slot.image_url}
                    alt={`Kare ${slot.slot_index} önizleme`}
                    fill
                    sizes="64px"
                    className="object-cover"
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
                    if (file) onFileSelected(slot.slot_index, file)
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
                onChange={(e) => onUpdateSlot(slot.slot_index, { title: e.target.value })}
                placeholder="ör. Günün ilk kasası"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 font-sans text-sm text-text outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="mb-1 block font-sans text-[11px] font-medium text-subtle">
                Kategori
              </span>
              <select
                value={slot.category}
                onChange={(e) =>
                  onUpdateSlot(slot.slot_index, {
                    category: e.target.value as GalleryCategory,
                  })
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 font-sans text-sm text-text outline-none focus:border-primary"
              >
                {GALLERY_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
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
                    onUpdateSlot(slot.slot_index, { harvest_time: e.target.value })
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
                    onUpdateSlot(slot.slot_index, { location_tag: e.target.value })
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
  )
})

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
  const [gallerySlots, setGallerySlots] = useState<GalleryDraft[]>(defaultGallerySlots())

  const [uploadingHero, setUploadingHero] = useState(false)
  const [uploadingHeroVideo, setUploadingHeroVideo] = useState(false)
  const [uploadingProductId, setUploadingProductId] = useState<string | null>(null)
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null)

  // URLs cleared via "Görseli Kaldır" this session — actually deleted from
  // Supabase Storage only on a successful Save (see handleSaveAll), not the
  // instant the button is clicked. Deleting immediately would risk a
  // dangling DB reference to an already-gone file if the admin navigates
  // away without saving; deferring keeps storage and DB consistent together.
  const [pendingDeletions, setPendingDeletions] = useState<string[]>([])
  const queueDeletion = useCallback((url: string | null) => {
    if (!url) return
    setPendingDeletions((urls) => [...urls, url])
  }, [])

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
            'id, name, package_weight_kg, total_price, price_per_kg, image_url, description, marketing_copy, highlight_badge'
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
          .select('urgency_blitz_mode, hero_image_url, hero_video_url')
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
          highlight_badge: p.highlight_badge ?? '',
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
                category: row.category,
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

  // Explicit mount guard rather than relying solely on `fetchAll`'s
  // useCallback identity staying stable across renders — fetches strictly
  // once on mount; a future edit to fetchAll's dependencies can't turn this
  // into a re-fetch loop.
  const hasFetchedRef = useRef(false)
  useEffect(() => {
    if (hasFetchedRef.current) return
    hasFetchedRef.current = true
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    if (!savedAt) return
    const id = setTimeout(() => setSavedAt(null), 2600)
    return () => clearTimeout(id)
  }, [savedAt])

  // useCallback with empty/stable deps throughout this block — every handler
  // that reaches a memoized child (GalleryManager below) needs a reference
  // that doesn't change on every render, or the memo boundary is pointless.
  const uploadToStoreMedia = useCallback(async (file: File, path: string): Promise<string | null> => {
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
  }, [])

  const handleHeroFile = useCallback(async (file: File) => {
    setUploadingHero(true)
    const url = await uploadToStoreMedia(file, buildMediaPath('hero/background', file))
    if (url) setHeroImageUrl(url)
    setUploadingHero(false)
  }, [uploadToStoreMedia])

  const handleHeroVideoFile = useCallback(async (file: File) => {
    setUploadingHeroVideo(true)
    const url = await uploadToStoreMedia(file, buildMediaPath('hero/video', file))
    if (url) setHeroVideoUrl(url)
    setUploadingHeroVideo(false)
  }, [uploadToStoreMedia])

  const handleProductFile = useCallback(async (productId: string, file: File) => {
    setUploadingProductId(productId)
    const url = await uploadToStoreMedia(file, buildMediaPath(`products/${productId}`, file))
    if (url) {
      setProducts((ps) => ps.map((p) => (p.id === productId ? { ...p, image_url: url } : p)))
    }
    setUploadingProductId(null)
  }, [uploadToStoreMedia])

  const handleGalleryFile = useCallback(async (slotIndex: number, file: File) => {
    setUploadingSlot(slotIndex)
    const url = await uploadToStoreMedia(file, buildMediaPath(`gallery/slot-${slotIndex}`, file))
    if (url) {
      setGallerySlots((gs) =>
        gs.map((g) => (g.slot_index === slotIndex ? { ...g, image_url: url } : g))
      )
    }
    setUploadingSlot(null)
  }, [uploadToStoreMedia])

  const updateGallerySlot = useCallback((slotIndex: number, patch: Partial<GalleryDraft>) => {
    setGallerySlots((gs) =>
      gs.map((g) => (g.slot_index === slotIndex ? { ...g, ...patch } : g))
    )
  }, [])

  const handleRemoveHeroImage = useCallback(() => {
    queueDeletion(heroImageUrl)
    setHeroImageUrl(null)
  }, [heroImageUrl, queueDeletion])

  const handleRemoveHeroVideo = useCallback(() => {
    queueDeletion(heroVideoUrl)
    setHeroVideoUrl(null)
  }, [heroVideoUrl, queueDeletion])


  const handleRemoveProductImage = useCallback((productId: string) => {
    setProducts((ps) => {
      const p = ps.find((x) => x.id === productId)
      if (p?.image_url) queueDeletion(p.image_url)
      return ps.map((x) => (x.id === productId ? { ...x, image_url: null } : x))
    })
  }, [queueDeletion])

  // Reads the current slot via the functional updater (not a `gallerySlots`
  // dependency) so this handler's identity stays stable across every
  // unrelated re-render — required for GalleryManager's React.memo to
  // actually skip re-rendering all 6 cards on renders that don't touch
  // gallery state (see the comment on GalleryManager above).
  const handleRemoveGalleryImage = useCallback((slotIndex: number) => {
    setGallerySlots((gs) => {
      const slot = gs.find((g) => g.slot_index === slotIndex)
      if (slot?.image_url) queueDeletion(slot.image_url)
      return gs.map((g) => (g.slot_index === slotIndex ? { ...g, image_url: null } : g))
    })
  }, [queueDeletion])

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
          highlight_badge: p.highlight_badge.trim() || null,
        })),
        harvestDate: todayStr,
        totalBoxQuota: total,
        remainingBoxes: remaining,
        urgencyBlitzMode,
        heroImageUrl,
        heroVideoUrl,
        gallerySlots: gallerySlots.map((g) => ({
          slot_index: g.slot_index,
          category: g.category,
          image_url: g.image_url,
          title: g.title,
          harvest_time: g.harvest_time,
          location_tag: g.location_tag,
        })),
        mediaUrlsToDelete: pendingDeletions,
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      setDailyBoxLimit(total)
      setBoxesRemaining(remaining)
      setPendingDeletions([])
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
                  <label className="block">
                    <span className="mb-1 block font-sans text-[11px] font-medium text-subtle">
                      Ürün Rozeti
                    </span>
                    <input
                      type="text"
                      value={p.highlight_badge}
                      onChange={(e) => {
                        const v = e.target.value
                        setProducts((ps) =>
                          ps.map((x, xi) => (xi === i ? { ...x, highlight_badge: v } : x))
                        )
                      }}
                      placeholder="ör. En Popüler — boş bırakırsan rozet gösterilmez"
                      className="w-full rounded-lg border border-border bg-background px-3 py-3 font-sans text-sm text-text outline-none focus:border-primary"
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
              onRemove={handleRemoveHeroImage}
            />
            <VideoUploadRow
              label="Hero Arkaplan Videosu"
              hint="Varsa görselin yerine sessiz, otomatik oynatılan video gösterilir."
              videoUrl={heroVideoUrl}
              uploading={uploadingHeroVideo}
              onFileSelected={handleHeroVideoFile}
              onRemove={handleRemoveHeroVideo}
            />
            {products.map((p) => (
              <ImageUploadRow
                key={p.id}
                label={`${p.name} · ${p.package_weight_kg} kg`}
                imageUrl={p.image_url}
                uploading={uploadingProductId === p.id}
                onFileSelected={(file) => handleProductFile(p.id, file)}
                onRemove={() => handleRemoveProductImage(p.id)}
              />
            ))}
          </div>
        </SectionCard>

        <GalleryManager
          gallerySlots={gallerySlots}
          uploadingSlot={uploadingSlot}
          onFileSelected={handleGalleryFile}
          onUpdateSlot={updateGallerySlot}
          onRemoveImage={handleRemoveGalleryImage}
        />

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
