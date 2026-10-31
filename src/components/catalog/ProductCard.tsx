'use client';

import React, { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  type CatalogProduct,
  getCategoryByKey,
  getLocalizedText,
  isProductInStock,
} from '@/data/catalog';
import {
  type ProductRatingSummary,
  getProductRatingSummary,
  getStaticProductRatingSummary,
} from '@/data/reviews';
import { useWishlist } from '@/context/WishlistContext';
import { formatEGP, cn } from '@/lib/utils';
import { ArrowUpLeft, ArrowUpRight, Heart, Star } from 'lucide-react';

interface ProductCardProps {
  product: CatalogProduct;
  initialRatingSummary?: ProductRatingSummary | null;
}

/**
 * Custom asset-specific focal position to ensure garments and models
 * are cleanly framed and centered without awkward cutoffs.
 */
function getProductImageObjectFit(productId: string, imageUrl: string): string {
  if (imageUrl.endsWith('.svg')) {
    return 'object-contain object-center p-3';
  }

  // Trousers & bottoms: center-lower focus to showcase tailoring and hem details
  if (
    productId === 'prod-men-01' || // olive chinos
    productId === 'prod-men-07' || // charcoal cargos
    productId === 'prod-kids-05'    // twill joggers
  ) {
    return 'object-cover object-[center_32%]';
  }

  // Shirts & tailored blazers: upper-chest focus
  if (
    productId === 'prod-men-02' || // blazer
    productId === 'prod-men-04' || // overshirt
    productId === 'prod-men-05'    // oxford shirt
  ) {
    return 'object-cover object-[center_24%]';
  }

  // Heavyweight hoodies, crewnecks, jackets & overalls
  if (
    productId === 'prod-men-03' ||
    productId === 'prod-men-08' ||
    productId === 'prod-kids-01' ||
    productId === 'prod-kids-02' ||
    productId === 'prod-kids-04' ||
    productId === 'prod-kids-06'
  ) {
    return 'object-cover object-[center_28%]';
  }

  // T-shirts
  if (productId === 'prod-men-06' || productId === 'prod-kids-03') {
    return 'object-cover object-[center_30%]';
  }

  return 'object-cover object-center';
}

