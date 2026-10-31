import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getAllVisibleProducts,
  getLocalizedText,
  getProductBySlug,
} from '@/data/catalog';
import { routing } from '@/i18n/routing';
import { ProductDetailView } from '@/components/catalog/ProductDetailView';

export function generateStaticParams() {
  const products = getAllVisibleProducts();
  return routing.locales.flatMap((locale) =>
    products.map((product) => ({
      locale,
      slug: product.slug,
    }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return {};
  }

  return {
    title: `${getLocalizedText(product.title, locale)} | LABSA | لَبسة`,
    description: getLocalizedText(product.shortDescription, locale),
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return <ProductDetailView product={product} />;
}
