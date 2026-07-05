import Link from 'next/link'

// lucide-react dropped brand icons — inline glyph matches the lucide stroke style
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

const shopLinks = [
  { label: 'Taze Kiraz', href: '#urunler' },
  { label: 'Organik Vişne', href: '#urunler' },
  { label: 'Sezon Kutuları', href: '#urunler' },
]

const infoLinks = [
  { label: 'Hikayemiz', href: '#hikaye' },
  { label: 'Bahçemiz', href: '#bahce' },
  { label: 'Ürünler', href: '#urunler' },
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
              Konya&apos;nın bereketli topraklarından sertifikalı organik kiraz
              ve vişne. Doğadan sofraya, hiçbir aracı olmadan.
            </p>

            <div className="mt-6 flex items-center gap-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-border-strong hover:text-text"
                aria-label="Instagram'da takip edin"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Shop links */}
          <div>
            <p className="mb-5 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-text">
              Ürünler
            </p>
            <ul className="flex flex-col gap-3">
              {shopLinks.map(({ label, href }) => (
                <li key={label}>
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
                <li key={label}>
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
