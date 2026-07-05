-- Reverses the "products_bg" / "features_bg" section-background feature
-- (0008_section_backgrounds.sql) — the admin CMS is being simplified back
-- to static brand styling for the Products/Story/Transparency sections.
-- hero_image_url / hero_video_url are untouched; the Hero background
-- feature stays.
ALTER TABLE public.store_settings DROP COLUMN IF EXISTS products_bg_url;
ALTER TABLE public.store_settings DROP COLUMN IF EXISTS features_bg_url;
