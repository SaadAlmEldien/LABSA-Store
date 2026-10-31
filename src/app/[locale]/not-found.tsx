'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Compass, ShoppingBag } from 'lucide-react';

export default function LocaleNotFoundPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="rounded-3xl border-2 border-dashed border-labsa-cream bg-labsa-white p-8 text-center shadow-craft sm:p-12">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-labsa-surface text-labsa-terracotta-dark">
          <Compass className="h-7 w-7" aria-hidden="true" />
        </div>

        <p className="mt-4 font-mono text-xs font-extrabold uppercase tracking-wider text-labsa-olive-dark">
          404 • LABSA | لَبسة
        </p>

        <h1 className="mt-2 text-2xl font-extrabold text-labsa-charcoal sm:text-3xl">
          {isAr
            ? 'الصفحة أو القطعة المطلوبة غير موجودة'
            : 'Page or Garment Not Found'}
        </h1>

        <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-labsa-charcoal-muted sm:text-sm">
          {isAr
            ? 'قد يكون الرابط غير صحيح أو أن القطعة التي تبحث عنها لم تعد متاحة في الكتالوج النشط حالياً. يمكنك تصفح تشكيلة الرجال أو الأطفال أدناه.'
            : 'The link may be outdated or the garment you are looking for is no longer in the active catalog. Explore our Men’s and Children’s collections below.'}
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/shop"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-labsa-terracotta px-5 py-2.5 text-xs font-extrabold text-labsa-white shadow-craft transition hover:bg-labsa-terracotta-dark"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            <span>{isAr ? 'تصفح جميع المنتجات' : 'Browse All Products'}</span>
          </Link>

          <Link
            href="/men"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-labsa-charcoal px-5 py-2.5 text-xs font-extrabold text-labsa-white transition hover:bg-labsa-olive-dark"
          >
            <span>{isAr ? 'قسم الرجال' : 'Men’s Collection'}</span>
          </Link>

          <Link
            href="/kids"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-labsa-cream bg-labsa-canvas px-5 py-2.5 text-xs font-extrabold text-labsa-charcoal transition hover:border-labsa-terracotta"
          >
            <span>{isAr ? 'قسم الأطفال' : 'Children’s Collection'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
