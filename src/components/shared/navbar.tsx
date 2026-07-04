'use client'

import Link from 'next/link'
import { ShoppingBag, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useCartStore, cartItemCount } from '@/store/cart'
import { useUIStore } from '@/store/ui'
import { cn } from '@/lib/utils'
import { ScarcityBar } from './ScarcityBar'

const navLinks = [
  { label: 'Mağaza', href: '/shop' },
  { label: 'Hakkımızda', href: '/about' },
  { label: 'Bahçemiz', href: '/orchard' },
  { label: 'İletişim', href: '/contact' },
]

export function ShopNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const items = useCartStore((s) => s.items)
  const totalItems = cartItemCount(items)
  const toggleCartDrawer = useUIStore((s) => s.toggleCartDrawer)

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <ScarcityBar />
      <div className="border-b border-border">
      <div className="container-page flex h-16 items-center justify-between">
        {/* Brand mark */}
        <Link href="/" className="flex flex-col leading-none group">
          <span className="font-serif text-xl font-semibold italic text-primary transition-colors group-hover:text-primary-hover">
            Dalından
          </span>
          <span className="text-[10px] font-mono font-medium uppercase tracking-[0.2em] text-accent transition-colors group-hover:text-accent-hover">
            Kapıya
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="Ana menü">
          {navLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="font-sans text-sm font-medium text-muted transition-colors hover:text-text"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Action bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleCartDrawer}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-text transition-colors hover:bg-raised"
            aria-label={`Sepeti aç — ${totalItems} ürün`}
          >
            <ShoppingBag className="h-5 w-5" aria-hidden />
            {totalItems > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cta px-1 font-mono text-[10px] font-bold text-inverted">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </button>

          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg text-text transition-colors hover:bg-raised md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Menüyü kapat' : 'Menüyü aç'}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden />
            ) : (
              <Menu className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>
      </div>
      </div>

      {/* Mobile navigation drawer */}
      <div
        className={cn(
          'overflow-hidden border-t border-border bg-background transition-all duration-200 md:hidden',
          mobileOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
        )}
        aria-hidden={!mobileOpen}
      >
        <nav className="px-4 py-3" aria-label="Mobil menü">
          <ul className="flex flex-col gap-0.5">
            {navLinks.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="block rounded-lg px-3 py-2.5 font-sans text-sm font-medium text-text transition-colors hover:bg-raised"
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}
