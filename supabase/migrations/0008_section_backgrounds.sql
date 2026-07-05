-- Adds storefront section background media, admin-editable from
-- /admin/settings (Görsel ve Medya Yönetimi). All nullable — every consuming
-- component falls back to its existing plain design when unset.
ALTER TABLE public.store_settings
    ADD COLUMN IF NOT EXISTS hero_video_url TEXT,
    ADD COLUMN IF NOT EXISTS products_bg_url TEXT,
    ADD COLUMN IF NOT EXISTS features_bg_url TEXT;
