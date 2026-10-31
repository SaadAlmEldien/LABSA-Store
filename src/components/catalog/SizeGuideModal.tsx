'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import type { Audience } from '@/data/catalog';
import { cn } from '@/lib/utils';
import { Ruler, X } from 'lucide-react';

interface SizeGuideContentProps {
  defaultAudience?: Audience;
}

export function SizeGuideTables({ defaultAudience = 'men' }: SizeGuideContentProps) {
  const t = useTranslations('SizeGuide');
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<Audience>(defaultAudience);

  useEffect(() => {
    setActiveTab(defaultAudience);
  }, [defaultAudience]);

  const menRows = [
    { size: 'S (30)', chest: '92 – 96', waist: '76 – 80', hip: '94 – 98' },
    { size: 'M (32)', chest: '97 – 102', waist: '81 – 86', hip: '99 – 104' },
    { size: 'L (34)', chest: '103 – 108', waist: '87 – 92', hip: '105 – 110' },
    { size: 'XL (36)', chest: '109 – 115', waist: '93 – 99', hip: '111 – 117' },
    { size: 'XXL (38)', chest: '116 – 122', waist: '100 – 106', hip: '118 – 124' },
  ];

  const kidsRows = [
    {
      size: '2-3Y',
      age: locale === 'ar' ? '2 – 3 سنوات' : '2 – 3 Years',
      height: '92 – 98',
      chest: '53 – 55',
      waist: '50 – 52',
    },
    {
      size: '4-5Y',
      age: locale === 'ar' ? '4 – 5 سنوات' : '4 – 5 Years',
      height: '104 – 110',
      chest: '56 – 58',
      waist: '53 – 55',
    },
    {
      size: '6-7Y',
      age: locale === 'ar' ? '6 – 7 سنوات' : '6 – 7 Years',
      height: '116 – 122',
      chest: '60 – 63',
      waist: '56 – 58',
    },
    {
      size: '8-9Y',
      age: locale === 'ar' ? '8 – 9 سنوات' : '8 – 9 Years',
      height: '128 – 134',
      chest: '65 – 69',
      waist: '59 – 62',
    },
    {
      size: '10-12Y',
      age: locale === 'ar' ? '10 – 12 سنة' : '10 – 12 Years',
      height: '140 – 152',
      chest: '71 – 78',
      waist: '63 – 67',
    },
  ];

  return (
    <div>
      {/* Audience Tabs */}
      <div
        role="tablist"
        aria-label={t('modalTitle')}
        className="flex rounded-xl border border-labsa-cream bg-labsa-canvas p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'men'}
          onClick={() => setActiveTab('men')}
          className={cn(
            'flex-1 rounded-lg px-4 py-2 text-xs font-bold transition sm:text-sm',
            activeTab === 'men'
              ? 'bg-labsa-charcoal text-labsa-white shadow-sm'
              : 'text-labsa-charcoal-muted hover:text-labsa-charcoal'
          )}
        >
          {t('tabMen')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'kids'}
          onClick={() => setActiveTab('kids')}
          className={cn(
            'flex-1 rounded-lg px-4 py-2 text-xs font-bold transition sm:text-sm',
            activeTab === 'kids'
              ? 'bg-labsa-terracotta text-labsa-white shadow-sm'
              : 'text-labsa-charcoal-muted hover:text-labsa-charcoal'
          )}
        >
          {t('tabKids')}
        </button>
      </div>

      {/* Measurement Table */}
      {activeTab === 'men' ? (
        <div className="mt-5">
          <div className="overflow-x-auto rounded-xl border border-labsa-cream">
            <table className="w-full text-start text-xs sm:text-sm">
              <thead className="border-b border-labsa-cream bg-labsa-surface text-labsa-charcoal">
                <tr>
                  <th className="px-4 py-3 text-start font-bold">{t('colSize')}</th>
                  <th className="px-4 py-3 text-start font-bold">{t('colChest')}</th>
                  <th className="px-4 py-3 text-start font-bold">{t('colWaist')}</th>
                  <th className="px-4 py-3 text-start font-bold">{t('colHip')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-labsa-cream/70 bg-labsa-white font-mono">
                {menRows.map((row) => (
                  <tr key={row.size} className="hover:bg-labsa-canvas/60">
                    <td className="px-4 py-3 font-bold text-labsa-charcoal">{row.size}</td>
                    <td className="px-4 py-3 text-labsa-charcoal-muted">{row.chest}</td>
                    <td className="px-4 py-3 text-labsa-charcoal-muted">{row.waist}</td>
                    <td className="px-4 py-3 text-labsa-charcoal-muted">{row.hip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-labsa-charcoal-muted">
            {t('menFitNote')}
          </p>
        </div>
      ) : (
        <div className="mt-5">
          <div className="overflow-x-auto rounded-xl border border-labsa-cream">
            <table className="w-full text-start text-xs sm:text-sm">
              <thead className="border-b border-labsa-cream bg-labsa-surface text-labsa-charcoal">
                <tr>
                  <th className="px-4 py-3 text-start font-bold">{t('colSize')}</th>
                  <th className="px-4 py-3 text-start font-bold">{t('colAge')}</th>
                  <th className="px-4 py-3 text-start font-bold">{t('colHeight')}</th>
                  <th className="px-4 py-3 text-start font-bold">{t('colChest')}</th>
                  <th className="px-4 py-3 text-start font-bold">{t('colWaist')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-labsa-cream/70 bg-labsa-white font-mono">
                {kidsRows.map((row) => (
                  <tr key={row.size} className="hover:bg-labsa-canvas/60">
                    <td className="px-4 py-3 font-bold text-labsa-charcoal">{row.size}</td>
                    <td className="px-4 py-3 font-sans text-labsa-charcoal">{row.age}</td>
                    <td className="px-4 py-3 text-labsa-charcoal-muted">{row.height}</td>
                    <td className="px-4 py-3 text-labsa-charcoal-muted">{row.chest}</td>
                    <td className="px-4 py-3 text-labsa-charcoal-muted">{row.waist}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-labsa-charcoal-muted">
            {t('kidsFitNote')}
          </p>
        </div>
      )}
    </div>
  );
}

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAudience?: Audience;
}

export function SizeGuideModal({
  isOpen,
  onClose,
  defaultAudience = 'men',
}: SizeGuideModalProps) {
  const t = useTranslations('SizeGuide');

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="size-guide-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-labsa-charcoal/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border-2 border-dashed border-labsa-cream bg-labsa-white p-6 shadow-craft-lg sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-dashed border-labsa-cream pb-4">
          <div className="flex items-center gap-2.5">
            <Ruler className="h-5 w-5 text-labsa-terracotta" aria-hidden="true" />
            <div>
              <h2
                id="size-guide-modal-title"
                className="text-lg font-extrabold text-labsa-charcoal sm:text-xl"
              >
                {t('modalTitle')}
              </h2>
              <p className="mt-0.5 text-xs text-labsa-charcoal-muted">
                {t('modalSubtitle')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('closeModal')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-labsa-cream bg-labsa-canvas text-labsa-charcoal transition hover:border-labsa-terracotta"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5">
          <SizeGuideTables defaultAudience={defaultAudience} />
        </div>
      </div>
    </div>
  );
}
