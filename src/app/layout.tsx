import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Plus_Jakarta_Sans, DM_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { LenisProvider } from '@/components/shared/LenisProvider'
import { FloatingWhatsApp } from '@/components/shared/FloatingWhatsApp'
import { CartDrawer } from '@/components/shop/CartDrawer'
import './globals.css'

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const jakartaSans = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})

const dmMono = DM_Mono({
  variable: '--font-dm-mono',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F3EE' },
    { media: '(prefers-color-scheme: dark)', color: '#0C0508' },
  ],
  width: 'device-width',
  initialScale: 1,
}

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dalindankapiya.com.tr'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Dalından Kapıya — Konya’dan Premium Organik Kiraz ve Vişne',
    template: '%s | Dalından Kapıya',
  },
  description:
    'Konya’nın bereketli bahçelerinden hasat edilen sertifikalı organik kiraz ve vişne. Aracısız, soğuk zincirde, hasadın aynı günü kapınıza.',
  keywords: [
    'organik kiraz',
    'organik vişne',
    'konya kiraz',
    'konya organik meyve',
    'sertifikalı organik kiraz',
    'farm to table',
    'dalından kapıya',
    'taze kiraz siparişi',
    'çiftlikten sofraya kiraz',
  ],
  authors: [{ name: 'Dalından Kapıya' }],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Dalından Kapıya',
    url: SITE_URL,
    title: 'Dalından Kapıya — Konya’dan Premium Organik Kiraz ve Vişne',
    description:
      'Konya’nın bereketli bahçelerinden hasat edilen sertifikalı organik kiraz ve vişne. Aracısız, soğuk zincirde, hasadın aynı günü kapınıza.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dalından Kapıya — Konya’dan Premium Organik Kiraz ve Vişne',
    description: 'Konya’nın bereketli bahçelerinden sertifikalı organik kiraz ve vişne.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

const localBusinessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Dalından Kapıya Tarım Ürünleri',
  description:
    'Konya’nın bereketli topraklarından sertifikalı organik kiraz ve vişne üreticisi. Aracısız, soğuk zincirde, hasadın aynı günü kapınıza.',
  url: SITE_URL,
  email: 'siparis@dalindankapiya.com.tr',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Konya',
    addressCountry: 'TR',
  },
  areaServed: 'TR',
  priceRange: '₺₺',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="tr"
      className={`${cormorant.variable} ${jakartaSans.variable} ${dmMono.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <LenisProvider>
            {children}
            <FloatingWhatsApp />
            <CartDrawer />
          </LenisProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
