'use client'

import { usePathname, useRouter } from 'next/navigation'
import { LogOut, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/orders': 'Siparişler',
  '/admin/pricing': 'Fiyatlandırma',
}

interface AdminHeaderProps {
  onRefresh?: () => void
  userName?: string | null
}

export function AdminHeader({ onRefresh, userName }: AdminHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const title = TITLES[pathname] ?? 'Admin'

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface/90 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-2.5">
        <span className="font-serif text-[11px] italic tracking-wide text-accent">
          Dalından Kapıya
        </span>
        <span className="text-border">·</span>
        <h1 className="font-sans text-sm font-semibold text-text">{title}</h1>
      </div>

      <div className="flex items-center gap-1">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-text active:scale-95"
            aria-label="Yenile"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
          </button>
        )}

        <button
          onClick={handleSignOut}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-text active:scale-95"
          aria-label="Çıkış yap"
          title={userName ? `${userName} — Çıkış Yap` : 'Çıkış Yap'}
        >
          <LogOut className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </header>
  )
}
