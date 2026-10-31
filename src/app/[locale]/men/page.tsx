import React, { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { CollectionExplorer } from '@/components/catalog/CollectionExplorer';

export default function MenCollectionPage() {
  const t = useTranslations('Catalog');

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-12 text-center text-sm text-labsa-charcoal-muted">
          ...
        </div>
      }
    >
      <CollectionExplorer
        title={t('menTitle')}
        intro={t('menIntro')}
        fixedAudience="men"
      />
    </Suspense>
  );
}
