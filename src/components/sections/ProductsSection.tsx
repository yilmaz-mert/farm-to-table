'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion'
import { Minus, Plus, Check, CalendarClock } from 'lucide-react'
import { useCartStore, type CartItem } from '@/store/cart'
import { useUIStore } from '@/store/ui'
import { formatPrice } from '@/lib/utils'
import { getBlackoutInfo } from '@/lib/harvest'

const ease: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]

interface Package {
  productId: string
  variantId: string
  name: string
  slug: string
  variant: string
  weightGrams: number
  priceInKurus: number
  description: string
  highlight: string | null
  /** Admin-uploaded photo (see /admin/settings) — null until one is set,
   *  in which case the card shows a decorative gradient instead. */
  imageUrl: string | null
  /** Decorative fallback shown until an admin uploads a real photo. */
  art: string
}

const PACKAGES: Package[] = [
  {
    productId: 'organik-kiraz',
    variantId: 'kiraz-1kg-deneme',
    name: 'Organik Kiraz',
    slug: 'organik-kiraz',
    variant: '1 KG Deneme Kutusu',
    weightGrams: 1000,
    priceInKurus: 47900,
    description: 'İlk tanışma için ideal. Tek sıra dizilmiş, 26 mm+ kalibre kiraz.',
    highlight: null,
    imageUrl: null,
    art: 'linear-gradient(135deg, oklch(36% 0.16 22), oklch(19% 0.09 22) 60%, oklch(26% 0.07 192))',
  },
  {
    productId: 'organik-kiraz',
    variantId: 'kiraz-2kg-ozel',
    name: 'Organik Kiraz',
    slug: 'organik-kiraz',
    variant: '2 KG Özel Kutu',
    weightGrams: 2000,
    priceInKurus: 84900,
    description: 'En çok tercih edilen boy. Çift katman EPS kutuda, jel buzlu.',
    highlight: 'En Popüler',
    imageUrl: null,
    art: 'linear-gradient(145deg, oklch(54% 0.17 18), oklch(28% 0.13 22) 65%)',
  },
  {
    productId: 'organik-visne',
    variantId: 'visne-3kg-mutfak',
    name: 'Organik Vişne',
    slug: 'organik-visne',
    variant: '3 KG Mutfak Kutusu',
    weightGrams: 3000,
    priceInKurus: 99000,
    description: 'Reçel, şerbet ve dondurmalık — asidi yüksek, aroması derin.',
    highlight: null,
    imageUrl: null,
    art: 'linear-gradient(150deg, oklch(76% 0.09 192), oklch(35% 0.09 192) 75%)',
  },
  {
    productId: 'organik-kiraz',
    variantId: 'kiraz-5kg-aile',
    name: 'Organik Kiraz',
    slug: 'organik-kiraz',
    variant: '5 KG Aile Kutusu',
    weightGrams: 5000,
    priceInKurus: 189000,
    description: 'Kalabalık sofralar ve reçellik ayırmak isteyenler için.',
    highlight: 'Kilo Başı Avantaj',
    imageUrl: null,
    art: 'linear-gradient(140deg, oklch(66% 0.13 16), oklch(36% 0.16 22) 70%, oklch(19% 0.09 22))',
  },
]

