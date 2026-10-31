'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import type { CatalogProduct } from '@/data/catalog';
import type { ProductReview } from '@/data/reviews';
import { cn } from '@/lib/utils';
import {
  Star,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  X,
} from 'lucide-react';

interface ClothingRackReviewsProps {
  initialReviews: ProductReview[];
  allProducts: CatalogProduct[];
  embedded?: boolean;
}

export interface PhotographicGarment {
  key: string;
  nameAr: string;
  nameEn: string;
  categoryAr: string;
  categoryEn: string;
  imageWebp: string;
  imagePng: string;
  colorHex: string;
  altAr: string;
  altEn: string;
  shortNameAr: string;
  shortNameEn: string;
  shortNameLine1Ar: string;
  shortNameLine2Ar: string;
  shortNameLine1En: string;
  shortNameLine2En: string;
}

export const FIVE_PHOTOGRAPHIC_GARMENTS: PhotographicGarment[] = [
  // 1. Scarf - Naturally draped artisan cotton/linen scarf on wooden hanger
  {
    key: 'scarf',
    nameAr: 'شال كتان وقطن مصري حرفي',
    nameEn: 'Artisan Egyptian Linen & Cotton Scarf',
    shortNameAr: 'شال كتان',
    shortNameEn: 'Linen Scarf',
    shortNameLine1Ar: 'شال',
    shortNameLine2Ar: 'كتان',
    shortNameLine1En: 'Linen',
    shortNameLine2En: 'Scarf',
    categoryAr: 'إكسسوارات رجالية',
    categoryEn: "Men's Accessories",
    imageWebp: '/reviews-rack/garment-1-scarf.webp',
    imagePng: '/reviews-rack/garment-1-scarf.png',
    colorHex: '#C8784C', // warm terracotta / sand
    altAr: 'شال كتان وقطن مصري معلق على شماعة خشبية',
    altEn: 'Artisan Egyptian linen and cotton scarf on wooden hanger',
  },
  // 2. Trousers - Men's tailored olive chino trousers hanging from clip hanger
  {
    key: 'trousers',
    nameAr: 'بنطلون تشينو قطن تويل بغرز بارزة',
    nameEn: 'Topstitched Cotton Twill Chino Trousers',
    shortNameAr: 'بنطلون تشينو',
    shortNameEn: 'Chino Trousers',
    shortNameLine1Ar: 'بنطلون',
    shortNameLine2Ar: 'تشينو',
    shortNameLine1En: 'Chino',
    shortNameLine2En: 'Trousers',
    categoryAr: 'بناطيل رجالية',
    categoryEn: "Men's Trousers",
    imageWebp: '/reviews-rack/garment-2-trousers.webp',
    imagePng: '/reviews-rack/garment-2-trousers.png',
    colorHex: '#4E503E', // deep olive
    altAr: 'بنطلون تشينو زيتي معلق على شماعة مشابك خشبية',
    altEn: 'Olive chino trousers hanging straight from wooden clip hanger',
  },
  // 3. T-shirt - Everyday classic charcoal crewneck t-shirt on shoulder hanger
  {
    key: 'tshirt',
    nameAr: 'تي شيرت قطني كلاسيكي بلون فحمي',
    nameEn: 'Classic Crewneck Charcoal T-Shirt',
    shortNameAr: 'تي شيرت فحمي',
    shortNameEn: 'Charcoal T-Shirt',
    shortNameLine1Ar: 'تي شيرت',
    shortNameLine2Ar: 'فحمي',
    shortNameLine1En: 'Charcoal',
    shortNameLine2En: 'T-Shirt',
    categoryAr: 'قطنيات أساسية',
    categoryEn: 'Core Essentials',
    imageWebp: '/reviews-rack/garment-3-tshirt.webp',
    imagePng: '/reviews-rack/garment-3-tshirt.png',
    colorHex: '#2E2E2C', // charcoal
    altAr: 'تي شيرت قطني فحمي على شماعة خشبية',
    altEn: 'Charcoal cotton crewneck T-shirt on wooden shoulder hanger',
  },
  // 4. Button-up Shirt - Cream Oxford button-up shirt on shoulder hanger
  {
    key: 'shirt',
    nameAr: 'قميص أوكسفورد قطني كريمي بياقة',
    nameEn: 'Cream Oxford Button-Up Shirt',
    shortNameAr: 'قميص أوكسفورد',
    shortNameEn: 'Oxford Shirt',
    shortNameLine1Ar: 'قميص',
    shortNameLine2Ar: 'أوكسفورد',
    shortNameLine1En: 'Oxford',
    shortNameLine2En: 'Shirt',
    categoryAr: 'قمصان رجالية',
    categoryEn: "Men's Shirts",
    imageWebp: '/reviews-rack/garment-4-shirt.webp',
    imagePng: '/reviews-rack/garment-4-shirt.png',
    colorHex: '#EDE5D8', // warm cream
    altAr: 'قميص أوكسفورد كريمي بأزرار على شماعة خشبية',
    altEn: 'Cream Oxford button-up shirt on wooden shoulder hanger',
  },
  // 5. Jacket / Overshirt - Terracotta heavy twill chore overshirt on coat hanger
  {
    key: 'jacket',
    nameAr: 'جاكيت أوفرشيرت كانفاس بلون تيراكوتا',
    nameEn: 'Terracotta Heavyweight Canvas Overshirt',
    shortNameAr: 'جاكيت كانفاس',
    shortNameEn: 'Canvas Jacket',
    shortNameLine1Ar: 'جاكيت',
    shortNameLine2Ar: 'كانفاس',
    shortNameLine1En: 'Canvas',
    shortNameLine2En: 'Jacket',
    categoryAr: 'جواكت وأوفرشيرت',
    categoryEn: 'Jackets & Overshirts',
    imageWebp: '/reviews-rack/garment-5-jacket.webp',
    imagePng: '/reviews-rack/garment-5-jacket.png',
    colorHex: '#B85830', // terracotta rust
    altAr: 'أوفرشيرت كانفاس تيراكوتا على شماعة خشبية عريضة',
    altEn: 'Terracotta canvas overshirt on wooden coat hanger',
  },
];

