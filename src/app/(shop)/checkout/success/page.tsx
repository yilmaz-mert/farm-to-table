import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Package, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SuccessAccountWidget } from './SuccessAccountWidget'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ order?: string }>
}

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const { order: orderNumber } = await searchParams
  if (!orderNumber) notFound()

  const supabase = await createClient()
  const { data: order } = await supabase
    .from('orders')
    .select('order_number, customer_email, status, total_amount, created_at')
    .eq('order_number', orderNumber)
    .single()

  if (!order) notFound()

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        {/* Success icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-verdigris-100 dark:bg-verdigris-900">
            <CheckCircle2 className="h-10 w-10 text-verdigris-600 dark:text-verdigris-300" aria-hidden />
          </div>
        </div>

        {/* Heading */}
        <div className="mb-8 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
            Dalından Kapıya
          </p>
          <h1 className="mt-3 font-serif text-[clamp(2rem,6vw,3rem)] font-light italic leading-tight text-text">
            Siparişiniz Alındı!
          </h1>
          <p className="mt-3 font-sans text-base text-muted">
            Meyveniz hasat günü soğuk zincirde yola çıkacak.
          </p>
        </div>

        {/* Order number */}
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-border bg-surface px-5 py-4">
          <Package className="h-6 w-6 shrink-0 text-accent" aria-hidden />
          <div>
            <p className="font-sans text-xs text-muted">Sipariş numaranız</p>
            <p className="mt-0.5 font-mono text-base font-bold tracking-wider text-text">
              {order.order_number}
            </p>
          </div>
        </div>

        <p className="mb-8 text-center font-sans text-xs text-subtle">
          Sipariş onayı{' '}
          <span className="font-medium text-muted">{order.customer_email}</span> adresine
          gönderildi.
        </p>

        {/* 1-click account creation */}
        <SuccessAccountWidget email={order.customer_email} />

        {/* Back to home */}
        <Link
          href="/"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 font-sans text-sm font-medium text-muted transition-colors hover:bg-raised hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  )
}
