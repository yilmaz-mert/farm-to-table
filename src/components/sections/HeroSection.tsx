'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn, shimmerBlurDataURL } from '@/lib/utils'

const HERO_BLUR = shimmerBlurDataURL(64, 40)

const ease: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]

// Split into two visual lines for cinematic stagger
const LINE_ONE = ['Sabah', 'Dalında,']
const LINE_TWO = ['Akşam', 'Kapınızda.']

function WordReveal({
  word,
  delay,
  reduced,
  hasBackground,
}: {
  word: string
  delay: number
  reduced: boolean
  hasBackground: boolean
}) {
  return (
    // Clip wrapper prevents blurred/translated text peeking out
    <span className="inline-block overflow-hidden">
      <motion.span
        // Explicit either way — never left to inherit from an ancestor
        // (which resolves to the theme's near-black --fg in light mode).
        className={cn('inline-block', hasBackground ? 'text-white' : 'text-text')}
        initial={reduced ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay, ease }}
      >
        {word}
      </motion.span>
    </span>
  )
}

interface HeroSectionProps {
  /** Admin-editable hero background (see /admin/settings). Video takes
   *  priority over the still image when both are set. */
  heroImageUrl?: string | null
  heroVideoUrl?: string | null
}

export function HeroSection({ heroImageUrl, heroVideoUrl }: HeroSectionProps) {
  const reduced = useReducedMotion() ?? false
  const hasBackground = Boolean(heroImageUrl || heroVideoUrl)

  const baseDelay = reduced ? 0 : 0.18
  const wordGap = reduced ? 0 : 0.1

  // Word timing index → absolute delay
  const d = (i: number) => baseDelay + i * wordGap

  return (
    <section
      className={cn(
        'relative flex min-h-[calc(100svh-4rem)] flex-col justify-center overflow-hidden pt-8 pb-16 md:py-24',
        !hasBackground && 'bg-background'
      )}
    >
      {/* Background media + dark scrim — keeps white/gold text legible
          regardless of the photo/video content underneath. */}
      {hasBackground && (
        <div className="absolute inset-0 -z-10" aria-hidden>
          {heroVideoUrl ? (
            <video
              className="absolute inset-0 h-full w-full transform-gpu object-cover"
              src={heroVideoUrl}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              // fetchPriority isn't in React's VideoHTMLAttributes typings yet,
              // but it's a valid HTML attribute browsers respect for LCP hints.
              {...{ fetchpriority: 'high' }}
            />
          ) : (
            <Image
              src={heroImageUrl!}
              alt=""
              fill
              priority
              fetchPriority="high"
              sizes="100vw"
              quality={85}
              placeholder="blur"
              blurDataURL={HERO_BLUR}
              className="origin-center transform-gpu object-cover"
            />
          )}
          {/* No blanket tint over the photo. A left-anchored scrim behind
              the copy only (fully clear before mid-frame) plus a faint
              bottom anchor — the sunny sky/leaves on the right stay
              untouched; legibility is reinforced by the drop-shadow on the
              text itself, below. */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a0608]/85 via-[#1a0608]/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
      )}

      <div className="container-page">
        {/* Season pill */}
        <motion.div
          className={cn(
            'mb-8 inline-flex items-center gap-2.5 rounded-full border px-4 py-1.5',
            hasBackground
              ? 'border-white/25 bg-white/10 backdrop-blur-sm'
              : 'border-border-brand bg-cherry-wash'
          )}
          initial={reduced ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0, ease }}
        >
          <span className="h-2 w-2 rounded-full bg-cta" aria-hidden />
          <span
            className={cn(
              'font-sans text-sm font-medium',
              hasBackground ? 'text-white' : 'text-primary'
            )}
          >
            2026 Hasat Sezonu Açık — Stok Sınırlı
          </span>
        </motion.div>

        {/* Main headline — staggered word reveals */}
        <h1
          className={cn(
            'font-serif text-[clamp(3.2rem,10.5vw,8.5rem)] font-light italic leading-[0.88] tracking-[-0.01em]',
            // Explicit base color either way, independent of site theme —
            // a safety net so any text node here that forgets its own
            // color class inherits this instead of falling through to
            // the theme's --fg (near-black in light mode).
            hasBackground ? 'text-white' : 'text-text',
            hasBackground && 'drop-shadow-[0_2px_16px_rgba(0,0,0,0.5)]'
          )}
          aria-label="Sabah Dalında, Akşam Kapınızda."
        >
          {/* Line 1 */}
          <span className="flex flex-wrap gap-x-[0.28em]">
            {LINE_ONE.map((word, i) => (
              <WordReveal
                key={word}
                word={word}
                delay={d(i)}
                reduced={reduced}
                hasBackground={hasBackground}
              />
            ))}
          </span>

          {/* Line 2 — last word carries the verdigris bar */}
          <span className="flex flex-wrap gap-x-[0.28em]">
            {LINE_TWO.map((word, i) => {
              const isLast = i === LINE_TWO.length - 1
              return (
                <span key={word} className="inline-block overflow-hidden">
                  <motion.span
                    className={cn(
                      'inline-block',
                      // The bug: this used to be `isLast && cn(...)`, which
                      // left the non-last word ("Akşam") with NO color
                      // class at all whenever isLast was false — it fell
                      // through to inherited body color (near-black in
                      // light mode) instead of white over the photo. Every
                      // word now gets an explicit base color; the accent
                      // override for the last word is layered on after so
                      // tailwind-merge lets it win.
                      hasBackground ? 'text-white' : 'text-text',
                      isLast && 'relative',
                      isLast && (hasBackground ? 'text-cherry-300' : 'text-primary')
                    )}
                    initial={reduced ? false : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: d(LINE_ONE.length + i), ease }}
                  >
                    {word}
                    {/* Signature verdigris bar — draws left-to-right after word lands */}
                    {isLast && (
                      <motion.span
                        className={cn(
                          'absolute -bottom-1 left-0 h-[3px] w-full origin-left rounded-full',
                          hasBackground ? 'bg-verdigris-400' : 'bg-accent'
                        )}
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
          className={cn(
            'mt-10 max-w-lg font-sans text-lg leading-relaxed',
            hasBackground
              ? 'text-white/75 drop-shadow-[0_2px_16px_rgba(0,0,0,0.5)]'
              : 'text-muted'
          )}
          initial={reduced ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: reduced ? 0 : 0.82, ease }}
        >
          Konya&apos;nın bereketli topraklarında özenle yetiştirilen sertifikalı
          organik kiraz ve vişne. Aracısız, soğuk zincirde, hasadın aynı günü.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="mt-10 flex flex-wrap items-center gap-4"
          initial={reduced ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: reduced ? 0 : 0.98, ease }}
        >
          <Link
            href="#urunler"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-sans text-base font-semibold text-inverted shadow-sm transition-colors duration-150 hover:bg-primary-hover active:scale-[0.98]"
          >
            Ürünleri Keşfet
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="#bahce"
            className={cn(
              'inline-flex items-center gap-2 rounded-lg border px-6 py-3 font-sans text-base font-medium transition-colors duration-150 active:scale-[0.98]',
              hasBackground
                ? 'border-white/30 text-white hover:bg-white/10'
                : 'border-border text-text hover:bg-raised'
            )}
          >
            Bahçemizi Gör
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
