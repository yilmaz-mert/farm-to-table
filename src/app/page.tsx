import Link from 'next/link'
import { ArrowRight, Leaf, Truck, ShieldCheck } from 'lucide-react'
import { ShopNavbar } from '@/components/shared/navbar'
import { ShopFooter } from '@/components/shared/footer'
import { ShippingCalculator } from '@/components/shared/ShippingCalculator'
import { HeroSection } from '@/components/sections/HeroSection'
import { StorySection } from '@/components/sections/StorySection'
import { ProductsSection } from '@/components/sections/ProductsSection'
import { TransparencySection } from '@/components/sections/TransparencySection'
import { GallerySection } from '@/components/sections/GallerySection'

const features = [
  {
    icon: Leaf,
    title: 'Sertifikalı Organik',
    desc: 'Hiçbir sentetik ilaç, kimyasal katkı ya da yapay koruyucu.',
  },
  {
    icon: Truck,
    title: 'Aynı Gün Kargo',
    desc: 'Hasat sabahından itibaren 24 saat içinde soğuk zincirde kapınızda.',
  },
  {
    icon: ShieldCheck,
    title: 'Meyve Garantisi',
    desc: 'Kaliteden memnun kalmazsanız eksiksiz iade — soru sormaksızın.',
  },
]

/**
 * One-page storytelling flow:
 * Hero (emotion) → Trust strip (credibility) → Products (conversion)
 * → Shipping (objection removal) → Story (depth) → Transparency (trust)
 * → Gallery (social proof) → Editorial CTA (final push).
 * ScarcityBar lives inside ShopNavbar's sticky header.
 */
export default function HomePage() {
  return (
    <>
      <ShopNavbar />

      <main>
        <HeroSection />

        {/* ── Trust strip ─────────────────────────────────────── */}
        <section className="border-y border-border bg-raised" aria-label="Özelliklerimiz">
          <div className="container-page">
            <div className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4 px-2 py-8 sm:px-6">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cherry-wash">
                    <Icon className="h-5 w-5 text-primary" aria-hidden />
                  </div>
                  <div>
                    <p className="font-sans text-sm font-semibold text-text">{title}</p>
                    <p className="mt-1 font-sans text-sm text-muted">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <ProductsSection />

        <ShippingCalculator />

        <StorySection />

        <TransparencySection />

        <GallerySection />

        {/* ── Editorial CTA ────────────────────────────────────── */}
        <section className="bg-background py-28 text-center">
          <div className="container-page">
            <p className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.18em] text-accent">
              Bu sezon
            </p>
            <h2 className="font-serif text-[clamp(2.5rem,7vw,5rem)] font-light italic leading-[1.05] text-text">
              İki Meyve,
              <br />
              <span className="text-primary">Tek Bahçe.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-sm font-sans text-base text-muted">
              Taze yaz kirazı ve kendine özgü ekşisiyle vişne —
              aynı toprağın iki farklı hikâyesi.
            </p>
            <Link
              href="#urunler"
              className="mt-10 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-sans text-base font-semibold text-inverted shadow-sm transition-colors duration-150 hover:bg-accent-hover active:scale-[0.98]"
            >
              Kutunu Seç
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      <ShopFooter />
    </>
  )
}