function ProductCard({ pkg, index }: { pkg: Package; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-64px 0px' })
  const reduced = useReducedMotion() ?? false

  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const openCartDrawer = useUIStore((s) => s.openCartDrawer)

  const lineTotal = pkg.priceInKurus * qty

  function handleAdd() {
    const item: CartItem = {
      id: pkg.variantId,
      productId: pkg.productId,
      variantId: pkg.variantId,
      name: pkg.name,
      slug: pkg.slug,
      variant: pkg.variant,
      priceInKurus: pkg.priceInKurus,
      quantity: qty,
      unit: 'kg',
      imageUrl: pkg.imageUrl,
    }
    addItem(item)
    setAdded(true)
    openCartDrawer()
    setQty(1)
  }

  // Reset the confirmation state after a short beat
  useEffect(() => {
    if (!added) return
    const id = setTimeout(() => setAdded(false), 2000)
    return () => clearTimeout(id)
  }, [added])

  return (
    <motion.article
      ref={ref}
      initial={reduced ? false : { opacity: 0, y: 26 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: reduced ? 0 : index * 0.1, ease }}
      className="relative flex flex-col rounded-2xl border border-border bg-surface shadow-sm"
    >
      {/* Highlight ribbon — the article itself must NOT have overflow-hidden,
          or this -top-3 offset (positioned above the card's own top edge)
          gets clipped by it. Only the image container below needs clipping,
          for its own corner rounding. */}
      {pkg.highlight && (
        <span className="absolute -top-3 left-6 z-10 rounded-full bg-cta px-3 py-1 font-sans text-[11px] font-semibold text-inverted shadow-sm">
          {pkg.highlight}
        </span>
      )}

      {/* Package photo — admin-uploaded (see /admin/settings), gradient
          placeholder until one is set. Fixed aspect ratio guarantees zero
          layout shift either way. rounded-t-2xl + overflow-hidden here
          (not on the article) matches the card's top corners without
          clipping the ribbon above. */}
      <div
        className="relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl"
        style={{ background: pkg.art }}
      >
        {pkg.imageUrl && (
          <Image
            src={pkg.imageUrl}
            alt={`${pkg.name} — ${pkg.variant}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
            quality={80}
            className="object-cover"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        {/* Product identity */}
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-accent">
          {pkg.name}
        </p>
        <h3 className="mt-1.5 font-serif text-2xl font-medium italic text-text lining-nums">
          {pkg.variant}
        </h3>
        <p className="mt-2.5 min-h-10 font-sans text-sm leading-relaxed text-muted">
          {pkg.description}
        </p>

        {/* Unit price */}
        <p className="mt-5 font-sans text-xs text-subtle">
          Kutu fiyatı{' '}
          <span className="font-mono text-sm font-medium text-muted">
            {formatPrice(pkg.priceInKurus)}
          </span>
        </p>

        {/* Quantity + live total */}
        <div className="mt-3 flex items-center justify-between gap-4">
          <div
            className="flex items-center rounded-lg border border-border"
            role="group"
            aria-label={`${pkg.variant} adet seçimi`}
          >
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-l-lg text-text transition-colors hover:bg-raised disabled:opacity-35 disabled:pointer-events-none"
              aria-label="Adedi azalt"
            >
              <Minus className="h-3.5 w-3.5" aria-hidden />
            </button>
            <span
              className="flex h-9 w-9 items-center justify-center border-x border-border font-mono text-sm font-semibold text-text tabular-nums"
              aria-live="polite"
            >
              {qty}
            </span>
            <button
              onClick={() => setQty((q) => Math.min(9, q + 1))}
              disabled={qty >= 9}
              className="flex h-9 w-9 items-center justify-center rounded-r-lg text-text transition-colors hover:bg-raised disabled:opacity-35 disabled:pointer-events-none"
              aria-label="Adedi artır"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>

          {/* Live total — ticks over as qty changes */}
          <div className="text-right">
            <AnimatePresence mode="wait">
              <motion.span
                key={lineTotal}
                initial={reduced ? false : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: 6 }}
                transition={{ duration: 0.14, ease: 'easeOut' }}
                className="inline-block font-mono text-xl font-semibold text-primary tabular-nums"
              >
                {formatPrice(lineTotal)}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* Add to cart */}
        <motion.button
          onClick={handleAdd}
          whileTap={reduced ? undefined : { scale: 0.97 }}
          className={`mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-lg font-sans text-sm font-semibold shadow-sm transition-colors duration-200 ${
            added
              ? 'bg-accent text-inverted'
              : 'bg-primary text-inverted hover:bg-primary-hover'
          }`}
          aria-live="polite"
        >
          {added ? (
            <>
              <Check className="h-4 w-4" aria-hidden />
              Sepete Eklendi
            </>
          ) : (
            'Sepete Ekle'
          )}
        </motion.button>
      </div>
    </motion.article>
  )
}

export interface ProductContent {
  priceInKurus: number
  /** Main product title (mono caption + cart/checkout item name), e.g.
   *  "Organik Kiraz · 1 kg" — fully admin-editable, no hardcoded fruit name. */
  name: string
  /** Package variant title shown as the card heading, e.g. "1 KG Deneme Kutusu" */
  variantTitle: string
  /** Marketing sentence shown below the heading */
  description: string
  /** Ribbon text (e.g. "En Popüler") — null/empty means no ribbon. No
   *  fallback to the hardcoded highlight: this is how an admin actually
   *  hides a ribbon that used to be there. */
  highlightBadge: string | null
  /** Admin-uploaded package photo — null shows the gradient placeholder. */
  imageUrl: string | null
}

interface ProductsSectionProps {
  /** Live content from `products`, keyed by `weightGrams` — falls back to the
   *  hardcoded PACKAGES fields when a weight has no matching DB row. Each
   *  package's title is an independent string with no shared substitution. */
  dbContent?: Record<number, ProductContent>
}

export function ProductsSection({ dbContent }: ProductsSectionProps) {
  const hdrRef = useRef<HTMLDivElement>(null)
  const hdrInView = useInView(hdrRef, { once: true, margin: '-80px 0px' })
  const reduced = useReducedMotion() ?? false

  // Blackout state is time-dependent — resolve client-side to avoid SSR drift
  const [blackoutNotice, setBlackoutNotice] = useState<string | null>(null)
  useEffect(() => {
    setBlackoutNotice(getBlackoutInfo().notice)
  }, [])

  const packages = dbContent
    ? PACKAGES.map((pkg) => {
        const content = dbContent[pkg.weightGrams]
        return content
          ? {
              ...pkg,
              priceInKurus: content.priceInKurus,
              name: content.name || pkg.name,
              variant: content.variantTitle || pkg.variant,
              description: content.description || pkg.description,
              // No `||` fallback — an admin clearing this field to hide a
              // ribbon must actually hide it, not resurrect the hardcoded one.
              highlight: content.highlightBadge,
              imageUrl: content.imageUrl,
            }
          : pkg
      })
    : PACKAGES

  return (
    <section id="urunler" className="bg-background py-24 scroll-mt-24">
      <div className="container-page">
        {/* Header */}
        <div ref={hdrRef} className="mb-12 max-w-2xl">
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={hdrInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, ease }}
            className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.18em] text-accent"
          >
            Bugünün hasadı
          </motion.p>
          <motion.h2
            initial={reduced ? false : { opacity: 0, y: 22 }}
            animate={hdrInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay: reduced ? 0 : 0.1, ease }}
            className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-light italic leading-tight text-text"
          >
            Kutunu seç,
            <br />
            <span className="text-primary">sabah hasadından ayrılsın.</span>
          </motion.h2>
        </div>

        {/* Weekend blackout notice */}
        <AnimatePresence>
          {blackoutNotice && (
            <motion.div
              initial={reduced ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease }}
              className="mb-8 flex items-start gap-3 rounded-xl border border-border-brand bg-cherry-wash p-4"
              role="status"
            >
              <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="font-sans text-sm font-semibold text-primary">
                  Hafta Sonu Taze Koruması
                </p>
                <p className="mt-0.5 font-sans text-sm text-muted">{blackoutNotice}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product grid */}
        <div className="grid gap-6 pt-3 sm:grid-cols-2 lg:grid-cols-4">
          {packages.map((pkg, i) => (
            <ProductCard key={pkg.variantId} pkg={pkg} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
