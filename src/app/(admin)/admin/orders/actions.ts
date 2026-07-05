'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { assertAdmin } from '@/lib/supabase/adminGuard'

export type OrderStatus =
  | 'pending_payment'
  | 'new_order'
  | 'harvesting'
  | 'packed'
  | 'shipped'
  | 'cancelled'

export interface AdminOrder {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  city: string
  total_amount: number
  status: OrderStatus
  tracking_number: string | null
  invoice_url: string | null
  created_at: string
  reserved_until: string | null
}

type ActionResult = { success: true } | { success: false; error: string }

/**
 * Reads went through the anon browser client before, gated by the same
 * "Admin manage orders" RLS policy (profiles.role = 'admin') that made
 * admin Settings saves silently fail earlier — a blocked SELECT just
 * returns zero rows, no error, which reads exactly like "no orders yet"
 * even when the table is full. Routed through the service-role client so
 * the dashboard's data doesn't depend on RLS recognizing the caller.
 */
export async function fetchOrdersForAdmin(): Promise<
  { success: true; orders: AdminOrder[] } | { success: false; error: string }
> {
  try {
    await assertAdmin()
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Yetkisiz işlem.' }
  }

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, order_number, customer_name, customer_email, customer_phone, city, total_amount, status, tracking_number, invoice_url, created_at, reserved_until'
    )
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('SUPABASE SAVE ERROR (fetchOrdersForAdmin):', error)
    return { success: false, error: 'Siparişler yüklenemedi.' }
  }

  return { success: true, orders: (data as AdminOrder[]) ?? [] }
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<ActionResult> {
  try {
    await assertAdmin()
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Yetkisiz işlem.' }
  }

  const supabase = await createServiceClient()
  const patch = status === 'pending_payment' ? { status } : { status, reserved_until: null }

  const { data, error } = await supabase.from('orders').update(patch).eq('id', id).select('id')

  if (error) {
    console.error('SUPABASE SAVE ERROR (updateOrderStatus):', error)
    return { success: false, error: 'Sipariş durumu güncellenemedi.' }
  }
  if (!data || data.length === 0) {
    return { success: false, error: 'Sipariş bulunamadı.' }
  }

  return { success: true }
}

export async function updateOrderTrackingInfo(
  id: string,
  tracking: string,
  invoiceUrl: string
): Promise<ActionResult> {
  try {
    await assertAdmin()
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Yetkisiz işlem.' }
  }

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('orders')
    .update({ tracking_number: tracking || null, invoice_url: invoiceUrl || null })
    .eq('id', id)
    .select('id')

  if (error) {
    console.error('SUPABASE SAVE ERROR (updateOrderTrackingInfo):', error)
    return { success: false, error: 'Kargo/fatura bilgisi kaydedilemedi.' }
  }
  if (!data || data.length === 0) {
    return { success: false, error: 'Sipariş bulunamadı.' }
  }

  return { success: true }
}