export function ProductCard({
  product,
  initialRatingSummary,
}: ProductCardProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const tCatalog = useTranslations('Catalog');
  const tWishlist = useTranslations('Wishlist');
  const { isInWishlist, toggleWishlist } = useWishlist();

  const ActionArrow = isAr ? ArrowUpLeft : ArrowUpRight;
  const wishlisted = isInWishlist(product.id);
  const productTitle = getLocalizedText(product.title, locale);

  // Gallery state
  const initialIndex = Math.max(
    0,
    product.images.findIndex((img) => img.isPrimary)
  );
  const [activeImageIndex, setActiveImageIndex] = useState(initialIndex);

  const images = product.images.length > 0 ? product.images : [];
  const currentImage = images[activeImageIndex] ?? images[0];
  const [imgSrc, setImgSrc] = useState(currentImage?.url ?? '');

  const handleSelectImage = (idx: number) => {
    setActiveImageIndex(idx);
    if (images[idx]) {
      setImgSrc(images[idx].url);
    }
  };

  const inStock = isProductInStock(product);
  const hasSale =
    typeof product.previousPriceEgp === 'number' &&
    product.previousPriceEgp > product.priceEgp;

  // Stable rating snapshot for initial render ensures 100% server/client parity during hydration
  const stableInitialRating =
    initialRatingSummary !== undefined
      ? initialRatingSummary
      : getStaticProductRatingSummary(product.id);

  const [ratingSummary, setRatingSummary] = useState<ProductRatingSummary | null>(
    stableInitialRating
  );

  useEffect(() => {
    // Only after hydration has completed on the client, synchronize with fresher local reviews
    const fresh = getProductRatingSummary(product.id);
    setRatingSummary(fresh);

    const handleUpdate = () => {
      setRatingSummary(getProductRatingSummary(product.id));
    };
    window.addEventListener('labsa:reviews-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('labsa:reviews-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [product.id]);

  // Category & Audience descriptors
  const categoryDef = getCategoryByKey(product.category);
  const categoryLabel = categoryDef
    ? getLocalizedText(categoryDef.name, locale)
    : product.category;

  const audienceBadge =
    product.audience === 'men'
      ? tCatalog('audienceMen')
      : tCatalog('audienceKids');

  // Short fabric/material descriptor when available
  const materialRaw = product.details?.material
    ? getLocalizedText(product.details.material, locale)
    : '';
  const shortMaterial = materialRaw
    ? materialRaw.split(/[،,(]/)[0].trim()
    : '';

  const descriptor = shortMaterial
    ? `${audienceBadge} • ${categoryLabel} • ${shortMaterial}`
    : `${audienceBadge} • ${categoryLabel}`;

  // Top-end status label (shown when genuine customer rating is not available)
  let statusOverlayLabel: string | null = null;
  if (!inStock) {
    statusOverlayLabel = tCatalog('badgeOutOfStock');
  } else if (hasSale) {
    statusOverlayLabel = tCatalog('badgeSale');
  } else if (product.isNew) {
    statusOverlayLabel = tCatalog('badgeNew');
  } else if (product.isFeatured) {
    statusOverlayLabel = isAr ? 'مميز' : 'Featured';
  }

  // Small status pill badge opposite the title on Row 1 (matching reference "Top rated" outline badge)
  let titleRowBadge: string | null = null;
  if (ratingSummary && ratingSummary.averageRating >= 4.5) {
    titleRowBadge = isAr ? 'الأعلى تقييماً' : 'Top rated';
  } else if (hasSale) {
    titleRowBadge = tCatalog('badgeSale');
  } else if (!inStock) {
    titleRowBadge = tCatalog('badgeOutOfStock');
  } else if (product.isNew) {
    titleRowBadge = tCatalog('badgeNew');
  } else if (product.isFeatured) {
    titleRowBadge = isAr ? 'مميز' : 'Featured';
  }

  const imageFitStyle = getProductImageObjectFit(product.id, imgSrc || currentImage?.url || '');

  return (
    <article
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden rounded-[20px] sm:rounded-[30px] border bg-white p-2 min-[360px]:p-2.5 sm:p-3.5 shadow-[0_2px_14px_rgba(43,45,66,0.03)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(43,45,66,0.08)] focus-within:ring-2 focus-within:ring-labsa-charcoal/20',
        inStock
          ? 'border-labsa-cream/80 hover:border-labsa-charcoal/30'
          : 'border-labsa-cream/60 opacity-90'
      )}
    >
      <div>
        {/* 1. Inset Media Panel (~1.1:1 width-to-height proportion matching reference) */}
        <div className="relative aspect-[1.1/1] w-full overflow-hidden rounded-[14px] sm:rounded-[22px] bg-[#F4F2EC]">
          <Link
            href={`/product/${product.slug}`}
            className="block h-full w-full"
            tabIndex={-1}
            aria-hidden="true"
          >
            {currentImage && (
              <img
                src={imgSrc || currentImage.url}
                alt={getLocalizedText(currentImage.alt, locale)}
                loading="lazy"
                onError={() => {
                  if (
                    currentImage.fallbackUrl &&
                    imgSrc !== currentImage.fallbackUrl
                  ) {
                    setImgSrc(currentImage.fallbackUrl);
                  }
                }}
                className={cn(
                  'h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.03]',
                  imageFitStyle
                )}
              />
            )}
          </Link>

          {/* Top-start: Translucent Category / Product-Detail Pills */}
          <div className="pointer-events-none absolute start-1.5 top-1.5 sm:start-3 sm:top-3 z-10 flex flex-wrap items-center gap-1 sm:gap-1.5">
            <span className="hidden sm:inline-flex items-center rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md border border-white/10 shadow-xs">
              {audienceBadge}
            </span>
            <span className="inline-flex items-center rounded-full bg-black/25 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-medium text-white backdrop-blur-md border border-white/10 shadow-xs">
              {categoryLabel}
            </span>
          </div>

          {/* Top-end: Rating Pill (if genuine reviews exist) or Valid Status Label + Wishlist Control */}
          <div className="absolute end-1.5 top-1.5 sm:end-3 sm:top-3 z-10 flex items-center gap-1 sm:gap-1.5">
            {ratingSummary && ratingSummary.totalApprovedCount > 0 ? (
              <div
                title={`${ratingSummary.averageRating} (${ratingSummary.totalApprovedCount} ${isAr ? 'تقييم' : 'reviews'})`}
                className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full bg-black/25 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-bold text-white backdrop-blur-md border border-white/10 shadow-xs"
              >
                <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-amber-300 text-amber-300" aria-hidden="true" />
                <span>{ratingSummary.averageRating.toFixed(1)}</span>
              </div>
            ) : statusOverlayLabel ? (
              <span className="inline-flex items-center rounded-full bg-black/25 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-bold text-white backdrop-blur-md border border-white/10 shadow-xs">
                {statusOverlayLabel}
              </span>
            ) : null}

            {/* Wishlist Button */}
            <button
              type="button"
              aria-pressed={wishlisted}
              aria-label={
                wishlisted
                  ? tWishlist('removeAria', { title: productTitle })
                  : tWishlist('addAria', { title: productTitle })
              }
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(product.id, product.slug);
              }}
              className={cn(
                'inline-flex h-7 w-7 sm:h-7.5 sm:w-7.5 items-center justify-center rounded-full transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-labsa-charcoal shadow-xs touch-manipulation',
                wishlisted
                  ? 'bg-labsa-terracotta text-white hover:bg-labsa-terracotta-dark'
                  : 'bg-black/25 text-white backdrop-blur-md border border-white/10 hover:bg-white hover:text-labsa-terracotta hover:border-white'
              )}
            >
              <Heart
                className={cn(
                  'h-3.5 w-3.5 transition-transform active:scale-125',
                  wishlisted && 'fill-current'
                )}
                aria-hidden="true"
              />
            </button>
          </div>

          {/* Bottom-center: Gallery Pagination Dots (usable via mouse, touch, and keyboard) */}
          {images.length > 1 && (
            <div
              role="tablist"
              aria-label={isAr ? 'معرض صور المنتج' : 'Product image gallery'}
              className="absolute bottom-1.5 sm:bottom-2.5 inset-x-0 z-10 flex items-center justify-center gap-1 sm:gap-1.5 pointer-events-auto"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              {images.map((img, idx) => {
                const isActive = idx === activeImageIndex;
                return (
                  <button
                    key={img.id || idx}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`${isAr ? 'صورة' : 'Image'} ${idx + 1}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelectImage(idx);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        handleSelectImage((idx + 1) % images.length);
                      } else if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        handleSelectImage((idx - 1 + images.length) % images.length);
                      }
                    }}
                    onMouseEnter={() => handleSelectImage(idx)}
                    className={cn(
                      'rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                      isActive
                        ? 'h-1.5 w-3 sm:w-3.5 bg-white shadow-xs'
                        : 'h-1.5 w-1.5 bg-white/45 hover:bg-white/80'
                    )}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Lower Information Section */}
        <div className="flex flex-col px-0.5 pt-2 min-[360px]:pt-2.5 sm:px-1 sm:pt-4">
          {/* Row 1: Product Title & Opposite Refined Status Pill Badge */}
          <div className="flex items-start justify-between gap-1.5 sm:gap-2">
            <h3 className="line-clamp-2 min-h-[2.2rem] sm:min-h-0 sm:line-clamp-1 text-xs min-[360px]:text-[13px] sm:text-base font-extrabold text-labsa-charcoal leading-snug transition-colors group-hover:text-labsa-terracotta">
              <Link
                href={`/product/${product.slug}`}
                className="focus-visible:outline-none focus-visible:underline"
              >
                {productTitle}
              </Link>
            </h3>

            {titleRowBadge && (
              <span className="hidden sm:inline-flex shrink-0 items-center rounded-full border border-labsa-cream/90 bg-labsa-canvas px-2.5 py-0.5 text-[10.5px] sm:text-[11px] font-bold text-labsa-charcoal/80">
                {titleRowBadge}
              </span>
            )}
          </div>

          {/* Row 2: Metadata Line (Department • Category • Fabric) */}
          <p className="mt-1 truncate text-[10.5px] sm:text-xs font-medium text-labsa-charcoal-muted">
            {descriptor}
          </p>

          {/* Row 3: Product Description (Compact 1 line clamp) */}
          {product.shortDescription && (
            <p className="mt-1 line-clamp-1 text-[10.5px] sm:text-xs text-labsa-charcoal-light leading-relaxed">
              {getLocalizedText(product.shortDescription, locale)}
            </p>
          )}
        </div>
      </div>

      {/* 3. Bottom Row: Price & Reference-Matched Capsule CTA Button */}
      <div className="mt-2.5 sm:mt-3.5 flex items-center justify-between gap-1.5 sm:gap-2 px-0.5 sm:px-1 pt-1.5 sm:pt-2 border-t border-labsa-cream/40 sm:border-transparent">
        {/* Price Display */}
        <div className="flex flex-col justify-center min-w-0">
          {hasSale && product.previousPriceEgp && (
            <span className="text-[10px] sm:text-[11px] font-semibold text-labsa-charcoal-light line-through leading-none">
              {formatEGP(product.previousPriceEgp, locale)}
            </span>
          )}
          <span className="text-xs min-[360px]:text-[13px] sm:text-[17px] font-extrabold text-labsa-charcoal tracking-tight leading-tight truncate">
            {formatEGP(product.priceEgp, locale)}
          </span>
        </div>

        {/* Responsive Action Button: Sleek icon button on mobile, full capsule on sm+ */}
        <Link
          href={`/product/${product.slug}`}
          aria-label={isAr ? `عرض ${productTitle}` : `View ${productTitle}`}
          className="group/btn inline-flex h-8 w-8 sm:h-auto sm:w-auto shrink-0 items-center justify-center sm:justify-start gap-0 sm:gap-2 rounded-full bg-labsa-charcoal sm:py-1.5 sm:ps-4 sm:pe-1.5 text-xs sm:text-[13px] font-bold text-white shadow-xs transition-all duration-200 hover:bg-black active:scale-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-labsa-charcoal touch-manipulation"
        >
          <span className="hidden sm:inline whitespace-nowrap font-bold text-white">
            {isAr ? 'عرض المنتج' : 'View product'}
          </span>
          <span className="inline-flex h-6 w-6 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full bg-white/15 sm:bg-white text-white sm:text-labsa-charcoal shadow-xs transition-transform duration-200 group-hover/btn:scale-105">
            <ActionArrow className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden="true" />
          </span>
        </Link>
      </div>
    </article>
  );
}
