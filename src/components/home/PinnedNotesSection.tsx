'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Truck, CreditCard, RefreshCw, Ruler } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PinnedNote {
  id: string;
  number: string;
  titleKey: string;
  descKey: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  pinColor: {
    base: string;
    dark: string;
    highlight: string;
    ring: string;
  };
  insetTheme: {
    bg: string;
    border: string;
    numberColor: string;
    badgeBg: string;
  };
  // Pre-calculated intentional stable rotation & vertical stagger (never randomized)
  desktopStyle: {
    rotateClass: string;
  };
  mobileStyle: {
    rotateClass: string;
  };
}

const PINNED_NOTES: PinnedNote[] = [
  {
    id: 'delivery',
    number: '01',
    titleKey: 'trustStrip.item1Title',
    descKey: 'trustStrip.item1Desc',
    icon: Truck,
    pinColor: {
      base: '#C8784C',
      dark: '#9E5630',
      highlight: '#F3B18D',
      ring: '#854220',
    },
    insetTheme: {
      bg: 'bg-[#FDF4EE]',
      border: 'border-[#F6E1D3]',
      numberColor: 'text-[#B06238]',
      badgeBg: 'bg-[#F9E2D4]',
    },
    desktopStyle: {
      rotateClass: 'lg:rotate-[-1.2deg]',
    },
    mobileStyle: {
      rotateClass: 'rotate-0',
    },
  },
  {
    id: 'payment',
    number: '02',
    titleKey: 'trustStrip.item2Title',
    descKey: 'trustStrip.item2Desc',
    icon: CreditCard,
    pinColor: {
      base: '#737352',
      dark: '#525238',
      highlight: '#A2A282',
      ring: '#3E3E28',
    },
    insetTheme: {
      bg: 'bg-[#F4F5EE]',
      border: 'border-[#E3E5D7]',
      numberColor: 'text-[#5C5C3F]',
      badgeBg: 'bg-[#E5E7D8]',
    },
    desktopStyle: {
      rotateClass: 'lg:rotate-[1.0deg]',
    },
    mobileStyle: {
      rotateClass: 'rotate-0',
    },
  },
  {
    id: 'returns',
    number: '03',
    titleKey: 'trustStrip.item3Title',
    descKey: 'trustStrip.item3Desc',
    icon: RefreshCw,
    pinColor: {
      base: '#484844',
      dark: '#2A2A28',
      highlight: '#787870',
      ring: '#1E1E1C',
    },
    insetTheme: {
      bg: 'bg-[#F7F6F3]',
      border: 'border-[#E6E3DC]',
      numberColor: 'text-[#444440]',
      badgeBg: 'bg-[#EAE7DF]',
    },
    desktopStyle: {
      rotateClass: 'lg:rotate-[-0.8deg]',
    },
    mobileStyle: {
      rotateClass: 'rotate-0',
    },
  },
  {
    id: 'sizing',
    number: '04',
    titleKey: 'trustStrip.item4Title',
    descKey: 'trustStrip.item4Desc',
    icon: Ruler,
    pinColor: {
      base: '#BA6D42',
      dark: '#8E4822',
      highlight: '#E8A37C',
      ring: '#733716',
    },
    insetTheme: {
      bg: 'bg-[#FAF2EB]',
      border: 'border-[#F3DDCE]',
      numberColor: 'text-[#9E5630]',
      badgeBg: 'bg-[#F7DFCE]',
    },
    desktopStyle: {
      rotateClass: 'lg:rotate-[1.2deg]',
    },
    mobileStyle: {
      rotateClass: 'rotate-0',
    },
  },
];

/**
 * Realistic Code-Native Push Pin SVG
 * Crafted with circular dome, specular spherical highlight, collar rim, and cast shadow.
 */
function PushPin({ color, id }: { color: PinnedNote['pinColor']; id: string }) {
  return (
    <svg
      width="22"
      height="25"
      viewBox="0 0 28 32"
      className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none drop-shadow-xs"
      aria-hidden="true"
    >
      <defs>
        {/* Soft shadow cast by the pin onto the white paper sheet */}
        <filter id={`pin-shadow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="rgba(48,48,46,0.28)" />
        </filter>

        {/* 3D dome radial gradient for realistic glossy push pin */}
        <radialGradient
          id={`pin-grad-${id}`}
          cx="38%"
          cy="35%"
          r="62%"
          fx="32%"
          fy="28%"
        >
          <stop offset="0%" stopColor={color.highlight} />
          <stop offset="55%" stopColor={color.base} />
          <stop offset="100%" stopColor={color.dark} />
        </radialGradient>

        <linearGradient id={`pin-rim-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color.dark} />
          <stop offset="100%" stopColor={color.ring} />
        </linearGradient>
      </defs>

      {/* Cast shadow under the pin base */}
      <ellipse cx="14" cy="24" rx="7.5" ry="3" fill="rgba(48, 48, 46, 0.22)" filter={`url(#pin-shadow-${id})`} />

      {/* Pin base collar ring */}
      <ellipse cx="14" cy="20" rx="6" ry="2.4" fill={`url(#pin-rim-${id})`} />

      {/* Pin head dome */}
      <circle cx="14" cy="13" r="8.5" fill={`url(#pin-grad-${id})`} />

      {/* Specular high-gloss reflection curve */}
      <ellipse cx="11.5" cy="9.5" rx="3.5" ry="2.2" transform="rotate(-25 11.5 9.5)" fill="#FFFFFF" opacity="0.75" />

      {/* Tiny secondary bottom specular rim reflection */}
      <path
        d="M 9.5 17.5 C 11.5 19 16.5 19 18.5 17.5"
        stroke="#FFFFFF"
        strokeWidth="0.75"
        strokeLinecap="round"
        opacity="0.35"
        fill="none"
      />
    </svg>
  );
}

