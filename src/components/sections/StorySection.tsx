'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { FlaskConical, ScanLine, PackageCheck } from 'lucide-react'

const ease: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]

const stories = [
  {
    Icon: FlaskConical,
    stat: '0',
    statUnit: 'sentetik ilaç',
    title: 'Kimyasız Bahçe',
    body: 'Her meyvemiz, doğanın kendi ritmiyle yetişir. Toprak sağlığını korumak için bakteri kültürü ve biyolojik zararlı yönetimi kullanıyor, sentetik katkılardan tamamen kaçınıyoruz.',
    iconBg: 'bg-cherry-wash',
    iconFg: 'text-primary',
  },
  {
    Icon: ScanLine,
    stat: '±2',
    statUnit: 'mm hassasiyet',
    title: 'Hassas Kalibrasyon',
    body: 'Hasattan sonra her kiraz optik kalibrasyon makinasından geçer. Yalnızca belirlenen boyut ve renk standartını karşılayan meyveler kutunuza girer.',
    iconBg: 'bg-verdigris-100',
    iconFg: 'text-verdigris-700',
  },
  {
    Icon: PackageCheck,
    stat: '+4',
    statUnit: '°C soğuk zincir',
    title: 'Soğuk Zincir Ambalaj',
    body: 'Hasat anından kapınıza kadar soğuk zincir asla kırılmaz. EPS köpük kutular ve jel buz ile ürünleriniz 24–48 saat boyunca optimum tazelikte kalır.',
    iconBg: 'bg-bark-100',
    iconFg: 'text-bark-700',
  },
] as const

function StoryCard({
  story,
  index,
}: {
  story: (typeof stories)[number]
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-72px 0px' })
  const { Icon, stat, statUnit, title, body, iconBg, iconFg } = story

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay: index * 0.13, ease }}
      className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-7 shadow-sm"
    >
      {/* Icon + stat */}
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          <Icon className={`h-5 w-5 ${iconFg}`} aria-hidden />
        </div>
        <div className="text-right">
          <span className="font-mono text-3xl font-semibold leading-none text-text">
            {stat}
          </span>
          <br />
          <span className="font-sans text-[11px] text-muted">{statUnit}</span>
        </div>
      </div>

      {/* Copy */}
      <div>
        <h3 className="mb-2 font-sans text-sm font-semibold text-text">{title}</h3>
        <p className="font-sans text-sm leading-relaxed text-muted">{body}</p>
      </div>
    </motion.div>
  )
}

export function StorySection() {
  const hdrRef = useRef<HTMLDivElement>(null)
  const hdrInView = useInView(hdrRef, { once: true, margin: '-80px 0px' })

  return (
    <section className="bg-sunken py-24">
      <div className="container-page">
        {/* Header */}
        <div ref={hdrRef} className="mb-16 max-w-2xl">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={hdrInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, ease }}
            className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.18em] text-accent"
          >
            Üretim felsefemiz
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 22 }}
            animate={hdrInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.1, ease }}
            className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-light italic leading-tight text-text"
          >
            Dalda ne yaşıyorsa,
            <br />
            <span className="text-primary">kutuda o var.</span>
          </motion.h2>
        </div>

        {/* Cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story, i) => (
            <StoryCard key={story.title} story={story} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
