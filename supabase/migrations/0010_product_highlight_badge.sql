-- Product ribbon ("En Popüler" / "Kilo Başı Avantaj") was hardcoded per
-- package in ProductsSection.tsx's PACKAGES array (`highlight` field).
-- Makes it admin-editable per product row; NULL/empty hides the ribbon.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS highlight_badge TEXT;

UPDATE public.products SET highlight_badge = CASE description
    WHEN '2 KG Özel Kutu' THEN 'En Popüler'
    WHEN '2 KG Özel {fruit} Kutusu' THEN 'En Popüler'
    WHEN 'Organik Kiraz · 2 kg' THEN 'En Popüler'
    WHEN '5 KG Aile Kutusu' THEN 'Kilo Başı Avantaj'
    WHEN '5 KG Aile {fruit} Kutusu' THEN 'Kilo Başı Avantaj'
    WHEN 'Organik Kiraz · 5 kg' THEN 'Kilo Başı Avantaj'
    ELSE highlight_badge
END
WHERE highlight_badge IS NULL;
