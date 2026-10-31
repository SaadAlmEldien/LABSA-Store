import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import {
  getLocalizedText,
  resolveCategorySlug,
} from '@/data/catalog';
import { CollectionExplorer } from '@/components/catalog/CollectionExplorer';

export default async function CategoryCollectionPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const resolved = resolveCategorySlug(slug);

  if (!resolved) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-12 text-center text-sm text-labsa-charcoal-muted">
          ...
        </div>
      }
    >
      <CollectionExplorer
        title={getLocalizedText(resolved.title, locale)}
        intro={getLocalizedText(resolved.description, locale)}
        fixedAudience={resolved.audience}
        fixedCategory={resolved.category}
      />
    </Suspense>
  );
}
