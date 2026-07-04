/**
 * Shipping regions & delivery estimation for Turkey.
 * Next-day zone: Marmara + İç Anadolu (motorway trunk routes from the orchard).
 * All other regions: 1–2 business days.
 */

export type DeliveryTier = 'next-day' | 'one-two-days'

export interface CityInfo {
  name: string
  region: string
  tier: DeliveryTier
}

const MARMARA = [
  'İstanbul', 'Bursa', 'Kocaeli', 'Sakarya', 'Tekirdağ', 'Balıkesir',
  'Çanakkale', 'Edirne', 'Kırklareli', 'Yalova', 'Bilecik',
]

const IC_ANADOLU = [
  'Ankara', 'Konya', 'Kayseri', 'Eskişehir', 'Sivas', 'Aksaray',
  'Karaman', 'Kırıkkale', 'Kırşehir', 'Nevşehir', 'Niğde', 'Yozgat', 'Çankırı',
]

const EGE = [
  'İzmir', 'Aydın', 'Denizli', 'Manisa', 'Muğla', 'Afyonkarahisar', 'Kütahya', 'Uşak',
]

const AKDENIZ = [
  'Antalya', 'Adana', 'Mersin', 'Hatay', 'Kahramanmaraş', 'Osmaniye', 'Isparta', 'Burdur',
]

const KARADENIZ = [
  'Samsun', 'Trabzon', 'Ordu', 'Giresun', 'Rize', 'Artvin', 'Gümüşhane',
  'Bayburt', 'Tokat', 'Amasya', 'Çorum', 'Sinop', 'Kastamonu', 'Bartın',
  'Karabük', 'Zonguldak', 'Düzce', 'Bolu',
]

const DOGU_ANADOLU = [
  'Erzurum', 'Erzincan', 'Malatya', 'Elazığ', 'Van', 'Ağrı', 'Kars',
  'Ardahan', 'Iğdır', 'Muş', 'Bitlis', 'Bingöl', 'Tunceli', 'Hakkari',
]

const GUNEYDOGU = [
  'Gaziantep', 'Şanlıurfa', 'Diyarbakır', 'Mardin', 'Batman', 'Siirt',
  'Şırnak', 'Adıyaman', 'Kilis',
]

function withMeta(names: string[], region: string, tier: DeliveryTier): CityInfo[] {
  return names.map((name) => ({ name, region, tier }))
}

export const CITIES: CityInfo[] = [
  ...withMeta(MARMARA, 'Marmara', 'next-day'),
  ...withMeta(IC_ANADOLU, 'İç Anadolu', 'next-day'),
  ...withMeta(EGE, 'Ege', 'one-two-days'),
  ...withMeta(AKDENIZ, 'Akdeniz', 'one-two-days'),
  ...withMeta(KARADENIZ, 'Karadeniz', 'one-two-days'),
  ...withMeta(DOGU_ANADOLU, 'Doğu Anadolu', 'one-two-days'),
  ...withMeta(GUNEYDOGU, 'Güneydoğu Anadolu', 'one-two-days'),
].sort((a, b) => a.name.localeCompare(b.name, 'tr'))

/** Turkish-aware, case/diacritic-insensitive prefix+substring match. */
export function matchCity(query: string): CityInfo[] {
  const q = normalizeTr(query.trim())
  if (!q) return CITIES
  return CITIES.filter((c) => normalizeTr(c.name).includes(q))
}

function normalizeTr(s: string): string {
  return s
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
}

export function tierLabel(tier: DeliveryTier): string {
  return tier === 'next-day' ? 'Ertesi Gün Teslimat' : '1–2 İş Günü'
}
