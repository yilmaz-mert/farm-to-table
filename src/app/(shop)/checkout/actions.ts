'use server'

import { createServiceClient } from '@/lib/supabase/server'

type ConfirmResult = { success: true } | { success: false; error: string }

/**
 * Sandbox-mode-only: `/api/checkout` already created the order as
 * `pending_payment` (initializePayment() returned isSandbox because no real
 * Iyzico keys are configured — see src/lib/iyzico/client.ts). Previously the
 * checkout page treated that response as an immediate success without ever
 * transitioning the order, so sandbox orders stayed at `pending_payment`
 * forever and never showed up correctly in /admin/orders. This is the step
 * that actually closes the loop, mirroring what /api/checkout/callback does
 * for a real Iyzico redirect — just triggered by the simulation modal's
 * confirm button instead of a payment-gateway webhook.
 */
export async function confirmSandboxPayment(orderId: string): Promise<ConfirmResult> {
  if (!orderId) {
    return { success: false, error: 'Geçersiz sipariş.' }
  }

  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'new_order', reserved_until: null })
    .eq('id', orderId)
    .eq('status', 'pending_payment')
    .select('id')

  if (error) {
    console.error('SUPABASE SAVE ERROR (confirmSandboxPayment):', error)
    return { success: false, error: 'Ödeme onaylanamadı. Lütfen tekrar deneyin.' }
  }
  if (!data || data.length === 0) {
    return {
      success: false,
      error: 'Sipariş bulunamadı veya zaten işlenmiş.',
    }
  }

  return { success: true }
}
