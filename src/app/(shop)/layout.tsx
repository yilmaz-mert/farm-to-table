import type { ReactNode } from 'react'
import { ShopNavbar } from '@/components/shared/navbar'
import { ShopFooter } from '@/components/shared/footer'

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ShopNavbar />
      <main className="min-h-[calc(100dvh-4rem)]">{children}</main>
      <ShopFooter />
    </>
  )
}
