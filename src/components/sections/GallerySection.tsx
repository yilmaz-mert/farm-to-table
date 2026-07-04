'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion'
import { X, Camera, Package, Cherry } from 'lucide-react'

const ease: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]

type ShotKind = 'harvest' | 'unboxing'

interface Shot {
  id: string
  kind: ShotKind
  title: string
  caption: string
  time: string
  /**
   * Swap-ready: replace `art` gradients with real photos via next/image
   * (fill + sizes + placeholder="blur") — aspect ratio is already fixed
   * by the card container, so the change is zero-CLS.
   */
  art: string
}

const SHOTS: Shot[] = [
  {
    id: 'shot-0611-01',
    kind: 'harvest',
    title: 'Günün ilk kasası',
    caption: 'Kuzey Yamaç parselinde sabah 06:30 — çiy hâlâ dalların üzerinde.',
    time: 'Bu sabah 06:38',
    art: 'linear-gradient(135deg, oklch(36% 0.16 22), oklch(19% 0.09 22) 60%, oklch(26% 0.07 192))',
  },
  {
    id: 'shot-0611-02',
    kind: 'harvest',
    title: 'Kalibrasyon bandı',
    caption: '26 mm altı hiçbir kiraz kutuya girmez — bant hepsini tek tek ölçer.',
    time: 'Bu sabah 08:15',
    art: 'linear-gradient(160deg, oklch(44% 0.11 192), oklch(17% 0.045 192) 70%)',
  },
  {
    id: 'shot-0611-03',
    kind: 'unboxing',
    title: '“Kokusu odayı sardı”',
    caption: 'Zeynep A., İstanbul — 2 KG Özel Kutu ile ikinci siparişi.',
    time: 'Dün 19:04',
    art: 'linear-gradient(145deg, oklch(54% 0.17 18), oklch(28% 0.13 22) 65%)',
  },
  {
    id: 'shot-0611-04',
    kind: 'harvest',
    title: 'Jel buz yerleşimi',
    caption: 'Her kutuya çift kat jel buz — soğuk zincir kapınıza kadar kırılmaz.',
    time: 'Bu sabah 09:47',
    art: 'linear-gradient(150deg, oklch(76% 0.09 192), oklch(35% 0.09 192) 75%)',
  },
  {
    id: 'shot-0611-05',
    kind: 'unboxing',
    title: '“Çocuklar bayıldı”',
    caption: 'Murat K., Ankara — 5 KG Aile Kutusu, ertesi gün teslim.',
    time: 'Dün 21:30',
    art: 'linear-gradient(140deg, oklch(66% 0.13 16), oklch(36% 0.16 22) 70%, oklch(19% 0.09 22))',
  },
  {
    id: 'shot-0611-06',
    kind: 'harvest',
    title: 'Vişne parseli',
    caption: 'Güney yamacın vişneleri bir hafta sonra tam olgunlukta olacak.',
    time: 'Bu sabah 11:02',
    art: 'linear-gradient(155deg, oklch(45% 0.18 20), oklch(11% 0.05 22) 80%)',
  },
]

const KIND_META: Record<ShotKind, { label: string; Icon: typeof Camera }> = {
  harvest: { label: 'Bahçeden', Icon: Cherry },
  unboxing: { label: 'Kutu Açılışı', Icon: Package },
}

function Lightbox({ shot, onClose }: { shot: Shot; onClose: () => void }) {
  const reduced = useReducedMotion() ?? false
  const closeRef = useRef<HTMLButtonElement>(null)
  const { label, Icon } = KIND_META[shot.kind]

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
          <button
            ref={closeRef}
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-bark-900/50 text-white backdrop-blur-sm transition-colors hover:bg-bark-900/70"
            aria-label="Görseli kapat"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
          <span className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-bark-900/50 px-3 py-1 font-sans text-xs font-medium text-white backdrop-blur-sm">
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
            {shot.caption}
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
  const inView = useInView(ref, { once: true, margin: '-56px 0px' })
  const reduced = useReducedMotion() ?? false
  const { label, Icon } = KIND_META[shot.kind]

  return (
    <motion.button
      ref={ref}
      onClick={onOpen}
      initial={reduced ? false : { opacity: 0, y: 22 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: reduced ? 0 : (index % 3) * 0.09, ease }}
      whileHover={reduced ? undefined : { y: -4 }}
      whileTap={reduced ? undefined : { scale: 0.98 }}
      className="group relative block overflow-hidden rounded-xl text-left shadow-sm"
      aria-label={`${shot.title} — büyüt`}
    >
      {/* Fixed aspect ratio guarantees zero layout shift */}
      <div className="relative aspect-square w-full" style={{ background: shot.art }}>
        {/* Kind chip */}
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

export function GallerySection() {
  const hdrRef = useRef<HTMLDivElement>(null)
  const hdrInView = useInView(hdrRef, { once: true, margin: '-80px 0px' })
  const reduced = useReducedMotion() ?? false
  const [openShot, setOpenShot] = useState<Shot | null>(null)

  return (
    <section className="bg-sunken py-24">
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
          {SHOTS.map((shot, i) => (
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
