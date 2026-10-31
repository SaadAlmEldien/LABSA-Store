'use client';

import React, { useTransition } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter, type AppLocale } from '@/i18n/routing';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const nextLocale: AppLocale = locale === 'ar' ? 'en' : 'ar';

  function handleSwitchLocale() {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  const isAr = locale === 'ar';

  return (
    <button
      type="button"
      onClick={handleSwitchLocale}
      disabled={isPending}
      aria-label={
        isAr
          ? 'Switch store language to English'
          : 'تغيير لغة المتجر إلى العربية'
      }
      title={isAr ? 'Switch to English' : 'التحويل للعربية'}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-transparent p-1 transition hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-labsa-charcoal disabled:opacity-50 select-none',
        className
      )}
    >
      {/* Arabic indicator */}
      {isAr ? (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1F1F1E] text-[11px] font-bold text-white shadow-2xs leading-none">
          ع
        </span>
      ) : (
        <span className="px-0.5 text-xs font-semibold text-labsa-charcoal/70 transition hover:text-labsa-charcoal leading-none">
          ع
        </span>
      )}

      {/* English indicator */}
      {!isAr ? (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1F1F1E] text-[11px] font-bold text-white shadow-2xs leading-none">
          E
        </span>
      ) : (
        <span className="px-0.5 text-xs font-semibold text-labsa-charcoal/70 transition hover:text-labsa-charcoal leading-none">
          En
        </span>
      )}
    </button>
  );
}
