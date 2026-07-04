-- 1. PROFILES TABLOSU (Admin ve Kullanıcı Rolleri)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUCTS TABLOSU (Kiraz Paketleri ve Dinamik Fiyatlandırma)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price_per_kg NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    package_weight_kg NUMERIC(4, 2) NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DAILY HARVEST LOGS TABLOSU (Canlı Hasat Sayaç ve Galeri)
CREATE TABLE IF NOT EXISTS public.daily_harvest_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    harvest_date DATE DEFAULT CURRENT_DATE UNIQUE,
    total_box_quota INTEGER NOT NULL DEFAULT 50,
    remaining_boxes INTEGER NOT NULL DEFAULT 50,
    daily_photos TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ORDERS TABLOSU (Sipariş Yönetimi ve TTL Stok Koruma)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    city TEXT NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending_payment' CHECK (
        status IN ('pending_payment', 'new_order', 'harvesting', 'packed', 'shipped', 'cancelled')
    ),
    is_weekend_blackout BOOLEAN DEFAULT FALSE,
    scheduled_ship_date DATE,
    tracking_number TEXT,
    invoice_url TEXT,
    reserved_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ORDER ITEMS TABLOSU
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_harvest_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Herkes aktif ürünleri ve günlük hasat sayacını okuyabilir
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read daily_harvest" ON public.daily_harvest_logs FOR SELECT USING (true);

-- Misafir veya giriş yapmış kullanıcılar sipariş oluşturabilir
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert order_items" ON public.order_items FOR INSERT WITH CHECK (true);

-- Admin yetkisi kontrolü
CREATE POLICY "Admin manage products" ON public.products FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admin manage daily_harvest" ON public.daily_harvest_logs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admin manage orders" ON public.orders FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);