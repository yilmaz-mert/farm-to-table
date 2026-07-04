'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Loader2, ChevronRight, Lock } from 'lucide-react'
import { useCartStore, cartTotal, type CartItem } from '@/store/cart'
import { formatPrice } from '@/lib/utils'
import {
  generateMesafeliSatisSozlesmesi,
  generateOnBilgilendirmeFormu,
  PERISHABLE_NOTICE,
  type LegalContext,
} from '@/lib/legal/generator'
import { LegalModal } from '@/components/shop/LegalModal'
import { OrderSuccessModal } from '@/components/shop/OrderSuccessModal'

interface FormState {
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
}

interface FormErrors {
  fullName?: string
  email?: string
  phone?: string
  address?: string
  city?: string
}

interface LegalState {
  mssAccepted: boolean
  onBilgiAccepted: boolean
  kvkkAccepted: boolean
}

type ModalDoc = 'mss' | 'onbilgi' | null

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {}
  const parts = form.fullName.trim().split(/\s+/)
  if (parts.length < 2 || parts[0].length < 2) {
    errors.fullName = 'Lütfen ad ve soyadınızı girin.'
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
    errors.email = 'Geçerli bir e-posta adresi girin.'
  }
  const cleanPhone = form.phone.replace(/[\s\-().]/g, '')
  if (!/^(\+90|0)?5\d{9}$/.test(cleanPhone)) {
    errors.phone = 'Geçerli bir Türkiye cep numarası girin (05XX XXX XXXX).'
  }
  if (form.address.trim().length < 10) {
    errors.address = 'Adresinizi daha ayrıntılı girin.'
  }
  if (form.city.trim().length < 2) {
    errors.city = 'Şehir seçin.'
  }
  return errors
}

function hasErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0
}

