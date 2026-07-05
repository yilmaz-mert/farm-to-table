'use server'

import { revalidatePath } from 'next/cache'

/**
 * The public homepage is ISR-cached (`revalidate = 60` in src/app/page.tsx)
 * for performance — fine for normal traffic, but it means an admin Settings
 * save wouldn't show up on the storefront for up to a minute. Call this
 * right after a successful save to drop that cache immediately instead of
 * waiting out the window.
 */
export async function revalidateStorefront() {
  revalidatePath('/')
  revalidatePath('/admin/settings')
}
