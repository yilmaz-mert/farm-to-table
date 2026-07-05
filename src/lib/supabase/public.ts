import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * Anonymous, cookie-free client for public Server Component reads.
 * Unlike `server.ts`'s client (which reads `next/headers` cookies and
 * therefore forces the route into per-request dynamic rendering), this
 * client touches no request-specific APIs, so pages using it can stay
 * statically generated / ISR-cached.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
