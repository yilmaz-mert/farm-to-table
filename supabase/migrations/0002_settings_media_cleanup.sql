-- Reconciles store_settings to its final shape and adds native Storage
-- support for admin-uploaded media (hero background + package photos).
-- Written to be safe whether or not 0001 has already been applied:
--   - CREATE TABLE IF NOT EXISTS handles a fresh install.
--   - The ALTER statements reconcile an install where 0001 already ran
--     with the old (text-CMS) column set.

CREATE TABLE IF NOT EXISTS public.store_settings (
    id SMALLINT PRIMARY KEY DEFAULT 1,
    urgency_blitz_mode BOOLEAN NOT NULL DEFAULT FALSE,
    hero_image_url TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT store_settings_singleton CHECK (id = 1)
);

-- Text content management is explicitly out of scope — drop it if 0001
-- created these columns.
ALTER TABLE public.store_settings DROP COLUMN IF EXISTS hero_title;
ALTER TABLE public.store_settings DROP COLUMN IF EXISTS hero_subtitle;
ALTER TABLE public.store_settings DROP COLUMN IF EXISTS scarcity_announcement_text;

-- New: hero background image reference (media, not copy)
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS hero_image_url TEXT;

INSERT INTO public.store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read store_settings" ON public.store_settings;
CREATE POLICY "Public read store_settings" ON public.store_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manage store_settings" ON public.store_settings;
CREATE POLICY "Admin manage store_settings" ON public.store_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- ==========================================
-- STORAGE: public bucket for hero + package images
-- ==========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-media', 'store-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read store-media" ON storage.objects;
CREATE POLICY "Public read store-media" ON storage.objects FOR SELECT
    USING (bucket_id = 'store-media');

DROP POLICY IF EXISTS "Admin insert store-media" ON storage.objects;
CREATE POLICY "Admin insert store-media" ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'store-media' AND
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

DROP POLICY IF EXISTS "Admin update store-media" ON storage.objects;
CREATE POLICY "Admin update store-media" ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'store-media' AND
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

DROP POLICY IF EXISTS "Admin delete store-media" ON storage.objects;
CREATE POLICY "Admin delete store-media" ON storage.objects FOR DELETE
    USING (
        bucket_id = 'store-media' AND
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );
