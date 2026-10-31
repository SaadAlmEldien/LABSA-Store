'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnnouncementItem {
  id: string;
  badgeAr: string;
  badgeEn: string;
  textAr: string;
  textEn: string;
  actionAr: string;
  actionEn: string;
  href: string;
}

/**
 * Authentic promotion and collection details derived strictly from
 * configured catalog data (src/data/catalog.ts) and active coupon seeds (src/data/coupons.ts).
 */
const ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 'winter-2027',
    badgeAr: 'تشكيلة شتاء 2027',
    badgeEn: 'WINTER 2027',
    textAr: 'تشكيلة شتاء 2027 الجديدة متوفرة الآن بأقمشة قطنية مصرية فاخرة',
    textEn: 'Winter 2027 Collection is now live with premium combed Egyptian cotton',
    actionAr: 'تصفح التشكيلة',
    actionEn: 'Explore Collection',
    href: '/shop',
  },
  {
    id: 'coupon-labsa10',
    badgeAr: 'كود خصم 10%',
    badgeEn: '10% OFF CODE',
    textAr: 'خصم 10% ترحيبي بكود LABSA10 للطلبات بقيمة 600 ج.م أو أكثر',
    textEn: '10% Welcome discount with code LABSA10 on orders of EGP 600+',
    actionAr: 'تسوق الآن',
    actionEn: 'Shop Now',
    href: '/shop',
  },
  {
    id: 'coupon-craft100',
    badgeAr: 'خصم 100 ج.م',
    badgeEn: 'EGP 100 OFF',
    textAr: 'خصم مباشر 100 ج.م بكود CRAFT100 عند التسوق بقيمة 1,000 ج.م أو أكثر',
    textEn: 'EGP 100 off with code CRAFT100 when your cart reaches EGP 1,000+',
    actionAr: 'استفد من العرض',
    actionEn: 'Claim Discount',
    href: '/shop',
  },
  {
    id: 'catalog-sales',
    badgeAr: 'تخفيضات الكتالوج',
    badgeEn: 'SPECIAL PRICES',
    textAr: 'تخفيضات خاصة على قطع مختارة من البناطيل والسترات الحضرية',
    textEn: 'Special sale prices on select tailored chinos and jackets',
    actionAr: 'عرض القطع',
    actionEn: 'View Pieces',
    href: '/shop',
  },
];

// Repeat announcements 3 times per block to guarantee the track segment is significantly wider than any screen
const SEQUENCE: AnnouncementItem[] = [
  ...ANNOUNCEMENTS,
  ...ANNOUNCEMENTS,
  ...ANNOUNCEMENTS,
];

