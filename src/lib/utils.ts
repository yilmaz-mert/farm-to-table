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
