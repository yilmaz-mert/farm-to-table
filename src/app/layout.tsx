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

export const metadata: Metadata = {
  title: {
    default: 'Dalından Kapıya — Premium Organik Kiraz',
    template: '%s | Dalından Kapıya',
  },
  description:
    'Karadeniz yüksek irtifa bahçelerinden hasat edilen sertifikalı organik kiraz ve vişne. Aracısız, soğuk zincirde, hasadın aynı günü kapınıza.',
  keywords: ['organik kiraz', 'organik vişne', 'sertifikalı organik', 'farm to table', 'dalından kapıya', 'taze kiraz'],
  authors: [{ name: 'Dalından Kapıya' }],
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Dalından Kapıya',
    title: 'Dalından Kapıya — Premium Organik Kiraz',
    description:
      'Karadeniz yüksek irtifa bahçelerinden hasat edilen sertifikalı organik kiraz ve vişne.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dalından Kapıya — Premium Organik Kiraz',
    description: 'Karadeniz yüksek irtifa bahçelerinden sertifikalı organik kiraz.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
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
