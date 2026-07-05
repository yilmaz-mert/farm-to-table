export const PERISHABLE_NOTICE =
  'Tüketici Kanunu gereği çabuk bozulabilen gıda ürünlerinde cayma ve iade hakkı bulunmamaktadır.'

const SELLER = {
  companyName: 'Dalından Kapıya Tarım Ürünleri',
  address: 'Karadeniz Bölgesi Bahçesi, Türkiye',
  phone: '+90 555 000 00 00',
  email: 'siparis@dalindankapiya.com.tr',
  mersis: '0000000000000000',
  taxId: '1234567890',
  taxOffice: 'İstanbul',
  website: 'www.dalindankapiya.com.tr',
}

export interface LegalContext {
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  buyerAddress: string
  buyerCity: string
  orderDate: string
  items: Array<{
    name: string
    variant: string
    quantity: number
    priceInKurus: number
  }>
  totalInKurus: number
}

function formatTRY(kurus: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(kurus / 100)
}

function itemsTable(ctx: LegalContext): string {
  return ctx.items
    .map(
      (item) =>
        `  • ${item.name} (${item.variant}) × ${item.quantity} adet — ${formatTRY(item.priceInKurus * item.quantity)}`
    )
    .join('\n')
}

export function generateOnBilgilendirmeFormu(ctx: LegalContext): string {
  return `ÖN BİLGİLENDİRME FORMU
(6502 Sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği Kapsamında)

─────────────────────────────────────────
1. SATICI BİLGİLERİ
─────────────────────────────────────────
Unvan      : ${SELLER.companyName}
Adres      : ${SELLER.address}
Telefon    : ${SELLER.phone}
E-posta    : ${SELLER.email}
MERSİS No  : ${SELLER.mersis}
Web Sitesi : ${SELLER.website}

─────────────────────────────────────────
2. ALICI BİLGİLERİ
─────────────────────────────────────────
Ad Soyad   : ${ctx.buyerName}
E-posta    : ${ctx.buyerEmail}
Telefon    : ${ctx.buyerPhone}
Teslimat   : ${ctx.buyerAddress}, ${ctx.buyerCity}

─────────────────────────────────────────
3. SİPARİŞ İÇERİĞİ
─────────────────────────────────────────
${itemsTable(ctx)}

Toplam Tutar : ${formatTRY(ctx.totalInKurus)}
Kargo        : Ücretsiz (soğuk zincir, EPS ambalaj)

─────────────────────────────────────────
4. TESLİMAT BİLGİLERİ
─────────────────────────────────────────
Ürünler hasat tarihinin aynı gün veya ertesi gün sabahı soğuk zincirde kargoya verilir.
Teslimat süresi bölgeye göre 1–2 iş günüdür. Cumartesi ve Pazar günleri kargo çıkışı yapılmamaktadır.
Hasat Pazartesi sabah başlatılır; hafta sonu kapatma kuralı geçerliyse bu bilgi sipariş sayfasında gösterilir.

─────────────────────────────────────────
5. CAYMA HAKKI VE İADE KOŞULLARI
─────────────────────────────────────────
${PERISHABLE_NOTICE}

Mesafeli Sözleşmeler Yönetmeliği Madde 15/1(c) uyarınca; hızla bozulma tehlikesi olan veya son kullanma tarihi geçme ihtimali olan mallar cayma hakkının istisnası kapsamındadır. Organik taze kiraz ve vişne bu kapsamda değerlendirilmektedir.

Hasar, eksik ya da hatalı teslimat durumlarında, ürün elinize ulaştıktan sonra 24 saat içinde ${SELLER.email} adresine fotoğraflı bildirim yapılması gerekmektedir. Satıcı durumu değerlendirerek uygun çözümü sunar.

─────────────────────────────────────────
6. ÖDEME
─────────────────────────────────────────
Ödeme, güvenli ödeme altyapısı üzerinden kredi/banka kartı ile tahsil edilmektedir.
Sipariş onayı e-posta ile iletilir.

─────────────────────────────────────────
7. KİŞİSEL VERİLERİN KORUNMASI
─────────────────────────────────────────
İlettiğiniz kişisel veriler yalnızca siparişinizin işlenmesi ve teslimatın gerçekleştirilmesi amacıyla kullanılmakta; 6698 Sayılı KVKK kapsamında korunmaktadır. Verileriniz üçüncü şahıslarla pazarlama amacıyla paylaşılmamaktadır.

─────────────────────────────────────────
8. UYUŞMAZLIK ÇÖZÜMÜ
─────────────────────────────────────────
Uyuşmazlık durumunda, ikamet adresinizin bağlı olduğu Tüketici Hakem Heyeti veya Tüketici Mahkemesi yetkilidir.
Başvuru için: https://tuketici.ticaret.gov.tr

Form Tarihi : ${ctx.orderDate}
`
}

