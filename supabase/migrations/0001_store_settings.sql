-- STORE SETTINGS (Vitrin metinleri ve aciliyet modu — tekil satır)
--
-- Not: Paket fiyatları ve günlük kota için burada ayrı bir alan AÇMIYORUZ.
-- Bu veriler zaten `public.products` (fiyat) ve `public.daily_harvest_logs`
-- (kota) tablolarında var ve admin panelindeki PriceEditor/QuotaController
-- zaten bunları düzenliyor. Aynı veriyi ikinci bir yerde tutmak iki farklı
-- "doğru" kaynak yaratıp senkron dışı kalma riski doğurur. Bu tabloda yalnızca
-- gerçekten yeni olan vitrin metinleri ve aciliyet anahtarı tutuluyor.
CREATE TABLE IF NOT EXISTS public.store_settings (
    id SMALLINT PRIMARY KEY DEFAULT 1,
    hero_title TEXT NOT NULL DEFAULT 'Sabah Dalında, Akşam Kapınızda.',
    hero_subtitle TEXT NOT NULL DEFAULT 'Konya''nın bereketli topraklarında özenle yetiştirilen sertifikalı organik kiraz ve vişne. Aracısız, soğuk zincirde, hasadın aynı günü.',
    scarcity_announcement_text TEXT NOT NULL DEFAULT 'Bugünün hasatından',
    urgency_blitz_mode BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT store_settings_singleton CHECK (id = 1)
);

INSERT INTO public.store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read store_settings" ON public.store_settings FOR SELECT USING (true);

CREATE POLICY "Admin manage store_settings" ON public.store_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Seed the four cherry / sour-cherry packages so the storefront's
-- ProductsSection and the admin PriceEditor share one live pricing source.
-- (ProductsSection was previously fully hardcoded and never read this
-- table at all — see src/components/sections/ProductsSection.tsx.)
-- Prices match the existing hardcoded PACKAGES (kuruş / 100 = TRY).
INSERT INTO public.products (name, description, price_per_kg, total_price, package_weight_kg, is_active)
SELECT * FROM (VALUES
    ('Organik Kiraz', '1 KG Deneme Kutusu', 479.00, 479.00, 1.00, TRUE),
    ('Organik Kiraz', '2 KG Özel Kutu', 424.50, 849.00, 2.00, TRUE),
    ('Organik Vişne', '3 KG Mutfak Kutusu', 330.00, 990.00, 3.00, TRUE),
    ('Organik Kiraz', '5 KG Aile Kutusu', 378.00, 1890.00, 5.00, TRUE)
) AS seed(name, description, price_per_kg, total_price, package_weight_kg, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.products);
