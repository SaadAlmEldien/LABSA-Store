import React from 'react';
import { LABSA_BRAND } from '@/config/theme';
import { cn } from '@/lib/utils';

interface LabsaFullLogoProps {
  alt: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}

/**
 * Renders the untouched, complete LABSA illustrated logo lockup (`labsa-logo.webp`
 * with `labsa-logo.png` fallback) inside a pure white (`#FFFFFF`) container to
 * preserve its white background, colors, Arabic wordmark, tagline, and 3:2 aspect ratio.
 */
export function LabsaFullLogo({
  alt,
  className,
  imageClassName,
  priority = false,
}: LabsaFullLogoProps) {
  return (
    <div
      className={cn(
        'flex w-full max-w-full min-w-0 items-center justify-center rounded-2xl border border-labsa-cream/70 bg-labsa-white p-3 shadow-craft',
        className
      )}
    >
      <picture className="block w-full max-w-full">
        <source srcSet={LABSA_BRAND.assets.logoWebp} type="image/webp" />
        <img
          src={LABSA_BRAND.assets.logoPng}
          alt={alt}
          width={LABSA_BRAND.assets.width}
          height={LABSA_BRAND.assets.height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={cn(
            'mx-auto block h-auto w-full max-w-[320px] select-none object-contain',
            imageClassName
          )}
        />
      </picture>
    </div>
  );
}

interface LabsaCompactWordmarkProps {
  className?: string;
  showTagline?: boolean;
}

/**
 * Readable compact header wordmark for sticky navigation bars, following
 * BRAND_GUIDE.md rule: "If a compact header treatment is needed,
 * use a legible Arabic text wordmark and retain the supplied full logo elsewhere
 * on the page. Do not invent a new symbol."
 */
export function LabsaCompactWordmark({
  className,
  showTagline = true,
}: LabsaCompactWordmarkProps) {
  return (
    <span
      className={cn(
        'inline-flex min-w-0 flex-col justify-center rounded-xl border border-dashed border-labsa-terracotta/50 bg-labsa-white px-2.5 py-1.5 sm:px-3',
        className
      )}
    >
      <span className="flex items-baseline gap-1.5 leading-none sm:gap-2">
        <span className="font-arabic text-lg font-bold tracking-normal text-labsa-charcoal sm:text-xl">
          {LABSA_BRAND.name.ar}
        </span>
        <span
          aria-hidden="true"
          className="h-3.5 w-[1.5px] shrink-0 bg-labsa-terracotta/60"
        />
        <span className="font-english text-sm font-extrabold tracking-wider text-labsa-olive-dark sm:text-base">
          {LABSA_BRAND.name.en}
        </span>
      </span>
      {showTagline && (
        <span className="mt-1 hidden font-arabic text-[11px] font-medium leading-none text-labsa-charcoal-muted sm:block">
          {LABSA_BRAND.tagline.ar}
        </span>
      )}
    </span>
  );
}
