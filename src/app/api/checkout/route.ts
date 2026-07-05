import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { initializePayment } from '@/lib/iyzico/client'
import type { IyzicoPaymentInitRequest } from '@/lib/iyzico/types'
import type { CartItem } from '@/store/cart'

interface CheckoutPayload {
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
  items: CartItem[]
  totalInKurus: number
}

function generateOrderNumber(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `DK-${date}-${rand}`
}

function kurusToTRY(kurus: number): string {
  return (kurus / 100).toFixed(2)
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}

/** Compensating action for the quota decrement below when a later step
 *  (order insert, order_items insert, Iyzico init) fails after the box
 *  count was already reserved — adds back to whatever the count reads as
 *  *now* rather than resetting to the pre-decrement snapshot, so it can't
 *  clobber a different concurrent order's decrement in the meantime. */
async function restoreQuota(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  logId: string,
  totalBoxes: number
) {
  const { data: current } = await supabase
    .from('daily_harvest_logs')
    .select('remaining_boxes')
    .eq('id', logId)
    .maybeSingle()
  if (current) {
    await supabase
      .from('daily_harvest_logs')
      .update({ remaining_boxes: current.remaining_boxes + totalBoxes })
      .eq('id', logId)
  }
}

export async function POST(req: NextRequest) {
  let payload: CheckoutPayload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 })
  }

  const { fullName, email, phone, address, city, postalCode, items } = payload

  // Basic server-side validation
  if (!fullName || !email || !phone || !address || !city) {
    return NextResponse.json({ error: 'Zorunlu alanlar eksik.' }, { status: 400 })
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Sepet boş.' }, { status: 400 })
  }

  // Item-level validation — a quantity/price that's missing, non-numeric,
  // zero, negative, or non-integer (for quantity) would otherwise create a
  // silently broken or free order line.
  for (const item of items) {
    if (
      !item.variantId ||
      typeof item.quantity !== 'number' ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      return NextResponse.json(
        { error: 'Sepetteki bir ürünün adedi geçersiz.' },
        { status: 400 }
      )
    }
    if (typeof item.priceInKurus !== 'number' || item.priceInKurus <= 0) {
      return NextResponse.json(
        { error: 'Sepetteki bir ürünün fiyatı geçersiz.' },
        { status: 400 }
      )
    }
  }

  // The charge is always computed from the line items server-side, never
  // trusted from the client's `totalInKurus` — otherwise a tampered client
  // could submit an arbitrary (e.g. near-zero) total alongside real items
  // and only ever be charged that amount.
  const totalInKurus = items.reduce(
    (sum, item) => sum + item.priceInKurus * item.quantity,
    0
  )

  const orderNumber = generateOrderNumber()
  const supabase = await createServiceClient()

  // Live harvest-quota guard — reject before creating anything if today's
  // remaining box count can't cover this order.
  const todayStr = new Date().toISOString().slice(0, 10)
  const totalBoxes = items.reduce((sum, item) => sum + item.quantity, 0)

  const { data: harvestLog } = await supabase
    .from('daily_harvest_logs')
    .select('id, remaining_boxes')
    .eq('harvest_date', todayStr)
    .maybeSingle()

  if (harvestLog) {
    if (harvestLog.remaining_boxes < totalBoxes) {
      return NextResponse.json(
        {
          error: `Üzgünüz, bugün için yeterli kutu kalmadı (${harvestLog.remaining_boxes} kutu mevcut).`,
        },
        { status: 409 }
      )
    }

    // Compare-and-swap decrement: the .eq('remaining_boxes', ...) makes this
    // update a no-op (0 rows) if another concurrent checkout already
    // changed the count between our read above and this write, closing the
    // classic check-then-act race instead of just checking and hoping.
    const { data: decremented, error: decrementError } = await supabase
      .from('daily_harvest_logs')
      .update({ remaining_boxes: harvestLog.remaining_boxes - totalBoxes })
      .eq('id', harvestLog.id)
      .eq('remaining_boxes', harvestLog.remaining_boxes)
      .select('id')

    if (decrementError || !decremented || decremented.length === 0) {
      return NextResponse.json(
        { error: 'Stok durumu az önce değişti. Lütfen tekrar deneyin.' },
        { status: 409 }
      )
    }
  }
  // No harvest log for today at all means no admin-configured quota yet —
  // consistent with how the rest of the app treats a missing row (resilient
  // default, not a hard block).

  // Parse name into first/last for Iyzico
  const nameParts = fullName.trim().split(/\s+/)
  const firstName = nameParts[0]
  const lastName = nameParts.slice(1).join(' ') || '-'

  // 1. Create order in Supabase
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      customer_name: fullName,
      customer_email: email,
      customer_phone: phone,
      shipping_address: address,
      city,
      total_amount: totalInKurus / 100,
      status: 'pending_payment',
      reserved_until: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })
    .select('id')
    .single()

  if (orderError || !order) {
    console.error('[checkout] order insert error:', orderError)
    if (harvestLog) await restoreQuota(supabase, harvestLog.id, totalBoxes)
    return NextResponse.json(
      { error: 'Sipariş oluşturulamadı. Lütfen tekrar deneyin.' },
      { status: 500 }
    )
  }

  // 2. Create order items
  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: null as string | null,
    quantity: item.quantity,
    unit_price: item.priceInKurus / 100,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

  if (itemsError) {
    console.error('[checkout] order_items insert error:', itemsError)
    // Order created but items failed — mark order as cancelled
    await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', order.id)
    if (harvestLog) await restoreQuota(supabase, harvestLog.id, totalBoxes)
    return NextResponse.json(
      { error: 'Sipariş kalemleri kaydedilemedi. Lütfen tekrar deneyin.' },
      { status: 500 }
    )
  }

  // 3. Initialise Iyzico payment
  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (req.headers.get('origin') || 'http://localhost:3000')

  const basketItems = items.map((item) => ({
    id: item.variantId,
    name: `${item.name} — ${item.variant}`,
    category1: 'Organik Meyve',
    itemType: 'PHYSICAL' as const,
    price: kurusToTRY(item.priceInKurus * item.quantity),
  }))

  const iyzicoRequest: IyzicoPaymentInitRequest = {
    locale: 'tr',
    conversationId: order.id,
    price: kurusToTRY(totalInKurus),
    paidPrice: kurusToTRY(totalInKurus),
    currency: 'TRY',
    basketId: order.id,
    paymentGroup: 'PRODUCT',
    callbackUrl: `${siteUrl}/api/checkout/callback`,
    buyer: {
      id: order.id,
      name: firstName,
      surname: lastName,
      gsmNumber: phone.replace(/\s/g, ''),
      email,
      identityNumber: '11111111111',
      registrationAddress: address,
      ip: getClientIp(req),
      city,
      country: 'Turkey',
      zipCode: postalCode || '34000',
    },
    shippingAddress: {
      contactName: fullName,
      city,
      country: 'Turkey',
      address,
      zipCode: postalCode || '34000',
    },
    billingAddress: {
      contactName: fullName,
      city,
      country: 'Turkey',
      address,
      zipCode: postalCode || '34000',
    },
    basketItems,
  }

  try {
    const iyzicoRes = await initializePayment(iyzicoRequest, getClientIp(req))

    if (iyzicoRes.isSandbox) {
      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber,
        isSandbox: true,
      })
    }

    if (iyzicoRes.status !== 'success') {
      await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
      if (harvestLog) await restoreQuota(supabase, harvestLog.id, totalBoxes)
      return NextResponse.json(
        {
          error:
            iyzicoRes.errorMessage ??
            'Ödeme başlatılamadı. Lütfen tekrar deneyin.',
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber,
      isSandbox: false,
      checkoutFormContent: iyzicoRes.checkoutFormContent,
      paymentPageUrl: iyzicoRes.paymentPageUrl,
    })
  } catch (err) {
    console.error('[checkout] iyzico error:', err)
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
    if (harvestLog) await restoreQuota(supabase, harvestLog.id, totalBoxes)
    return NextResponse.json(
      { error: 'Ödeme servisi şu an kullanılamıyor. Lütfen daha sonra deneyin.' },
      { status: 502 }
    )
  }
}
