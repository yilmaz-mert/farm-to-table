import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="dark flex h-dvh flex-col bg-background text-text">
      <AdminHeader userName={profile?.full_name} />
      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      <AdminBottomNav />
    </div>
  )
}