export function ClothingRackReviews({
  initialReviews,
  allProducts,
  embedded = false,
}: ClothingRackReviewsProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const t = useTranslations('ReviewsRack');

  // Exactly five review items
  const reviews = initialReviews.slice(0, 5);

  // Active selected garment index (-1 if none selected)
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');

  const rackContainerRef = useRef<HTMLDivElement>(null);
  const reviewBubbleRef = useRef<HTMLDivElement>(null);

  // Match review to product
  const getProductForReview = useCallback(
    (rev: ProductReview) => {
      return (
        allProducts.find(
          (p) => p.id === rev.productId || p.slug === rev.productSlug
        ) ?? null
      );
    },
    [allProducts]
  );

  // Toggle selection on garment click
  const handleToggleGarment = useCallback(
    (index: number) => {
      if (selectedIndex === index) {
        // Close bubble
        setSelectedIndex(-1);
        const rev = reviews[index];
        if (rev) {
          setLiveAnnouncement(
            t('returnedAnnouncement', { name: rev.reviewerName })
          );
        }
      } else {
        // Open bubble for selected garment
        setSelectedIndex(index);
        const rev = reviews[index];
        if (rev) {
          setLiveAnnouncement(
            t('selectedAnnouncement', { name: rev.reviewerName })
          );
        }

        // Smooth scroll ensuring review bubble is visible without being hidden behind fixed navigation
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
          setTimeout(() => {
            const bubbleEl = reviewBubbleRef.current;
            if (!bubbleEl) return;
            const bubbleRect = bubbleEl.getBoundingClientRect();
            const header = document.querySelector('header');
            const headerBottom = header ? header.getBoundingClientRect().bottom + 12 : 72;

            if (bubbleRect.top < headerBottom) {
              window.scrollBy({ top: bubbleRect.top - headerBottom, behavior: 'smooth' });
            } else if (bubbleRect.bottom > window.innerHeight) {
              const overflowBottom = bubbleRect.bottom - window.innerHeight + 16;
              const maxUp = Math.max(0, bubbleRect.top - headerBottom);
              const scrollTarget = Math.min(overflowBottom, maxUp);
              if (scrollTarget > 0) {
                window.scrollBy({ top: scrollTarget, behavior: 'smooth' });
              }
            }
          }, 120);
        }
      }
    },
    [selectedIndex, reviews, t]
  );

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedIndex !== -1) {
        setSelectedIndex(-1);
      }
    };

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        selectedIndex !== -1 &&
        rackContainerRef.current &&
        !rackContainerRef.current.contains(e.target as Node)
      ) {
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [selectedIndex]);

  const selectedReview =
    selectedIndex >= 0 && selectedIndex < reviews.length
      ? reviews[selectedIndex]
      : null;
  const selectedGarment =
    selectedIndex >= 0 && selectedIndex < FIVE_PHOTOGRAPHIC_GARMENTS.length
      ? FIVE_PHOTOGRAPHIC_GARMENTS[selectedIndex]
      : null;
  const selectedProduct = selectedReview
    ? getProductForReview(selectedReview)
    : null;

  const Wrapper = embedded ? 'div' : 'section';

  return (
    <Wrapper
      ref={rackContainerRef}
      aria-labelledby={embedded ? undefined : 'reviews-rack-heading'}
      className={cn(
        'relative mx-auto w-full max-w-5xl',
        embedded ? '' : 'px-4 sm:px-6 lg:px-8 py-6 sm:py-8'
      )}
    >
      {/* Screen reader live region */}
      <div className="sr-only" aria-live="polite" role="status">
        {liveAnnouncement}
      </div>

      {/* Customer Reviews Section Header */}
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-wider text-labsa-olive-dark">
          {t('sectionTag')}
        </p>
        <h2
          id="reviews-rack-heading"
          className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-labsa-charcoal tracking-tight"
        >
          {t('sectionTitle')}
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-labsa-charcoal-muted leading-relaxed">
          {t('sectionSubtitle')}
        </p>

        {/* Click Instruction Pill */}
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-labsa-cream bg-white/95 px-3.5 py-1 shadow-2xs select-none">
          <Sparkles
            className="h-3.5 w-3.5 text-labsa-terracotta shrink-0 animate-pulse"
            aria-hidden="true"
          />
          <span className="text-xs font-bold text-labsa-charcoal">
            {isAr
              ? 'اضغط على أي قطعة لعرض رأي العميل حولها'
              : 'Click any garment to read the customer review'}
          </span>
        </div>
      </div>

      {/* =====================================================================
          COMPACT INTENTIONAL CLOTHING RACK
          - Slim, intentional horizontal rail fitted snugly to the garment group
          - Minimal upright side stanchions behind the first and last pieces
          - All 5 garments have their hanger hooks aligned precisely over the rail
          - Clear, even spacing between garments with zero collisions or overlaps
          - Compact height fitting naturally into the page flow without extra scroll
         ===================================================================== */}
      <div className="relative mt-6 sm:mt-8 mx-auto w-full max-w-4xl">
        {/* The Stand Structure (Framing the 5 garments snugly) */}
        <div className="relative w-full px-2 sm:px-6">
          {/* 1. Slim Brushed Metal Rail running directly through hook loops */}
          <div className="relative mx-auto h-1.5 sm:h-2 w-full rounded-full bg-gradient-to-r from-[#2A2A28] via-[#484844] to-[#2A2A28] border-t border-white/20 shadow-xs z-10">
            {/* Minimal Neat Endcaps */}
            <div className="absolute -start-1 -top-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-[#353532] border border-[#5A5A54] shadow-2xs" />
            <div className="absolute -end-1 -top-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-[#353532] border border-[#5A5A54] shadow-2xs" />

            {/* Minimal Slim Stanchion Legs (Proportional to garment height at all widths) */}
            <div className="absolute start-1.5 top-1 h-[82px] min-[360px]:h-[96px] min-[390px]:h-[108px] min-[430px]:h-[120px] sm:h-[220px] md:h-[285px] w-1.5 rounded-full bg-gradient-to-b from-[#353532] to-[#1F1F1D] pointer-events-none opacity-85 z-0">
              <div className="absolute bottom-0 -start-1 sm:-start-2 h-1 sm:h-1.5 w-3.5 sm:w-5 rounded-full bg-[#1A1A18] shadow-xs" />
            </div>
            <div className="absolute end-1.5 top-1 h-[82px] min-[360px]:h-[96px] min-[390px]:h-[108px] min-[430px]:h-[120px] sm:h-[220px] md:h-[285px] w-1.5 rounded-full bg-gradient-to-b from-[#353532] to-[#1F1F1D] pointer-events-none opacity-85 z-0">
              <div className="absolute bottom-0 -start-1 sm:-start-2 h-1 sm:h-1.5 w-3.5 sm:w-5 rounded-full bg-[#1A1A18] shadow-xs" />
            </div>
          </div>

          {/* 2. Five Evenly Spaced Garments Hanging Directly from the Rail */}
          <div className="relative -mt-1.5 sm:-mt-2 grid grid-cols-5 gap-1 min-[360px]:gap-1.5 sm:gap-4 md:gap-6 px-0.5 sm:px-4 z-20">
            {FIVE_PHOTOGRAPHIC_GARMENTS.map((item, index) => {
              const rev = reviews[index];
              const isSelected = selectedIndex === index;

              return (
                <div key={item.key} className="flex flex-col items-center">
                  {/* Interactive Garment Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleGarment(index)}
                    aria-expanded={isSelected}
                    aria-controls={isSelected ? 'review-bubble-card' : undefined}
                    aria-label={t('garmentAria', {
                      garment: isAr ? item.nameAr : item.nameEn,
                      name: rev?.reviewerName ?? '',
                    })}
                    className={cn(
                      'group relative flex flex-col items-center w-full outline-none cursor-pointer select-none',
                      'transition-all duration-200 rounded-xl',
                      'focus-visible:ring-2 focus-visible:ring-labsa-terracotta focus-visible:ring-offset-1',
                      isSelected
                        ? '-translate-y-1.5 drop-shadow-[0_12px_18px_rgba(0,0,0,0.22)]'
                        : 'hover:-translate-y-1 hover:drop-shadow-[0_10px_14px_rgba(0,0,0,0.14)] drop-shadow-[1px_4px_8px_rgba(0,0,0,0.08)]'
                    )}
                  >
                    {/* Normalized Photographic Image Container */}
                    <div className="relative w-full aspect-[896/1220] max-h-[230px] sm:max-h-[275px] flex items-start justify-center">
                      <picture className="w-full h-full flex items-start justify-center">
                        <source srcSet={item.imageWebp} type="image/webp" />
                        <img
                          src={item.imagePng}
                          alt={isAr ? item.altAr : item.altEn}
                          loading={index < 2 ? 'eager' : 'lazy'}
                          decoding="async"
                          className={cn(
                            'w-full h-full object-contain pointer-events-none select-none transition-transform duration-200',
                            isSelected && 'scale-[1.03]'
                          )}
                        />
                      </picture>
                    </div>

                    {/* Garment Identification Chip directly beneath */}
                    <div className="mt-1 flex flex-col items-center w-full px-0.5">
                      <span
                        className={cn(
                          'inline-flex flex-col sm:flex-row items-center justify-center text-center font-extrabold shadow-2xs border transition-all',
                          'text-[9px] min-[360px]:text-[10px] sm:text-[11px] leading-tight sm:leading-normal',
                          'px-1 min-[360px]:px-1.5 sm:px-2.5 py-0.5 rounded-md sm:rounded-full',
                          'max-w-full sm:max-w-none sm:whitespace-nowrap',
                          isSelected
                            ? 'bg-labsa-charcoal text-white border-labsa-charcoal shadow-sm'
                            : 'bg-white/95 text-labsa-charcoal border-labsa-cream group-hover:bg-white group-hover:border-labsa-terracotta/40'
                        )}
                      >
                        <span className="block sm:inline">{isAr ? item.shortNameLine1Ar : item.shortNameLine1En}</span>
                        <span className="block sm:inline sm:ms-1">{isAr ? item.shortNameLine2Ar : item.shortNameLine2En}</span>
                      </span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* =====================================================================
            3. ANCHORED REVIEW BUBBLE
            - Opens directly beneath the selected garment
            - Pointer tail dynamically aligns with the selected garment's position
            - Clean, legible HTML copy in authentic LABSA brand styling
            - Closes on clicking garment again, close button, Escape, or outside click
           ===================================================================== */}
        {selectedReview && selectedGarment && (
          <div
            ref={reviewBubbleRef}
            id="review-bubble-card"
            role="region"
            aria-label={isAr ? 'تفاصيل التقييم' : 'Review Details'}
            className="relative mx-auto mt-4 w-full max-w-2xl animate-in fade-in slide-in-from-top-1 duration-200 px-2 sm:px-4"
          >
            {/* Dynamic Pointer Tail: exactly under garment center (10%, 30%, 50%, 70%, 90%) */}
            <div
              className="absolute -top-2 h-4 w-4 rotate-45 border-t border-s border-[#D6C5AF] bg-[#FAF7F2] shadow-2xs z-30 transition-all duration-200"
              style={{
                [isAr ? 'right' : 'left']: `calc(${10 + selectedIndex * 20}% - 8px)`,
              }}
              aria-hidden="true"
            />

            {/* Bubble Body Card */}
            <div className="relative rounded-2xl border border-[#D6C5AF] bg-[#FAF7F2] p-3.5 sm:p-6 shadow-lg z-20">
              {/* Header: Garment info, Rating, and Close button */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-black/20 shrink-0"
                    style={{ backgroundColor: selectedGarment.colorHex }}
                    aria-hidden="true"
                  />
                  <span className="text-xs font-extrabold uppercase tracking-wide text-labsa-charcoal">
                    {isAr ? selectedGarment.nameAr : selectedGarment.nameEn}
                  </span>
                  <span className="text-[11px] text-labsa-charcoal-muted hidden sm:inline">
                    • {isAr ? selectedGarment.categoryAr : selectedGarment.categoryEn}
                  </span>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Rating Stars */}
                  <div
                    className="flex items-center gap-0.5"
                    aria-label={`${selectedReview.rating} / 5`}
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'h-3.5 w-3.5',
                          i < selectedReview.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-black/15'
                        )}
                        aria-hidden="true"
                      />
                    ))}
                    <span className="ms-1 font-mono text-xs font-bold text-labsa-charcoal">
                      {selectedReview.rating}.0
                    </span>
                  </div>

                  {/* Close Button with comfortable touch target */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIndex(-1);
                    }}
                    aria-label={isAr ? 'إغلاق نافذة التقييم' : 'Close review bubble'}
                    className="rounded-full p-1.5 sm:p-1 text-labsa-charcoal-muted hover:text-labsa-charcoal hover:bg-black/5 active:bg-black/10 transition cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Product Reference Link if available */}
              {selectedProduct && (
                <div className="mt-2 flex items-center">
                  <Link
                    href={`/product/${selectedProduct.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-labsa-olive-dark hover:text-labsa-charcoal transition hover:underline"
                  >
                    <span className="font-normal text-labsa-charcoal-muted">
                      {t('productLabel')}
                    </span>
                    <span className="underline underline-offset-2">
                      {isAr
                        ? selectedProduct.title.ar
                        : selectedProduct.title.en}
                    </span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </Link>
                </div>
              )}

              {/* Review Title */}
              <h3 className="mt-2.5 text-sm sm:text-base font-extrabold text-labsa-charcoal leading-snug">
                {selectedReview.title}
              </h3>

              {/* Review Comment Quote */}
              <p className="mt-2 text-xs sm:text-sm text-labsa-charcoal leading-relaxed p-3 sm:p-3.5 rounded-xl bg-white/80 border border-labsa-cream select-text">
                “{selectedReview.comment}”
              </p>

              {/* Footer: Reviewer Details, Date, and Badges */}
              <div className="mt-3 pt-2.5 border-t border-black/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-labsa-charcoal">
                  <span className="font-bold">
                    {selectedReview.reviewerName}
                  </span>
                  <span className="text-black/30">•</span>
                  <time
                    dateTime={selectedReview.createdAt}
                    className="text-[11px] font-mono text-labsa-charcoal-muted"
                  >
                    {new Date(selectedReview.createdAt).toLocaleDateString(
                      isAr ? 'ar-EG' : 'en-US',
                      {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      }
                    )}
                  </time>
                </div>

                <div className="flex items-center gap-1.5">
                  {selectedReview.isDemoSample && (
                    <span className="rounded-full bg-labsa-cream/60 text-labsa-charcoal px-2 py-0.5 text-[10px] font-bold border border-[#E9D7BF]">
                      {t('sampleBadge')}
                    </span>
                  )}
                  {selectedReview.isVerifiedDeliveredPurchase && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-700 text-white px-2 py-0.5 text-[10px] font-bold">
                      <ShieldCheck className="h-3 w-3" />
                      {t('verifiedBadge')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Wrapper>
  );
}
