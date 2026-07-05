import Link from 'next/link'
import { ArrowRight, Leaf, Truck, ShieldCheck } from 'lucide-react'
import { ShopNavbar } from '@/components/shared/navbar'
import { ShopFooter } from '@/components/shared/footer'
import { ShippingCalculator } from '@/components/shared/ShippingCalculator'
import { HeroSection } from '@/components/sections/HeroSection'
import { StorySection } from '@/components/sections/StorySection'
import { ProductsSection, type ProductContent } from '@/components/sections/ProductsSection'
import { TransparencySection } from '@/components/sections/TransparencySection'
import { GallerySection, type GalleryShotContent } from '@/components/sections/GallerySection'
import { createPublicClient } from '@/lib/supabase/public'

// Product prices are admin-editable (see /admin/settings) — refresh at most
// once a minute rather than forcing this page fully dynamic (which a
// cookie-bound Supabase read would otherwise do).
export const revalidate = 60

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
export default async function HomePage() {
  const supabase = createPublicClient()
  const [{ data: products }, { data: galleryRows }, { data: settings }] = await Promise.all([
    supabase
      .from('products')
      .select(
        'name, package_weight_kg, total_price, description, marketing_copy, highlight_badge, image_url'
      )
      .eq('is_active', true),
    supabase.from('gallery_shots').select('*').order('slot_index'),
    supabase
      .from('store_settings')
      .select('hero_image_url, hero_video_url')
      .eq('id', 1)
      .maybeSingle(),
  ])

  const dbContent: Record<number, ProductContent> = Object.fromEntries(
    (products ?? []).map((p) => [
      Math.round(Number(p.package_weight_kg) * 1000),
      {
        priceInKurus: Math.round(Number(p.total_price) * 100),
        name: p.name ?? '',
        variantTitle: p.description ?? '',
        description: p.marketing_copy ?? '',
        highlightBadge: p.highlight_badge,
        imageUrl: p.image_url,
      },
    ])
  )

  const gallery: GalleryShotContent[] = (galleryRows ?? []).map((g) => ({
    category: g.category,
    title: g.title,
    harvestTime: g.harvest_time,
    locationTag: g.location_tag,
    imageUrl: g.image_url,
  }))

  return (
    <>
      <ShopNavbar />

      <main>
        <HeroSection
          heroImageUrl={settings?.hero_image_url}
          heroVideoUrl={settings?.hero_video_url}
        />

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

        <ProductsSection dbContent={dbContent} />

        <ShippingCalculator />

        <StorySection />

        <TransparencySection />

        <GallerySection shots={gallery} />

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
