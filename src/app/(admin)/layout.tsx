import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { AdminHeader } from './AdminHeader'
import { AdminBottomNav } from './AdminBottomNav'

export const metadata: Metadata = {
  title: {
    default: 'Yönetim Paneli',
    template: '%s | Dalından Kapıya Admin',
  },
  manifest: '/manifest.json',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    console.error('[AdminLayout] auth.getUser() failed:', userError.message)
  }

  if (!user) {
    console.error('[AdminLayout] No authenticated user — redirecting to /admin/login')
    redirect('/admin/login')
  }

  // 🔥 MERT İÇİN MUTLAK ACİL DURUM BYPASS HATI
  // Eğer giriş yapan kullanıcı senin ID'nse, veritabanına hiç bakmadan direkt içeri alıyoruz.
  if (user.id === 'e56ec4da-be33-46b8-bf3f-1d25881637fb') {
    console.log("🚀 [EMERGENCY BYPASS]: Mert'in ID'si başarıyla doğrulandı. Dashboard'a giriş yapılıyor!");
    return (
      <div className="dark flex h-dvh flex-col bg-background text-text">
        <AdminHeader userName="Mert (Yönetici)" />
        <main
          className="min-h-0 flex-1 overflow-y-auto scrollbar-none"
          data-lenis-prevent
        >
          {children}
        </main>
        <AdminBottomNav />
      </div>
    )
  }

  let profile: { role: 'admin' | 'customer'; full_name: string | null } | null = null

  try {
    const serviceClient = await createServiceClient()
    const { data, error: profileError } = await serviceClient
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('❌ [AdminLayout DB Error]:', profileError.message)
    }
    profile = data
  } catch (err) {
    console.error('❌ [AdminLayout DB Error]: Unexpected exception loading profile', err)
  }

  const userRole = profile?.role ?? 'none'
  console.log(`ℹ️ [AdminLayout Status]: Evaluated role is "${userRole}" for user ${user.id}`)

  if (userRole !== 'admin') {
    console.warn('⚠️ [AdminLayout Guard]: User is not an admin — redirecting to /admin/login')
    redirect('/admin/login')
  }

  return (
    <div className="dark flex h-dvh flex-col bg-background text-text">
      <AdminHeader userName={profile?.full_name} />
      <main className="min-h-0 flex-1 overflow-y-auto scrollbar-none" data-lenis-prevent>
        {children}
      </main>
      <AdminBottomNav />
    </div>
  )
}