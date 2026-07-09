'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion'
import { X, Camera, Package, Cherry } from 'lucide-react'
import { useIsMobile } from '@/hooks/useIsMobile'
import { cn, shimmerBlurDataURL } from '@/lib/utils'

const ease: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]
const GALLERY_BLUR = shimmerBlurDataURL(300, 300)

type GalleryCategory = 'bahceden' | 'kutu_acilisi' | 'hasat_ani'

interface Shot {
  id: string
  /** Chosen from a fixed admin dropdown (see /admin/settings) — icon and
   *  label are both derived from this single value, so they can't drift
   *  out of sync the way a freeform label + separate icon field could. */
  category: string
  title: string
  locationTag: string
  time: string
  imageUrl: string | null
  /**
   * Decorative fallback shown until an admin uploads a real photo for this
   * slot (see /admin/settings gallery editor) — aspect ratio is already
   * fixed by the card container, so swapping in `imageUrl` is zero-CLS.
   */
  art: string
}

/** Gradient fallback per grid position, used when a slot has no image_url yet. */
const SLOT_ART = [
  'linear-gradient(135deg, oklch(36% 0.16 22), oklch(19% 0.09 22) 60%, oklch(26% 0.07 192))',
  'linear-gradient(160deg, oklch(44% 0.11 192), oklch(17% 0.045 192) 70%)',
  'linear-gradient(145deg, oklch(54% 0.17 18), oklch(28% 0.13 22) 65%)',
  'linear-gradient(150deg, oklch(76% 0.09 192), oklch(35% 0.09 192) 75%)',
  'linear-gradient(140deg, oklch(66% 0.13 16), oklch(36% 0.16 22) 70%, oklch(19% 0.09 22))',
  'linear-gradient(155deg, oklch(45% 0.18 20), oklch(11% 0.05 22) 80%)',
]

const SHOTS: Shot[] = [
  {
    id: 'shot-0611-01',
    category: 'bahceden',
    title: 'Günün ilk kasası',
    locationTag: 'Kuzey Yamaç, Parsel 3',
    time: 'Bu sabah 06:38',
    imageUrl: null,
    art: SLOT_ART[0],
  },
  {
    id: 'shot-0611-02',
    category: 'bahceden',
    title: 'Kalibrasyon bandı',
    locationTag: 'Paketleme Tesisi',
    time: 'Bu sabah 08:15',
    imageUrl: null,
    art: SLOT_ART[1],
  },
  {
    id: 'shot-0611-03',
    category: 'kutu_acilisi',
    title: '“Kokusu odayı sardı”',
    locationTag: 'İstanbul',
    time: 'Dün 19:04',
    imageUrl: null,
    art: SLOT_ART[2],
  },
  {
    id: 'shot-0611-04',
    category: 'bahceden',
    title: 'Jel buz yerleşimi',
    locationTag: 'Paketleme Tesisi',
    time: 'Bu sabah 09:47',
    imageUrl: null,
    art: SLOT_ART[3],
  },
  {
    id: 'shot-0611-05',
    category: 'kutu_acilisi',
    title: '“Çocuklar bayıldı”',
    locationTag: 'Ankara',
    time: 'Dün 21:30',
    imageUrl: null,
    art: SLOT_ART[4],
  },
  {
    id: 'shot-0611-06',
    category: 'bahceden',
    title: 'Vişne parseli',
    locationTag: 'Güney Yamaç, Parsel 7',
    time: 'Bu sabah 11:02',
    imageUrl: null,
    art: SLOT_ART[5],
  },
]

const CATEGORY_META: Record<GalleryCategory, { label: string; Icon: typeof Camera }> = {
  bahceden: { label: 'Bahçeden', Icon: Cherry },
  kutu_acilisi: { label: 'Kutu Açılışı', Icon: Package },
  hasat_ani: { label: 'Hasat Anı', Icon: Camera },
}

/** Storefront reads whatever string is in the DB — resolve defensively so
 *  a stale/legacy value (e.g. from before this category was introduced)
 *  falls back cleanly instead of crashing on an unrecognized key. */
function resolveCategoryMeta(category: string): { label: string; Icon: typeof Camera } {
  return CATEGORY_META[category as GalleryCategory] ?? CATEGORY_META.bahceden
}

function Lightbox({ shot, onClose }: { shot: Shot; onClose: () => void }) {
  const reducedMotion = useReducedMotion() ?? false
  const isMobile = useIsMobile()
  // Mobile gets a plain opacity fade — no scale/translate transform to
  // composite during the gesture that opened it.
  const reduced = reducedMotion || isMobile
  const closeRef = useRef<HTMLButtonElement>(null)
  const { label, Icon } = resolveCategoryMeta(shot.category)

  useEffect(() => {
    closeRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    // Lock page scroll while open
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = prev
    }
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-bark-900/70 p-4 backdrop-blur-sm dark:bg-cherry-950/80"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={shot.title}
    >
      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reduced ? undefined : { opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.3, ease }}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Visual */}
        <div className="relative aspect-square w-full" style={{ background: shot.art }}>
          {shot.imageUrl && (
            <Image
              src={shot.imageUrl}
              alt={shot.title}
              fill
              sizes="(max-width: 640px) 100vw, 512px"
              quality={80}
              placeholder="blur"
              blurDataURL={GALLERY_BLUR}
              className="object-cover"
            />
          )}
          <button
            ref={closeRef}
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-bark-900/50 text-white backdrop-blur-sm transition-colors hover:bg-bark-900/70"
            aria-label="Görseli kapat"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
          <span className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-bark-900/45 px-3 py-1 font-sans text-xs font-medium text-white backdrop-blur-sm">
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
          </span>
        </div>

        {/* Caption */}
        <div className="p-5">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-sans text-base font-semibold text-text">{shot.title}</h3>
            <span className="shrink-0 font-mono text-[11px] text-subtle">{shot.time}</span>
          </div>
          <p className="mt-1.5 font-sans text-sm leading-relaxed text-muted">
            {shot.locationTag}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

