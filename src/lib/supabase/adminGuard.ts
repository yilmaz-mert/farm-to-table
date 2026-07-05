import { createClient, createServiceClient } from './server'

// Mirrors the bypass in src/app/(admin)/layout.tsx — see the comment there.
// Kept in sync intentionally: this UUID is grandfathered in independently
// of whatever the `profiles` table currently says, so admin Settings saves
// keep working even if that row is missing or out of sync.
const EMERGENCY_ADMIN_ID = 'e56ec4da-be33-46b8-bf3f-1d25881637fb'

/**
 * Verifies the calling user is an admin, independent of RLS. Every mutation
 * gated by this then runs through `createServiceClient()` (service-role key,
 * bypasses RLS entirely) — so this check is the ONLY authorization gate for
 * those writes, not a defense-in-depth layer on top of RLS.
 *
 * `profiles` has RLS enabled with zero policies granting the anon/
 * authenticated client access to it (by design — see 0000_initial_schema.sql),
 * so the role lookup itself must go through the service client too, or it
 * would always come back empty regardless of the real value.
 */
export async function assertAdmin(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.')
  }

  if (user.id === EMERGENCY_ADMIN_ID) {
    return user.id
  }

  const serviceClient = await createServiceClient()
  const { data: profile, error } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    console.error('SUPABASE SAVE ERROR (profile lookup):', error)
    throw new Error('Yetki doğrulanamadı. Lütfen tekrar deneyin.')
  }

  if (profile?.role !== 'admin') {
    throw new Error('Bu işlem için admin yetkisi gerekiyor.')
  }

  return user.id
}
