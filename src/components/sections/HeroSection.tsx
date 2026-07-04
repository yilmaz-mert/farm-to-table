'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

const ease: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]

// Split into two visual lines for cinematic stagger
const LINE_ONE = ['Sabah', 'Dalında,']
const LINE_TWO = ['Akşam', 'Kapınızda.']

function WordReveal({
  word,
  isAccent = false,
  delay,
  reduced,
}: {
  word: string
  isAccent?: boolean
  delay: number
  reduced: boolean
}) {
  return (
    // Clip wrapper prevents blurred/translated text peeking out
    <span className="inline-block overflow-hidden">
      <motion.span
        className={`inline-block${isAccent ? ' text-primary' : ''}`}
        initial={reduced ? false : { opacity: 0, y: 36, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.72, delay, ease }}
      >
        {word}
      </motion.span>
    </span>
  )
}

export function HeroSection() {
  const reduced = useReducedMotion() ?? false

  const baseDelay = reduced ? 0 : 0.18
  const wordGap = reduced ? 0 : 0.1

  // Word timing index → absolute delay
  const d = (i: number) => baseDelay + i * wordGap

  return (
    <section className="relative flex min-h-[calc(100svh-4rem)] flex-col justify-center bg-background py-24">
      <div className="container-page">
        {/* Season pill */}
        <motion.div
          className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-border-brand bg-cherry-wash px-4 py-1.5"
          initial={reduced ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0, ease }}
        >
          <span className="h-2 w-2 rounded-full bg-cta" aria-hidden />
          <span className="font-sans text-sm font-medium text-primary">
            2025 Hasat Sezonu Açık — Stok Sınırlı
          </span>
        </motion.div>

        {/* Main headline — staggered word reveals */}
        <h1
          className="font-serif text-[clamp(3.2rem,10.5vw,8.5rem)] font-light italic leading-[0.88] tracking-[-0.01em] text-text"
          aria-label="Sabah Dalında, Akşam Kapınızda."
        >
          {/* Line 1 */}
          <span className="flex flex-wrap gap-x-[0.28em]">
            {LINE_ONE.map((word, i) => (
              <WordReveal key={word} word={word} delay={d(i)} reduced={reduced} />
            ))}
          </span>

          {/* Line 2 — last word carries the verdigris bar */}
          <span className="flex flex-wrap gap-x-[0.28em]">
            {LINE_TWO.map((word, i) => {
              const isLast = i === LINE_TWO.length - 1
              return (
                <span key={word} className="inline-block overflow-hidden">
                  <motion.span
                    className={`inline-block${isLast ? ' relative text-primary' : ''}`}
                    initial={reduced ? false : { opacity: 0, y: 36, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.72, delay: d(LINE_ONE.length + i), ease }}
                  >
                    {word}
                    {/* Signature verdigris bar — draws left-to-right after word lands */}
                    {isLast && (
                      <motion.span
                        className="absolute -bottom-1 left-0 h-[3px] w-full origin-left rounded-full bg-accent"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{
                          duration: 0.55,
                          delay: d(LINE_ONE.length + i) + 0.5,
                          ease,
                        }}
                        aria-hidden
                      />
                    )}
                  </motion.span>
                </span>
              )
            })}
          </span>
        </h1>

        {/* Sub-copy */}
        <motion.p
          className="mt-10 max-w-lg font-sans text-lg leading-relaxed text-muted"
          initial={reduced ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: reduced ? 0 : 0.82, ease }}
        >
          Karadeniz yüksek irtifa bahçelerinden hasat edilen sertifikalı organik
          kiraz ve vişne. Aracısız, soğuk zincirde, hasadın aynı günü.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="mt-10 flex flex-wrap items-center gap-4"
          initial={reduced ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: reduced ? 0 : 0.98, ease }}
        >
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-sans text-base font-semibold text-inverted shadow-sm transition-colors duration-150 hover:bg-primary-hover active:scale-[0.98]"
          >
            Ürünleri Keşfet
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/orchard"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 font-sans text-base font-medium text-text transition-colors duration-150 hover:bg-raised active:scale-[0.98]"
          >
            Bahçemizi Gör
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
