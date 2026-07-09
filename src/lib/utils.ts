import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amountInKurus: number, locale = 'tr-TR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(amountInKurus / 100)
}

export function formatWeight(grams: number): string {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(grams % 1000 === 0 ? 0 : 1)} kg`
  }
  return `${grams} g`
}

/**
 * Tiny shimmer SVG encoded as a data URL, used as `next/image`'s
 * `blurDataURL` for images whose real source is admin-uploaded at runtime
 * (so no build-time blurhash can be generated). Prevents a blank flash
 * while the actual photo streams in — the fixed-aspect wrapper already
 * guarantees zero CLS, this just makes the wait feel intentional.
 */
function shimmerSvg(w: number, h: number): string {
  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g"><stop stop-color="#eee7dd" offset="20%"/><stop stop-color="#e0d5c4" offset="50%"/><stop stop-color="#eee7dd" offset="70%"/></linearGradient></defs><rect width="${w}" height="${h}" fill="#eee7dd"/><rect width="${w}" height="${h}" fill="url(#g)"/></svg>`
}

function toBase64(str: string): string {
  return typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str)
}

export function shimmerBlurDataURL(w = 64, h = 64): string {
  return `data:image/svg+xml;base64,${toBase64(shimmerSvg(w, h))}`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
