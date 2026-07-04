import Link from 'next/link'
import { Globe } from 'lucide-react'

const shopLinks = [
  { label: 'Taze Kiraz', href: '/shop?category=cherry' },
  { label: 'Organik Vişne', href: '/shop?category=sour-cherry' },
  { label: 'Reçel & Konserve', href: '/shop?category=preserves' },
  { label: 'Sezon Kutuları', href: '/shop?category=gift-boxes' },
]

const infoLinks = [
  { label: 'Hakkımızda', href: '/about' },
  { label: 'Bahçemiz', href: '/orchard' },
  { label: 'Teslimat & İade', href: '/shipping' },
  { label: 'Sertifikalarımız', href: '/certifications' },
  { label: 'Gizlilik Politikası', href: '/privacy' },
]

export function ShopFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-raised">
      <div className="container-page py-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
          {/* Brand column */}
          <div>
            <Link href="/" className="group mb-5 inline-flex flex-col leading-none">
              <span className="font-serif text-2xl font-semibold italic text-primary transition-colors group-hover:text-primary-hover">
                Dalından
              </span>
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-accent transition-colors group-hover:text-accent-hover">
                Kapıya
              </span>
            </Link>
            <p className="max-w-xs font-sans text-sm leading-relaxed text-muted">
              Yüksek irtifa bahçelerinden sertifikalı organik kiraz.
              Doğadan sofraya, hiçbir aracı olmadan.
            </p>

            <a
              href="https://dalindankapiya.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-border-strong hover:text-text"
              aria-label="Web sitesini ziyaret et"
            >
              <Globe className="h-4 w-4" aria-hidden />
            </a>
          </div>

          {/* Shop links */}
          <div>
            <p className="mb-5 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-text">
              Ürünler
            </p>
            <ul className="flex flex-col gap-3">
              {shopLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="font-sans text-sm text-muted transition-colors hover:text-text"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info links */}
          <div>
            <p className="mb-5 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-text">
              Bilgi
            </p>
            <ul className="flex flex-col gap-3">
              {infoLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="font-sans text-sm text-muted transition-colors hover:text-text"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-8 sm:flex-row">
          <p className="font-sans text-xs text-muted">
            © {currentYear} Dalından Kapıya. Tüm hakları saklıdır.
          </p>
          <p className="font-sans text-xs text-subtle">
            Sertifikalı organik üretim — Türkiye 🇹🇷
          </p>
        </div>
      </div>
    </footer>
  )
}