interface PinnedNotesSectionProps {
  embedded?: boolean;
}

export function PinnedNotesSection({ embedded = false }: PinnedNotesSectionProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const t = useTranslations('Home');

  const Wrapper = embedded ? 'div' : 'section';

  return (
    <Wrapper
      aria-labelledby={embedded ? undefined : 'homepage-pinned-notes-heading'}
      className={cn(
        'relative mx-auto w-full',
        embedded ? '' : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12'
      )}
    >
      {/* Subheading distinguishing shopping information */}
      <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8">
        <p className="text-[11px] font-bold uppercase tracking-wider text-labsa-terracotta-dark">
          {t('trustStrip.sectionEyebrow')}
        </p>
        <h3
          id={embedded ? undefined : 'homepage-pinned-notes-heading'}
          className="mt-1 text-base sm:text-lg lg:text-xl font-extrabold text-labsa-charcoal tracking-tight"
        >
          {t('trustStrip.sectionTitle')}
        </h3>
        <p className="mt-1 text-xs text-labsa-charcoal-muted leading-relaxed">
          {t('trustStrip.sectionSubtitle')}
        </p>
      </div>

      {/* Standalone Pinned Paper Notes Grid:
          - No shared background panel or enclosing board
          - 20-25% smaller footprint, refined padding, compact height
          - Responsive: 4 cols on desktop, 2 cols on tablet, 1 col on mobile
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch">
        {PINNED_NOTES.map((note) => {
          const Icon = note.icon;
          const title = t(note.titleKey);
          const desc = t(note.descKey);

          return (
            <div
              key={note.id}
              className={cn(
                'w-full max-w-[320px] sm:max-w-none mx-auto transition-transform duration-200 ease-out',
                note.desktopStyle.rotateClass,
                note.mobileStyle.rotateClass
              )}
            >
              {/* Paper Sheet Card (Standing on its own) */}
              <article
                tabIndex={0}
                className={cn(
                  'group relative w-full h-full rounded-2xl bg-white p-2.5 sm:p-3 border border-[#ECE6DC] transition-all duration-200 ease-out',
                  'shadow-[0_4px_14px_rgba(48,48,46,0.06),0_1px_3px_rgba(48,48,46,0.03)]',
                  'hover:-translate-y-1 hover:shadow-[0_10px_22px_rgba(48,48,46,0.09)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-labsa-charcoal/30',
                  'motion-reduce:transform-none motion-reduce:transition-none'
                )}
              >
                {/* Scaled Push Pin at Top Center */}
                <PushPin color={note.pinColor} id={note.id} />

                {/* Lightly Tinted Inset Paper Panel (20-25% smaller visual footprint) */}
                <div
                  className={cn(
                    'rounded-xl p-3.5 sm:p-4 flex flex-col justify-between min-h-[165px] sm:min-h-[178px] h-full',
                    note.insetTheme.bg,
                    note.insetTheme.border,
                    'border'
                  )}
                >
                  <div>
                    {/* Top Row: Sequence Number & Subject Icon */}
                    <div className="flex items-center justify-between pb-2">
                      <span
                        className={cn(
                          'font-mono text-sm sm:text-[15px] font-black tracking-wider',
                          note.insetTheme.numberColor
                        )}
                      >
                        {note.number}
                      </span>

                      <div
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-lg shadow-2xs transition-transform duration-200 group-hover:scale-110',
                          note.insetTheme.badgeBg,
                          note.insetTheme.numberColor
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 stroke-[2.25]" aria-hidden="true" />
                      </div>
                    </div>

                    {/* Note Title */}
                    <h4 className="mt-0.5 text-xs sm:text-[13px] font-extrabold text-labsa-charcoal leading-snug">
                      {title}
                    </h4>

                    {/* Note Description */}
                    <p className="mt-1 text-[11px] sm:text-xs text-labsa-charcoal-muted leading-relaxed font-medium">
                      {desc}
                    </p>
                  </div>

                  {/* Bottom subtle indicator bar */}
                  <div className="mt-3 pt-2 border-t border-black/[0.05] flex items-center justify-between text-[10px] font-bold text-labsa-charcoal-light">
                    <span>لَبسة • LABSA</span>
                    <span className="h-1 w-1 rounded-full bg-current opacity-40" aria-hidden="true" />
                  </div>
                </div>
              </article>
            </div>
          );
        })}
      </div>
    </Wrapper>
  );
}
