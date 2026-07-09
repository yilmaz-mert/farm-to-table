'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion'
import { QrCode, Clock, Map, Users, Fingerprint } from 'lucide-react'
import { useIsMobile } from '@/hooks/useIsMobile'

const ease: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]

/**
 * Deterministic 13×13 pseudo-QR pattern (finder squares + fixed data bits).
 * Hardcoded — never randomised — so server and client render identically.
 */
const QR_SIZE = 13
const QR_PATTERN: number[] = (() => {
  const grid = new Array<number>(QR_SIZE * QR_SIZE).fill(0)
  const set = (x: number, y: number) => {
    grid[y * QR_SIZE + x] = 1
  }
  // Three finder squares (7×7 rings at three corners)
  const finder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const ring =
          x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4)
        if (ring) set(ox + x, oy + y)
      }
    }
  }
  finder(0, 0)
  finder(QR_SIZE - 7, 0)
  finder(0, QR_SIZE - 7)
  // Fixed "data" bits — an arbitrary but stable arrangement
  const bits: Array<[number, number]> = [
    [8, 1], [10, 2], [8, 3], [9, 4], [11, 4], [8, 5],
    [1, 8], [3, 8], [5, 8], [7, 8], [9, 8], [11, 8],
    [8, 9], [10, 9], [12, 9], [9, 10], [11, 10],
    [8, 11], [10, 11], [12, 11], [9, 12], [11, 12], [7, 10], [7, 12],
  ]
  bits.forEach(([x, y]) => set(x, y))
  return grid
})()

const TRACE_FIELDS = [
  {
    Icon: Clock,
    label: 'Hasat saati',
    value: '06:42 — sabah serinliğinde',
  },
  {
    Icon: Map,
    label: 'Bahçe parseli',
    value: 'Kuzey Yamaç, Parsel 3 (1.150 m rakım)',
  },
  {
    Icon: Users,
    label: 'Toplayan ekip',
    value: 'Ayşe Usta ekibi — 4 kişi',
  },
]

export function TransparencySection() {
  const secRef = useRef<HTMLDivElement>(null)
  const inView = useInView(secRef, { once: true, margin: '-80px 0px' })
  const reducedMotion = useReducedMotion() ?? false
  const isMobile = useIsMobile()
  // On mobile this also simplifies the tap-triggered QR reveal panel below
  // (skips the `height: auto` animation, which forces layout on every
  // frame) down to a plain opacity fade.
  const reduced = reducedMotion || isMobile
  const [revealed, setRevealed] = useState(false)

  return (
    <section className="bg-background py-24">
      <div className="container-page">
        <div
          ref={secRef}
          className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20"
        >
          {/* ── Copy side ─────────────────────────────────────── */}
          <div>
            <motion.p
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, ease }}
              className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.18em] text-accent"
            >
              Tam izlenebilirlik
            </motion.p>
            <motion.h2
              initial={reduced ? false : { opacity: 0, y: 22 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, delay: reduced ? 0 : 0.1, ease }}
              className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-light italic leading-tight text-text"
            >
              Her kutunun
              <br />
              <span className="text-primary">bir kimliği var.</span>
            </motion.h2>
            <motion.p
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: reduced ? 0 : 0.22, ease }}
              className="mt-6 max-w-md font-sans text-base leading-relaxed text-muted"
            >
              Kutunuzun üzerindeki QR kodu okutun; meyvenizin hangi sabah, hangi
              parselden, hangi ekibin elinden geçtiğini saniyesiyle görün.
              Sakladığımız hiçbir şey yok — çünkü gerek yok.
            </motion.p>

            <motion.div
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: reduced ? 0 : 0.34, ease }}
              className="mt-8 flex items-center gap-2.5 font-sans text-sm text-subtle"
            >
              <Fingerprint className="h-4 w-4 text-accent" aria-hidden />
              Her kod tek kutuya özeldir; iki kez üretilmez.
            </motion.div>
          </div>

          {/* ── Interactive QR card ───────────────────────────── */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: reduced ? 0 : 0.2, ease }}
          >
            <motion.button
              onClick={() => setRevealed((v) => !v)}
              onHoverStart={() => setRevealed(true)}
              onHoverEnd={() => setRevealed(false)}
              whileTap={reduced ? undefined : { scale: 0.985 }}
              className="group relative block w-full overflow-hidden rounded-2xl border border-border bg-surface p-8 text-left shadow-lg"
              aria-expanded={revealed}
              aria-label="QR kod deneyimi önizlemesi — hasat detaylarını göster"
            >
              <div className="flex items-start justify-between gap-6">
                {/* Pseudo-QR */}
                <div className="shrink-0 rounded-xl border border-border bg-surface p-3">
                  <div
                    className="grid gap-[2px]"
                    style={{ gridTemplateColumns: `repeat(${QR_SIZE}, 8px)` }}
                    aria-hidden
                  >
                    {QR_PATTERN.map((on, i) => (
                      <span
                        key={i}
                        className={`h-2 w-2 rounded-[1px] transition-colors duration-300 ${
                          on
                            ? revealed
                              ? 'bg-accent'
                              : 'bg-text'
                            : 'bg-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 text-right">
                  <QrCode className="h-5 w-5 text-accent" aria-hidden />
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">
                    Kutu No
                  </p>
                  <p className="font-mono text-sm font-semibold text-text">
                    DK-2025-0611-0389
                  </p>
                </div>
              </div>

              {/* Reveal panel */}
              <AnimatePresence initial={false}>
                {revealed && (
                  <motion.div
                    key="trace"
                    initial={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                    animate={reduced ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                    exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, ease }}
                    className="overflow-hidden"
                  >
                    <div className="mt-7 flex flex-col gap-4 border-t border-border pt-6">
                      {TRACE_FIELDS.map(({ Icon, label, value }, i) => (
                        <motion.div
                          key={label}
                          initial={reduced ? false : { opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.35, delay: reduced ? 0 : 0.1 + i * 0.08, ease }}
                          className="flex items-center gap-3.5"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cherry-wash">
                            <Icon className="h-4 w-4 text-primary" aria-hidden />
                          </div>
                          <div>
                            <p className="font-sans text-[11px] font-medium uppercase tracking-wide text-subtle">
                              {label}
                            </p>
                            <p className="font-sans text-sm font-medium text-text">{value}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Idle hint */}
              {!revealed && (
                <p className="mt-6 font-sans text-xs text-subtle">
                  Detayları görmek için dokunun veya üzerine gelin
                </p>
              )}
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