export function generateKvkkAydinlatmaMetni(ctx: LegalContext): string {
  return `KVKK AYDINLATMA METNİ
(6698 Sayılı Kişisel Verilerin Korunması Kanunu Madde 10 Kapsamında)

─────────────────────────────────────────
1. VERİ SORUMLUSU
─────────────────────────────────────────
6698 Sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verileriniz veri sorumlusu sıfatıyla ${SELLER.companyName} ("Şirket") tarafından aşağıda açıklanan kapsamda işlenebilecektir.

Unvan   : ${SELLER.companyName}
Adres   : ${SELLER.address}
E-posta : ${SELLER.email}
MERSİS  : ${SELLER.mersis}

─────────────────────────────────────────
2. İŞLENEN KİŞİSEL VERİLER
─────────────────────────────────────────
Sipariş sürecinde tarafınıza ait aşağıdaki kişisel veriler işlenmektedir:
  • Kimlik bilgileri (Ad Soyad)
  • İletişim bilgileri (E-posta, telefon)
  • Adres bilgileri (Teslimat adresi, il, posta kodu)
  • İşlem güvenliği ve sipariş bilgileri (Sipariş içeriği, tutar, IP adresi, ödeme onay kaydı)

Alıcı   : ${ctx.buyerName}
E-posta : ${ctx.buyerEmail}

─────────────────────────────────────────
3. İŞLEME AMAÇLARI
─────────────────────────────────────────
Kişisel verileriniz; siparişinizin alınması, hasat planlamasının yapılması, ürünün soğuk zincirde paketlenmesi ve kargoya verilmesi, ödeme işleminin gerçekleştirilmesi ve doğrulanması, fatura düzenlenmesi, yasal saklama yükümlülüklerinin yerine getirilmesi ve müşteri hizmetleri süreçlerinin yürütülmesi amaçlarıyla sınırlı olarak işlenmektedir.

─────────────────────────────────────────
4. HUKUKİ SEBEP VE TOPLAMA YÖNTEMİ
─────────────────────────────────────────
Kişisel verileriniz, KVKK Madde 5/2(c) "bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması" ve Madde 5/2(ç) "veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi" hukuki sebeplerine dayanılarak, işbu sipariş formunun elektronik ortamda doldurulması yoluyla otomatik yollarla toplanmaktadır.

─────────────────────────────────────────
5. KİŞİSEL VERİLERİN AKTARILMASI
─────────────────────────────────────────
Kişisel verileriniz; siparişinizin teslimatının sağlanması amacıyla anlaşmalı kargo firmalarına, ödemenin tahsili amacıyla ödeme altyapısı sağlayıcısına (Iyzico) ve yasal talep halinde yetkili kamu kurum ve kuruluşlarına, KVKK'da öngörülen temel ilkelere uygun ve gerekli güvenlik önlemleri alınarak aktarılabilecektir. Verileriniz pazarlama amacıyla üçüncü şahıslarla paylaşılmamaktadır.

─────────────────────────────────────────
6. VERİ SAHİBİNİN HAKLARI (KVKK MADDE 11)
─────────────────────────────────────────
KVKK'nın 11. maddesi uyarınca, veri sahibi olarak;
  • Kişisel verinizin işlenip işlenmediğini öğrenme,
  • İşlenmişse buna ilişkin bilgi talep etme,
  • İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,
  • Yurt içinde/yurt dışında aktarıldığı üçüncü kişileri bilme,
  • Eksik/yanlış işlenmişse düzeltilmesini isteme,
  • KVKK Madde 7 kapsamında silinmesini/yok edilmesini isteme,
  • Yapılan düzeltme/silme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme,
  • İşlenen verilerin münhasıran otomatik sistemler ile analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme,
  • Kanuna aykırı işleme nedeniyle zarara uğramanız halinde zararın giderilmesini talep etme

haklarına sahipsiniz.

─────────────────────────────────────────
7. BAŞVURU YÖNTEMİ
─────────────────────────────────────────
Yukarıda sayılan haklarınıza ilişkin taleplerinizi ${SELLER.email} adresine yazılı olarak iletebilirsiniz. Talebiniz, niteliğine göre en kısa sürede ve en geç otuz gün içinde ücretsiz olarak sonuçlandırılır.

Metin Tarihi : ${ctx.orderDate}
`
}

