import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { retrievePayment } from '@/lib/iyzico/client'

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}

async function parseBody(req: NextRequest): Promise<Record<string, string>> {
  const contentType = req.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return req.json()
  }
  const text = await req.text()
  return Object.fromEntries(new URLSearchParams(text))
}

export async function POST(req: NextRequest) {
  const body = await parseBody(req)
  const { token, status, conversationId } = body

  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (req.headers.get('origin') || 'http://localhost:3000')

  if (!token || !conversationId) {
    return NextResponse.redirect(`${siteUrl}/?payment=error`, { status: 302 })
  }

  try {
    const iyzico = await retrievePayment(token, conversationId)
    const paid =
      iyzico.isSandbox ||
      (iyzico.status === 'success' && iyzico.paymentStatus === 'SUCCESS')

    const supabase = await createServiceClient()

    if (!paid) {
      await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', conversationId)
      return NextResponse.redirect(`${siteUrl}/checkout?payment=failed`, { status: 302 })
    }

    const { data: order } = await supabase
      .from('orders')
      .update({ status: 'new_order', reserved_until: null })
      .eq('id', conversationId)
      .select('order_number, customer_email')
      .single()

    if (!order) {
      return NextResponse.redirect(`${siteUrl}/?payment=error`, { status: 302 })
    }

    const successUrl = new URL('/checkout/success', siteUrl)
    successUrl.searchParams.set('order', order.order_number)
    return NextResponse.redirect(successUrl.toString(), { status: 302 })
  } catch (err) {
    console.error('[callback] error:', err)
    return NextResponse.redirect(`${siteUrl}/?payment=error`, { status: 302 })
  }
}

// Iyzico may also GET the callback URL in some flows
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token') ?? ''
  const conversationId = searchParams.get('conversationId') ?? ''

  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (req.headers.get('origin') || 'http://localhost:3000')

  if (!token || !conversationId) {
    return NextResponse.redirect(`${siteUrl}/`, { status: 302 })
  }

  return NextResponse.redirect(
    `${siteUrl}/checkout/success?order=${conversationId}`,
    { status: 302 }
  )
}
