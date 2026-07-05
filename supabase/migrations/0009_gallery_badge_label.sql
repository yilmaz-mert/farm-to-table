-- Gallery CMS: the badge chip shown on each card ("Bahçeden" / "Kutu
-- Açılışı") was hardcoded per `kind` in GallerySection.tsx (KIND_META).
-- This makes the label text itself admin-editable per slot, independent
-- of `kind` (which still only selects the chip icon).
ALTER TABLE public.gallery_shots ADD COLUMN IF NOT EXISTS badge_label TEXT NOT NULL DEFAULT '';

UPDATE public.gallery_shots SET badge_label = CASE kind
    WHEN 'harvest' THEN 'Bahçeden'
    WHEN 'unboxing' THEN 'Kutu Açılışı'
    ELSE badge_label
END
WHERE badge_label = '';