function buildLegalContext(form: FormState, items: CartItem[], total: number): LegalContext {
  const now = new Date()
  return {
    buyerName: form.fullName,
    buyerEmail: form.email,
    buyerPhone: form.phone,
    buyerAddress: form.address,
    buyerCity: form.city,
    orderDate: now.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    items: items.map((i) => ({
      name: i.name,
      variant: i.variant,
      quantity: i.quantity,
      priceInKurus: i.priceInKurus,
    })),
    totalInKurus: total,
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const items = useCartStore((s) => s.items)
  const clearCart = useCartStore((s) => s.clearCart)

  const [mounted, setMounted] = useState(false)
  const [form, setForm] = useState<FormState>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [legal, setLegal] = useState<LegalState>({
    mssAccepted: false,
    onBilgiAccepted: false,
    kvkkAccepted: false,
  })
  const [legalError, setLegalError] = useState('')
  const [modalDoc, setModalDoc] = useState<ModalDoc>(null)
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')
  const [successData, setSuccessData] = useState<{
    orderId: string
    orderNumber: string
  } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && items.length === 0 && !successData) {
      router.replace('/')
    }
  }, [mounted, items.length, router, successData])

  const total = mounted ? cartTotal(items) : 0
  const mountedItems = mounted ? items : []

  function updateField(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors((e) => ({ ...e, [field]: undefined }))
    }
  }

  function getLegalContext(): LegalContext {
    return buildLegalContext(form, mountedItems, total)
  }

  function getModalContent(): { title: string; content: string } {
    const ctx = getLegalContext()
    if (modalDoc === 'mss') {
      return {
        title: 'Mesafeli Satış Sözleşmesi',
        content: generateMesafeliSatisSozlesmesi(ctx),
      }
    }
    return {
      title: 'Ön Bilgilendirme Formu',
      content: generateOnBilgilendirmeFormu(ctx),
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const validationErrors = validate(form)
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors)
      const first = Object.values(validationErrors)[0]
      setApiError(first ?? '')
      return
    }

    if (!legal.mssAccepted || !legal.onBilgiAccepted || !legal.kvkkAccepted) {
      setLegalError('Ödemeye geçmek için tüm sözleşmeleri kabul etmeniz gerekmektedir.')
      return
    }

    setSubmitting(true)
    setApiError('')
    setLegalError('')

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          postalCode: form.postalCode.trim(),
          items: mountedItems,
          totalInKurus: total,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Sipariş oluşturulamadı. Lütfen tekrar deneyin.')
      }

      if (data.isSandbox) {
        clearCart()
        setSuccessData({ orderId: data.orderId, orderNumber: data.orderNumber })
        return
      }

      if (data.checkoutFormContent) {
        clearCart()
        setSuccessData({ orderId: data.orderId, orderNumber: data.orderNumber })
        // Inject Iyzico checkout form — scripts in innerHTML don't execute, so
        // we recreate them via DOM API to trigger Iyzico's payment overlay.
        const temp = document.createElement('div')
        temp.innerHTML = data.checkoutFormContent
        const form = temp.querySelector('form')
        if (form) {
          document.body.appendChild(form)
          form.submit()
        }
        temp.querySelectorAll('script').forEach((s) => {
          const script = document.createElement('script')
          if ((s as HTMLScriptElement).src) {
            script.src = (s as HTMLScriptElement).src
          } else {
            script.textContent = s.textContent
          }
          document.body.appendChild(script)
        })
        return
      }

      throw new Error('Ödeme başlatılamadı. Lütfen tekrar deneyin.')
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Beklenmedik bir hata oluştu.')
    } finally {
      setSubmitting(false)
    }
  }

  const modalContent = modalDoc ? getModalContent() : null

  return (
    <>
      <div className="bg-background py-10">
        <div className="container-page">
          {/* Page header */}
          <div className="mb-8">
            <div className="flex items-center gap-1.5 font-mono text-xs text-subtle">
              <span>Mağaza</span>
              <ChevronRight className="h-3 w-3" aria-hidden />
              <span className="text-text">Ödeme</span>
            </div>
            <h1 className="mt-3 font-serif text-3xl font-light italic text-text">
              Siparişi Tamamla
            </h1>
            <div className="mt-2 flex items-center gap-1.5 font-sans text-xs text-subtle">
              <Lock className="h-3 w-3" aria-hidden />
              SSL 256-bit şifreli güvenli bağlantı
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
            {/* ── Form ───────────────────────────────────── */}
            <form onSubmit={handleSubmit} noValidate className="space-y-8">
              {/* Delivery info */}
              <section className="rounded-2xl border border-border bg-surface p-6">
                <h2 className="mb-5 font-sans text-base font-semibold text-text">
                  Teslimat Bilgileri
                </h2>

                <div className="space-y-4">
                  {/* Full name */}
                  <div>
                    <label
                      htmlFor="fullName"
                      className="mb-1.5 block font-sans text-xs font-medium text-muted"
                    >
                      Ad Soyad *
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={form.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)}
                      placeholder="Ayşe Kaya"
                      autoComplete="name"
                      className={`w-full rounded-lg border bg-background px-3.5 py-2.5 font-sans text-sm text-text placeholder:text-subtle outline-none transition-colors focus:border-border-strong ${
                        errors.fullName ? 'border-red-400' : 'border-border'
                      }`}
                    />
                    {errors.fullName && (
                      <p className="mt-1 font-sans text-xs text-red-600 dark:text-red-400">
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  {/* Email + Phone */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="email"
                        className="mb-1.5 block font-sans text-xs font-medium text-muted"
                      >
                        E-posta *
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        placeholder="ayse@ornek.com"
                        autoComplete="email"
                        className={`w-full rounded-lg border bg-background px-3.5 py-2.5 font-sans text-sm text-text placeholder:text-subtle outline-none transition-colors focus:border-border-strong ${
                          errors.email ? 'border-red-400' : 'border-border'
                        }`}
                      />
                      {errors.email && (
                        <p className="mt-1 font-sans text-xs text-red-600 dark:text-red-400">
                          {errors.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="phone"
                        className="mb-1.5 block font-sans text-xs font-medium text-muted"
                      >
                        Telefon *
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        placeholder="0532 123 45 67"
                        autoComplete="tel"
                        className={`w-full rounded-lg border bg-background px-3.5 py-2.5 font-sans text-sm text-text placeholder:text-subtle outline-none transition-colors focus:border-border-strong ${
                          errors.phone ? 'border-red-400' : 'border-border'
                        }`}
                      />
                      {errors.phone && (
                        <p className="mt-1 font-sans text-xs text-red-600 dark:text-red-400">
                          {errors.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label
                      htmlFor="address"
                      className="mb-1.5 block font-sans text-xs font-medium text-muted"
                    >
                      Adres *
                    </label>
                    <textarea
                      id="address"
                      value={form.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      placeholder="Mahalle, cadde, sokak, kapı ve daire no"
                      rows={3}
                      autoComplete="street-address"
                      className={`w-full resize-none rounded-lg border bg-background px-3.5 py-2.5 font-sans text-sm text-text placeholder:text-subtle outline-none transition-colors focus:border-border-strong ${
                        errors.address ? 'border-red-400' : 'border-border'
                      }`}
                    />
                    {errors.address && (
                      <p className="mt-1 font-sans text-xs text-red-600 dark:text-red-400">
                        {errors.address}
                      </p>
                    )}
                  </div>

                  {/* City + Postal code */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="city"
                        className="mb-1.5 block font-sans text-xs font-medium text-muted"
                      >
                        İl *
                      </label>
                      <input
                        id="city"
                        type="text"
                        value={form.city}
                        onChange={(e) => updateField('city', e.target.value)}
                        placeholder="İstanbul"
                        autoComplete="address-level1"
                        list="city-list"
                        className={`w-full rounded-lg border bg-background px-3.5 py-2.5 font-sans text-sm text-text placeholder:text-subtle outline-none transition-colors focus:border-border-strong ${
                          errors.city ? 'border-red-400' : 'border-border'
                        }`}
                      />
                      {errors.city && (
                        <p className="mt-1 font-sans text-xs text-red-600 dark:text-red-400">
                          {errors.city}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="postalCode"
                        className="mb-1.5 block font-sans text-xs font-medium text-muted"
                      >
                        Posta Kodu
                      </label>
                      <input
                        id="postalCode"
                        type="text"
                        value={form.postalCode}
                        onChange={(e) => updateField('postalCode', e.target.value)}
                        placeholder="34000"
                        autoComplete="postal-code"
                        maxLength={5}
                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 font-sans text-sm text-text placeholder:text-subtle outline-none transition-colors focus:border-border-strong"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Perishable notice */}
              <div className="rounded-xl border border-border bg-cherry-wash px-4 py-3">
                <p className="font-sans text-xs leading-relaxed text-muted">
                  <span className="font-semibold text-text">Not: </span>
                  {PERISHABLE_NOTICE}
                </p>
              </div>

              {/* Legal checkboxes */}
              <section className="rounded-2xl border border-border bg-surface p-6">
                <h2 className="mb-4 font-sans text-base font-semibold text-text">
                  Sözleşmeler
                </h2>

                <div className="space-y-3.5">
                  {/* MSS */}
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={legal.mssAccepted}
                      onChange={(e) => {
                        setLegal((l) => ({ ...l, mssAccepted: e.target.checked }))
                        if (legalError) setLegalError('')
                      }}
                      className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
                    />
                    <span className="font-sans text-sm text-muted">
                      <button
                        type="button"
                        onClick={() => setModalDoc('mss')}
                        className="font-medium text-primary underline-offset-2 hover:underline"
                      >
                        Mesafeli Satış Sözleşmesi
                      </button>
                      &apos;ni okudum ve kabul ediyorum. *
                    </span>
                  </label>

                  {/* Ön Bilgi */}
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={legal.onBilgiAccepted}
                      onChange={(e) => {
                        setLegal((l) => ({ ...l, onBilgiAccepted: e.target.checked }))
                        if (legalError) setLegalError('')
                      }}
                      className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
                    />
                    <span className="font-sans text-sm text-muted">
                      <button
                        type="button"
                        onClick={() => setModalDoc('onbilgi')}
                        className="font-medium text-primary underline-offset-2 hover:underline"
                      >
                        Ön Bilgilendirme Formu
                      </button>
                      &apos;nu okudum ve onaylıyorum. *
                    </span>
                  </label>

                  {/* KVKK */}
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={legal.kvkkAccepted}
                      onChange={(e) => {
                        setLegal((l) => ({ ...l, kvkkAccepted: e.target.checked }))
                        if (legalError) setLegalError('')
                      }}
                      className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
                    />
                    <span className="font-sans text-sm text-muted">
                      Kişisel verilerimin sipariş ve teslimat amacıyla işlenmesini{' '}
                      <span className="font-medium text-text">KVKK kapsamında</span> onaylıyorum. *
                    </span>
                  </label>

                  {legalError && (
                    <p className="font-sans text-xs text-red-600 dark:text-red-400">{legalError}</p>
                  )}
                </div>
              </section>

              {/* API error */}
              {apiError && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-sans text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-400">
                  {apiError}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-cta py-4 font-sans text-base font-semibold text-inverted shadow-md transition-all hover:bg-cta/90 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99]"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                ) : (
                  <ShieldCheck className="h-5 w-5" aria-hidden />
                )}
                {submitting ? 'İşleniyor…' : 'Güvenli Ödemeye Geç'}
              </button>
            </form>

            {/* ── Order summary sidebar ───────────────── */}
            <aside>
              <div className="sticky top-24 rounded-2xl border border-border bg-surface p-6">
                <h2 className="mb-5 font-sans text-base font-semibold text-text">
                  Sipariş Özeti
                </h2>

                {mountedItems.length === 0 ? (
                  <p className="font-sans text-sm text-muted">Sepetiniz boş.</p>
                ) : (
                  <>
                    <div className="divide-y divide-border">
                      {mountedItems.map((item) => (
                        <div key={item.variantId} className="flex items-start gap-3 py-3.5">
                          <div
                            className="h-10 w-10 shrink-0 rounded-lg"
                            style={{
                              background:
                                'linear-gradient(135deg, oklch(36% 0.16 22), oklch(19% 0.09 22))',
                            }}
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-sans text-sm font-medium text-text">
                              {item.name}
                            </p>
                            <p className="font-sans text-xs text-muted">
                              {item.variant} · {item.quantity} adet
                            </p>
                          </div>
                          <span className="shrink-0 font-mono text-sm font-semibold text-text">
                            {formatPrice(item.priceInKurus * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 space-y-2 border-t border-border pt-4">
                      <div className="flex justify-between font-sans text-sm text-muted">
                        <span>Kargo</span>
                        <span className="font-medium text-verdigris-600 dark:text-verdigris-400">
                          Ücretsiz
                        </span>
                      </div>
                      <div className="flex justify-between font-sans text-base font-bold text-text">
                        <span>Toplam</span>
                        <span className="font-mono">{formatPrice(total)}</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Trust badges */}
                <div className="mt-5 flex flex-col gap-1.5 border-t border-border pt-4">
                  {['SSL 256-bit şifreli', 'Organik sertifikalı', 'Soğuk zincir garantisi'].map(
                    (badge) => (
                      <div key={badge} className="flex items-center gap-2 font-sans text-xs text-subtle">
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
                        {badge}
                      </div>
                    )
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Legal document modal */}
      {modalContent && (
        <LegalModal
          open={modalDoc !== null}
          title={modalContent.title}
          content={modalContent.content}
          onClose={() => setModalDoc(null)}
        />
      )}

      {/* Success modal (sandbox mode) */}
      {successData && (
        <OrderSuccessModal
          open
          orderNumber={successData.orderNumber}
          email={form.email}
          onClose={() => {
            setSuccessData(null)
            router.push('/')
          }}
        />
      )}
    </>
  )
}
