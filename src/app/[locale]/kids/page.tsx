import React, { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { CollectionExplorer } from '@/components/catalog/CollectionExplorer';

export default function KidsCollectionPage() {
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
        title={t('kidsTitle')}
        intro={t('kidsIntro')}
        fixedAudience="kids"
      />
    </Suspense>
  );
}
