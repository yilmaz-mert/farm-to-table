-- Gallery CMS: turns the 6 hardcoded "Bugün Bahçeden Kareler" cards
-- (src/components/sections/GallerySection.tsx SHOTS array) into admin-
-- editable rows. Fixed 6-slot layout (slot_index 1..6) so the admin
-- Settings page can render one editor card per grid position — same
-- pattern as `daily_harvest_logs` being keyed by date instead of an
-- open-ended list.
CREATE TABLE IF NOT EXISTS public.gallery_shots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slot_index SMALLINT NOT NULL UNIQUE CHECK (slot_index BETWEEN 1 AND 6),
    kind TEXT NOT NULL DEFAULT 'harvest' CHECK (kind IN ('harvest', 'unboxing')),
    image_url TEXT,
    title TEXT NOT NULL DEFAULT '',
    harvest_time TEXT NOT NULL DEFAULT '',
    location_tag TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.gallery_shots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read gallery_shots" ON public.gallery_shots;
CREATE POLICY "Public read gallery_shots" ON public.gallery_shots FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manage gallery_shots" ON public.gallery_shots;
CREATE POLICY "Admin manage gallery_shots" ON public.gallery_shots FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Seed the 6 slots from the previous hardcoded SHOTS array so the
-- storefront keeps its current content on first migration.
INSERT INTO public.gallery_shots (slot_index, kind, title, harvest_time, location_tag)
VALUES
    (1, 'harvest', 'Günün ilk kasası', 'Bu sabah 06:38', 'Kuzey Yamaç, Parsel 3'),
    (2, 'harvest', 'Kalibrasyon bandı', 'Bu sabah 08:15', 'Paketleme Tesisi'),
    (3, 'unboxing', '"Kokusu odayı sardı"', 'Dün 19:04', 'İstanbul'),
    (4, 'harvest', 'Jel buz yerleşimi', 'Bu sabah 09:47', 'Paketleme Tesisi'),
    (5, 'unboxing', '"Çocuklar bayıldı"', 'Dün 21:30', 'Ankara'),
    (6, 'harvest', 'Vişne parseli', 'Bu sabah 11:02', 'Güney Yamaç, Parsel 7')
ON CONFLICT (slot_index) DO NOTHING;