function GalleryCard({
  shot,
  index,
  onOpen,
}: {
  shot: Shot
  index: number
  onOpen: () => void
}) {
  const ref = useRef<HTMLButtonElement>(null)
  // Trigger a bit earlier on mobile so the (simplified) reveal is done
  // scrolling into view rather than animating mid-scroll.
  const inView = useInView(ref, { once: true, margin: '-56px 0px' })
  const reducedMotion = useReducedMotion() ?? false
  const isMobile = useIsMobile()
  // Mobile: skip the y-translate + per-card stagger entirely (both force
  // a compositor layer + main-thread work on every scroll tick on
  // low-power devices) — just a plain, instant-ish opacity fade.
  const reduced = reducedMotion || isMobile
  const { label, Icon } = resolveCategoryMeta(shot.category)

  return (
    <motion.button
      ref={ref}
      onClick={onOpen}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 22 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: reduced ? 0.3 : 0.55, delay: reduced ? 0 : (index % 3) * 0.09, ease }}
      whileHover={reduced ? undefined : { y: -4 }}
      whileTap={reducedMotion ? undefined : { scale: 0.98 }}
      className={cn(
        'group relative block overflow-hidden rounded-xl text-left shadow-sm',
        !reduced && 'will-change-transform'
      )}
      aria-label={`${shot.title} — büyüt`}
    >
      {/* Fixed aspect ratio guarantees zero layout shift */}
      <div className="relative aspect-square w-full" style={{ background: shot.art }}>
        {shot.imageUrl && (
          // next/image: lazy by default, generates a real responsive srcset
          // and re-encodes to WebP via sharp — a raw multi-MB phone photo
          // never ships to the browser at full size just to fill this
          // small grid cell. `fill` inside the already aspect-locked
          // parent keeps this a guaranteed zero-CLS layout. Sizes match the
          // actual rendered width per breakpoint (2-col grid below `sm`,
          // 3-col from `sm` up) rather than a flat 100vw, which would
          // needlessly ship a full-width image for a half-width mobile slot.
          <Image
            src={shot.imageUrl}
            alt={shot.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
            quality={80}
            loading="lazy"
            placeholder="blur"
            blurDataURL={GALLERY_BLUR}
            className="object-cover"
          />
        )}
        {/* Category chip */}
        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-bark-900/45 px-2.5 py-1 font-sans text-[11px] font-medium text-white backdrop-blur-sm">
          <Icon className="h-3 w-3" aria-hidden />
          {label}
        </span>

        {/* Bottom gradient + caption */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bark-900/75 to-transparent p-4 pt-10">
          <p className="font-sans text-sm font-semibold text-white">{shot.title}</p>
          <p className="mt-0.5 font-mono text-[10px] text-white/70">{shot.time}</p>
        </div>
      </div>
    </motion.button>
  )
}

export interface GalleryShotContent {
  category: string
  title: string
  harvestTime: string
  locationTag: string
  imageUrl: string | null
}

interface GallerySectionProps {
  /** Live rows from `gallery_shots`, ordered by slot_index — falls back to
   *  the hardcoded SHOTS array (by grid position) when a slot is missing. */
  shots?: GalleryShotContent[]
}

export function GallerySection({ shots: dbShots }: GallerySectionProps) {
  const hdrRef = useRef<HTMLDivElement>(null)
  const hdrInView = useInView(hdrRef, { once: true, margin: '-80px 0px' })
  const reducedMotion = useReducedMotion() ?? false
  const isMobile = useIsMobile()
  const reduced = reducedMotion || isMobile
  const [openShot, setOpenShot] = useState<Shot | null>(null)

  const shots =
    dbShots && dbShots.length > 0
      ? dbShots.map((s, i) => ({
          id: SHOTS[i]?.id ?? `gallery-slot-${i + 1}`,
          category: s.category || SHOTS[i]?.category || 'bahceden',
          title: s.title || SHOTS[i]?.title || '',
          time: s.harvestTime || SHOTS[i]?.time || '',
          locationTag: s.locationTag || SHOTS[i]?.locationTag || '',
          imageUrl: s.imageUrl,
          art: SLOT_ART[i % SLOT_ART.length],
        }))
      : SHOTS

  return (
    <section id="bahce" className="bg-sunken py-24 scroll-mt-24">
      <div className="container-page">
        {/* Header */}
        <div ref={hdrRef} className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <motion.p
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={hdrInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, ease }}
              className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.18em] text-accent"
            >
              Canlı akış
            </motion.p>
            <motion.h2
              initial={reduced ? false : { opacity: 0, y: 22 }}
              animate={hdrInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, delay: reduced ? 0 : 0.1, ease }}
              className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-light italic leading-tight text-text"
            >
              Bugün <span className="text-primary">bahçeden kareler.</span>
            </motion.h2>
          </div>
          <motion.p
            initial={reduced ? false : { opacity: 0 }}
            animate={hdrInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: reduced ? 0 : 0.25 }}
            className="flex items-center gap-2 font-sans text-sm text-muted"
          >
            <Camera className="h-4 w-4 text-accent" aria-hidden />
            Her sabah hasat ekibi tarafından güncellenir
          </motion.p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {shots.map((shot, i) => (
            <GalleryCard
              key={shot.id}
              shot={shot}
              index={i}
              onOpen={() => setOpenShot(shot)}
            />
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {openShot && <Lightbox shot={openShot} onClose={() => setOpenShot(null)} />}
      </AnimatePresence>
    </section>
  )
}
