'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Siparişler', Icon: Package },
]

export function AdminBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="flex h-16 shrink-0 border-t border-border bg-surface/95 backdrop-blur-md"
      aria-label="Admin menü"
    >
      {NAV.map(({ href, label, Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors',
              active ? 'text-primary' : 'text-subtle hover:text-muted'
            )}
            aria-current={active ? 'page' : undefined}
          >
            <Icon
              className={cn('h-5 w-5 transition-transform', active && 'scale-110')}
              aria-hidden
            />
            <span className="font-sans text-[10px] font-medium tracking-wide">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
