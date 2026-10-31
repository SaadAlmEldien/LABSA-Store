import React from 'react';
import { useTranslations } from 'next-intl';
import { SizeGuideTables } from '@/components/catalog/SizeGuideModal';
import { Ruler } from 'lucide-react';

export default function SizeGuidePage() {
  const t = useTranslations('SizeGuide');

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border-2 border-dashed border-labsa-cream bg-labsa-white p-6 shadow-craft sm:p-10">
        <div className="flex items-center gap-3 border-b border-dashed border-labsa-cream pb-4">
          <Ruler className="h-6 w-6 text-labsa-terracotta" aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-extrabold text-labsa-charcoal sm:text-3xl">
              {t('modalTitle')}
            </h1>
            <p className="mt-1 text-sm text-labsa-charcoal-muted">
              {t('modalSubtitle')}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <SizeGuideTables defaultAudience="men" />
        </div>
      </div>
    </div>
  );
}