export function generateMesafeliSatisSozlesmesi(ctx: LegalContext): string {
  return `MESAFELİ SATIŞ SÖZLEŞMESİ

─────────────────────────────────────────
MADDE 1 — TARAFLAR
─────────────────────────────────────────
SATICI
Unvan   : ${SELLER.companyName}
Adres   : ${SELLER.address}
Tel     : ${SELLER.phone}
E-posta : ${SELLER.email}
MERSİS  : ${SELLER.mersis}
Vergi D.: ${SELLER.taxOffice} / ${SELLER.taxId}

ALICI
Ad Soyad : ${ctx.buyerName}
E-posta  : ${ctx.buyerEmail}
Telefon  : ${ctx.buyerPhone}
Adres    : ${ctx.buyerAddress}, ${ctx.buyerCity}

─────────────────────────────────────────
MADDE 2 — KONU
─────────────────────────────────────────
İşbu sözleşme; aşağıda nitelikleri ve satış fiyatı belirtilen ürün/ürünlerin, 6502 Sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği çerçevesinde satışı ve teslimi ile ilgili olarak SATICI ile ALICI arasındaki hak ve yükümlülükleri düzenlemektedir.

─────────────────────────────────────────
MADDE 3 — ÜRÜNLER VE SATIŞ BEDELİ
─────────────────────────────────────────
${itemsTable(ctx)}

Toplam Satış Bedeli : ${formatTRY(ctx.totalInKurus)} (KDV dahil)
Kargo Bedeli        : Ücretsiz

─────────────────────────────────────────
MADDE 4 — TESLİMAT
─────────────────────────────────────────
Ürünler, ödemenin onaylanmasının ardından hasat planı dahilinde soğuk zincirde kargoya verilir. Teslimat tahmini bölgeye göre 1–2 iş günüdür. Aksi belirtilmedikçe ürünler ${ctx.buyerAddress}, ${ctx.buyerCity} adresine teslim edilecektir.

─────────────────────────────────────────
MADDE 5 — CAYMA HAKKI
─────────────────────────────────────────
${PERISHABLE_NOTICE}

Yönetmelik Madde 15/1(c) uyarınca taze organik meyve ürünleri cayma hakkından muaftır. Hasarlı, eksik veya yanlış ürün teslimi halinde ALICI, ürünü teslim aldıktan sonra 24 saat içinde ${SELLER.email} adresine fotoğraflı bildirim yaparak talepte bulunabilir. Satıcı makul sürede çözüm sunar.

─────────────────────────────────────────
MADDE 6 — GECİKME VE SORUMLULUK
─────────────────────────────────────────
Kargo gecikmelerinde SATICI sorumluluk taşımamakla birlikte, ALICI'yı bilgilendirme yükümlülüğü vardır. Doğal afet, salgın veya benzeri mücbir sebepler nedeniyle yaşanan gecikmelerde her iki taraf da sorumluluktan muaftır.

─────────────────────────────────────────
MADDE 7 — KİŞİSEL VERİLER
─────────────────────────────────────────
ALICI'ya ait kişisel veriler yalnızca sipariş ve teslimat sürecinin yönetilmesi amacıyla işlenmekte ve 6698 Sayılı KVKK kapsamında korunmaktadır.

─────────────────────────────────────────
MADDE 8 — YETKİLİ MAHKEME VE MERCİ
─────────────────────────────────────────
İşbu sözleşmeden doğabilecek uyuşmazlıklarda, ALICI'nın yerleşim yeri Tüketici Hakem Heyeti veya Tüketici Mahkemeleri yetkilidir. Yıllık değer sınırlarına göre hakem heyeti başvurusu zorunludur.

─────────────────────────────────────────
MADDE 9 — YÜRÜRLÜK
─────────────────────────────────────────
ALICI, ödeme adımını tamamlamakla işbu sözleşmeyi, Ön Bilgilendirme Formu'nu ve KVKK Aydınlatma Metni'ni okuduğunu ve kabul ettiğini beyan eder.

Sözleşme Tarihi : ${ctx.orderDate}
`
}