export function PromotionalAnnouncementBar() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <aside
      aria-label={
        isAr
          ? 'شريط الإعلانات الترويجية والعروض'
          : 'Promotional Announcements and Offers Bar'
      }
      style={{ backgroundColor: 'rgba(217, 120, 61, 0.82)' }}
      className="group relative z-30 w-full pointer-events-auto overflow-hidden text-white border-b border-[#B85D26]/30 shadow-xs select-none"
    >
      {/* 1. Screen-reader only static announcement: read cleanly once */}
      <div className="sr-only" aria-live="polite">
        {isAr
          ? 'إعلانات متجر لَبسة: تشكيلة شتاء 2027 متوفرة الآن. كود LABSA10 لخصم 10% للطلبات من 600 ج.م. كود CRAFT100 لخصم 100 ج.م للطلبات فوق 1,000 ج.م. تخفيضات خاصة على قطع مختارة.'
          : 'LABSA store announcements: Winter 2027 Collection now available. Code LABSA10 for 10% off orders EGP 600+. Code CRAFT100 for EGP 100 off orders over EGP 1,000. Special sale prices on select items.'}
      </div>

      {/* Bar height hugs text line height with minimal vertical padding (py-0.5 sm:py-1) */}
      <div className="relative flex items-center py-0.5 sm:py-1 min-h-[19px] sm:min-h-[22px]">
        {/* 2. Seamless Marquee Ticker Track with explicit LTR coordinate system for deterministic translateX math */}
        <div
          className="relative flex-1 overflow-hidden"
          dir="ltr"
          style={{
            maskImage:
              'linear-gradient(to right, transparent, black 10px, black calc(100% - 10px), transparent)',
          }}
        >
          <div
            className={cn(
              'labsa-marquee-track flex w-max items-center',
              isAr ? 'labsa-marquee-rtl' : 'labsa-marquee-ltr'
            )}
          >
            {/* Copy 1: Primary active sequence */}
            <div className="flex items-center shrink-0">
              {SEQUENCE.map((item, idx) => (
                <div
                  key={`c1-${item.id}-${idx}`}
                  dir={isAr ? 'rtl' : 'ltr'}
                  className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 text-[9.5px] sm:text-[11.5px] font-semibold whitespace-nowrap leading-tight shrink-0"
                >
                  <span className="inline-flex items-center rounded-full bg-white text-[#B85D26] px-1.5 py-0.5 text-[7.5px] sm:text-[9px] font-black tracking-wide uppercase shadow-2xs leading-none shrink-0">
                    {isAr ? item.badgeAr : item.badgeEn}
                  </span>

                  <span className="text-white tracking-tight font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)] shrink-0 leading-tight">
                    {isAr ? item.textAr : item.textEn}
                  </span>

                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-0.5 font-black text-white hover:text-white/90 underline underline-offset-2 decoration-white/70 hover:decoration-white transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-white shrink-0 leading-tight text-[9px] sm:text-[11px]"
                  >
                    <span>{isAr ? item.actionAr : item.actionEn}</span>
                    <ArrowIcon className="h-2 w-2 sm:h-2.5 sm:w-2.5 stroke-[2.5]" aria-hidden="true" />
                  </Link>

                  <span
                    aria-hidden="true"
                    className="ms-1 sm:ms-2 text-white/40 select-none text-[8px] sm:text-[9px] shrink-0"
                  >
                    ✦
                  </span>
                </div>
              ))}
            </div>

            {/* Copy 2: Exact duplicate for infinite, seamless 0% -> -50% loop */}
            <div className="flex items-center shrink-0" aria-hidden="true">
              {SEQUENCE.map((item, idx) => (
                <div
                  key={`c2-${item.id}-${idx}`}
                  dir={isAr ? 'rtl' : 'ltr'}
                  className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 text-[9.5px] sm:text-[11.5px] font-semibold whitespace-nowrap leading-tight shrink-0"
                >
                  <span className="inline-flex items-center rounded-full bg-white text-[#B85D26] px-1.5 py-0.5 text-[7.5px] sm:text-[9px] font-black tracking-wide uppercase shadow-2xs leading-none shrink-0">
                    {isAr ? item.badgeAr : item.badgeEn}
                  </span>

                  <span className="text-white tracking-tight font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)] shrink-0 leading-tight">
                    {isAr ? item.textAr : item.textEn}
                  </span>

                  <Link
                    href={item.href}
                    tabIndex={-1}
                    className="inline-flex items-center gap-0.5 font-black text-white hover:text-white/90 underline underline-offset-2 decoration-white/70 hover:decoration-white transition-colors shrink-0 leading-tight text-[9px] sm:text-[11px]"
                  >
                    <span>{isAr ? item.actionAr : item.actionEn}</span>
                    <ArrowIcon className="h-2 w-2 sm:h-2.5 sm:w-2.5 stroke-[2.5]" aria-hidden="true" />
                  </Link>

                  <span
                    aria-hidden="true"
                    className="ms-1 sm:ms-2 text-white/40 select-none text-[8px] sm:text-[9px] shrink-0"
                  >
                    ✦
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Embedded CSS Keyframes & Responsive Behavior */}
      <style jsx global>{`
        /* Base ticker animation settings */
        .labsa-marquee-track {
          will-change: transform;
        }

        /* Arabic RTL direction: text continuously travels right-to-left (speed reduced by ~25%) */
        .labsa-marquee-rtl {
          animation: marqueeRTL 38s linear infinite;
        }

        /* English LTR direction: text continuously travels left-to-right (speed reduced by ~25%) */
        .labsa-marquee-ltr {
          animation: marqueeLTR 38s linear infinite;
        }

        @media (min-width: 640px) {
          .labsa-marquee-rtl {
            animation-duration: 50s;
          }
          .labsa-marquee-ltr {
            animation-duration: 50s;
          }
        }

        /* Seamless Right-to-Left loop (0% to -50% of the 2-copy track = exactly 1 copy width) */
        @keyframes marqueeRTL {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        /* Seamless Left-to-Right loop (-50% to 0% of the 2-copy track = exactly 1 copy width) */
        @keyframes marqueeLTR {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0%);
          }
        }

        /* Pause on hover */
        .group:hover .labsa-marquee-track {
          animation-play-state: paused;
        }

        /* Pause on keyboard focus-within */
        .group:focus-within .labsa-marquee-track {
          animation-play-state: paused;
        }

        /* Respect user preference for reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .labsa-marquee-rtl,
          .labsa-marquee-ltr {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </aside>
  );
}
