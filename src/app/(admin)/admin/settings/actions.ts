'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { assertAdmin } from '@/lib/supabase/adminGuard'
import { revalidateStorefront } from '@/app/actions/revalidate'

type SaveResult = { success: true } | { success: false; error: string }

interface ProductUpdate {
  id: string
  name: string
  package_weight_kg: number
  total_price: number
  price_per_kg: number
  image_url: string | null
  description: string
  marketing_copy: string
  highlight_badge: string | null
}

interface GalleryUpdate {
  slot_index: number
  category: 'bahceden' | 'kutu_acilisi' | 'hasat_ani'
  image_url: string | null
  title: string
  harvest_time: string
  location_tag: string
}

interface SaveSettingsPayload {
  products: ProductUpdate[]
  harvestDate: string
  totalBoxQuota: number
  remainingBoxes: number
  urgencyBlitzMode: boolean
  heroImageUrl: string | null
  heroVideoUrl: string | null
  productsBgUrl: string | null
  featuresBgUrl: string | null
  gallerySlots: GalleryUpdate[]
  /** Full public URLs cleared via "Görseli Kaldır" this session — deleted
   *  from the store-media bucket only after every DB write below succeeds. */
  mediaUrlsToDelete: string[]
}

/** Public storage URLs look like
 *  `https://<project>.supabase.co/storage/v1/object/public/store-media/<path>`.
 *  Deletion needs the bucket-relative <path>, not the full URL. */
function extractStoragePath(publicUrl: string): string | null {
  const marker = '/store-media/'
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return null
  try {
    return decodeURIComponent(publicUrl.slice(idx + marker.length))
  } catch {
    return null
  }
}

/**
 * Every write here runs through the service-role client, which bypasses RLS
 * entirely — `assertAdmin()` above is therefore the ONLY authorization gate,
 * not a defense-in-depth layer. This exists because the previous anon-client
 * + RLS path was silently matching zero rows (RLS blocks a write without
 * raising an error), which is exactly what made Mert's saves look like they
 * succeeded while nothing actually persisted.
 */
export async function saveAdminSettings(payload: SaveSettingsPayload): Promise<SaveResult> {
  try {
    await assertAdmin()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Yetkisiz işlem.'
    console.error('SUPABASE SAVE ERROR (auth):', message)
    return { success: false, error: message }
  }

  const supabase = await createServiceClient()

  for (const p of payload.products) {
    // upsert(onConflict: 'id') rather than update().eq('id') — if the row
    // genuinely doesn't exist (stale client state, a re-seeded table, a
    // race with another admin), this self-heals by inserting it instead of
    // silently matching zero rows and failing with "ürün bulunamadı".
    // `id` is the primary key, so it satisfies upsert's unique-constraint
    // requirement; package_weight_kg must be included since it's NOT NULL
    // and only required on the insert path.
    const { data, error } = await supabase
      .from('products')
      .upsert(
        {
          id: p.id,
          name: p.name,
          package_weight_kg: p.package_weight_kg,
          total_price: p.total_price,
          price_per_kg: p.price_per_kg,
          image_url: p.image_url,
          description: p.description,
          marketing_copy: p.marketing_copy,
          highlight_badge: p.highlight_badge,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select('id')

    if (error) {
      console.error('SUPABASE SAVE ERROR (products):', error)
      return { success: false, error: `"${p.name}" kaydedilemedi: ${error.message}` }
    }
    if (!data || data.length === 0) {
      console.error('SUPABASE SAVE ERROR (products): upsert returned 0 rows for id', p.id)
      return { success: false, error: `"${p.name}" kaydedilemedi.` }
    }
  }

  const { data: harvestData, error: harvestError } = await supabase
    .from('daily_harvest_logs')
    .upsert(
      {
        harvest_date: payload.harvestDate,
        total_box_quota: payload.totalBoxQuota,
        remaining_boxes: payload.remainingBoxes,
      },
      { onConflict: 'harvest_date' }
    )
    .select('id')

  if (harvestError) {
    console.error('SUPABASE SAVE ERROR (daily_harvest_logs):', harvestError)
    return { success: false, error: `Hasat kotası kaydedilemedi: ${harvestError.message}` }
  }
  if (!harvestData || harvestData.length === 0) {
    console.error('SUPABASE SAVE ERROR (daily_harvest_logs): 0 rows returned from upsert')
    return { success: false, error: 'Hasat kotası kaydedilemedi.' }
  }

  const { data: settingsData, error: settingsError } = await supabase
    .from('store_settings')
    .upsert({
      id: 1,
      urgency_blitz_mode: payload.urgencyBlitzMode,
      hero_image_url: payload.heroImageUrl,
      hero_video_url: payload.heroVideoUrl,
      products_bg_url: payload.productsBgUrl,
      features_bg_url: payload.featuresBgUrl,
      updated_at: new Date().toISOString(),
    })
    .select('id')

  if (settingsError) {
    console.error('SUPABASE SAVE ERROR (store_settings):', settingsError)
    return { success: false, error: `Mağaza ayarları kaydedilemedi: ${settingsError.message}` }
  }
  if (!settingsData || settingsData.length === 0) {
    console.error('SUPABASE SAVE ERROR (store_settings): 0 rows returned from upsert')
    return { success: false, error: 'Mağaza ayarları kaydedilemedi.' }
  }

  const { data: galleryData, error: galleryError } = await supabase
    .from('gallery_shots')
    .upsert(
      payload.gallerySlots.map((g) => ({
        slot_index: g.slot_index,
        category: g.category,
        image_url: g.image_url,
        title: g.title,
        harvest_time: g.harvest_time,
        location_tag: g.location_tag,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'slot_index' }
    )
    .select('slot_index')

  if (galleryError) {
    console.error('SUPABASE SAVE ERROR (gallery_shots):', galleryError)
    return { success: false, error: `Galeri kareleri kaydedilemedi: ${galleryError.message}` }
  }
  if (!galleryData || galleryData.length === 0) {
    console.error('SUPABASE SAVE ERROR (gallery_shots): 0 rows returned from upsert')
    return { success: false, error: 'Galeri kareleri kaydedilemedi.' }
  }

  // Only now — every DB write above succeeded — actually delete the old
  // files from Storage. Doing this before the DB writes succeed risks a
  // dangling DB reference to an already-deleted file if something above
  // fails; doing it after is non-fatal to the save either way, since the
  // important state (the DB) is already correct.
  if (payload.mediaUrlsToDelete.length > 0) {
    const paths = payload.mediaUrlsToDelete
      .map(extractStoragePath)
      .filter((p): p is string => p !== null)

    if (paths.length > 0) {
      const { error: removeError } = await supabase.storage.from('store-media').remove(paths)
      if (removeError) {
        console.error('SUPABASE SAVE ERROR (storage cleanup):', removeError)
        // Non-fatal — a stray orphaned file is far less harmful than
        // reporting the whole save as failed when the DB state is correct.
      }
    }
  }

  try {
    await revalidateStorefront()
  } catch (revalidateErr) {
    // The writes above already succeeded — a revalidation hiccup just means
    // the storefront falls back to its normal ISR window, not a save failure.
    console.error('[saveAdminSettings] revalidateStorefront failed:', revalidateErr)
  }

  return { success: true }
}
