import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { AppLocale } from '@/i18n/routing';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats an Egyptian Pound (EGP) price clearly in Arabic or English.
 * Example (ar): "750 ج.م"
 * Example (en): "EGP 750"
 */
export function formatEGP(amount: number, locale: AppLocale | string = 'ar'): string {
  const formattedNumber = new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);

  return locale === 'ar' ? `${formattedNumber} ج.م` : `EGP ${formattedNumber}`;
}
