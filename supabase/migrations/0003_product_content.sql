-- Adds a marketing copy field so the admin Settings CMS can edit the
-- per-package sentence shown on the storefront (ProductsSection), not just
-- price. `products.description` already holds the package/variant label
-- (e.g. "1 KG Deneme Kutusu" — see 0001's seed) and is treated as the
-- package "title" in the admin UI; this column holds the longer sell copy
-- that used to live only in the hardcoded PACKAGES array.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS marketing_copy TEXT;

UPDATE public.products SET marketing_copy = CASE description
    WHEN '1 KG Deneme Kutusu' THEN 'İlk tanışma için ideal. Tek sıra dizilmiş, 26 mm+ kalibre kiraz.'
    WHEN '2 KG Özel Kutu' THEN 'En çok tercih edilen boy. Çift katman EPS kutuda, jel buzlu.'
    WHEN '3 KG Mutfak Kutusu' THEN 'Reçel, şerbet ve dondurmalık — asidi yüksek, aroması derin.'
    WHEN '5 KG Aile Kutusu' THEN 'Kalabalık sofralar ve reçellik ayırmak isteyenler için.'
    ELSE marketing_copy
END
WHERE marketing_copy IS NULL;
