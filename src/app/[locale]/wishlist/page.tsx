'use client';

import React, { useState, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import {
  type CatalogProduct,
  type ProductColor,
  getAllCatalogProducts,
  getLocalizedText,
  getVariant,
  isProductInStock,
} from '@/data/catalog';
import { getLiveVariantStock } from '@/data/orders';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { formatEGP, cn } from '@/lib/utils';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Heart,
  Info,
  ShoppingBag,
  Trash2,
} from 'lucide-react';

export default function WishlistPage() {
  const locale = useLocale();
  const t = useTranslations('Wishlist');
  const tCatalog = useTranslations('Catalog');
  const router = useRouter();
  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight;

  const {
    entries,
    isHydrated,
    removeFromWishlist,
    clearWishlist,
  } = useWishlist();
  const { addItem } = useCart();

  // Per-item selected color & size for direct "Move to Cart"
  const [selectedColorMap, setSelectedColorMap] = useState<
    Record<string, ProductColor['key']>
  >({});
  const [selectedSizeMap, setSelectedSizeMap] = useState<
    Record<string, string>
  >({});
  const [movedBanner, setMovedBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const resolvedItems = useMemo(() => {
    const allProducts = getAllCatalogProducts();
    return entries.map((entry) => {
      const product = allProducts.find((p) => p.id === entry.productId) ?? null;
      return { entry, product };
    });
  }, [entries]);

  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="h-64 animate-pulse rounded-3xl border border-labsa-cream bg-labsa-white p-8" />
      </div>
    );
  }

  function handleMoveToCart(product: CatalogProduct) {
    setMovedBanner(null);
    setErrorBanner(null);

    const chosenColor = selectedColorMap[product.id];
    const chosenSize = selectedSizeMap[product.id];

    // If size or color is not selected yet, send the customer to the product page
    // to select a valid variant rather than adding an incomplete item.
    if (!chosenColor || !chosenSize) {
      router.push(`/product/${product.slug}`);
      return;
    }

    const variant = getVariant(product, chosenColor, chosenSize);
    if (!variant) {
      router.push(`/product/${product.slug}`);
      return;
    }

    const liveStock = getLiveVariantStock(variant.id, variant.stock);
    if (liveStock <= 0) {
      setErrorBanner(t('variantOutOfStockError'));
      return;
    }

    const colorObj =
      product.colors.find((c) => c.key === chosenColor) ?? product.colors[0];
    const primaryImg =
      product.images.find((img) => img.colorKey === chosenColor) ??
      product.images.find((img) => img.isPrimary) ??
      product.images[0];

    const res = addItem(
      {
        variantId: variant.id,
        productId: product.id,
        slug: product.slug,
        sku: variant.sku,
        title: product.title,
        colorKey: chosenColor,
        colorName: colorObj.name,
        colorHex: colorObj.hex,
        size: chosenSize,
        priceEgp: product.priceEgp,
        maxStock: liveStock,
        imageUrl: primaryImg.url,
      },
      1
    );

    if (!res.ok) {
      setErrorBanner(t('variantOutOfStockError'));
      return;
    }

    removeFromWishlist(product.id);
    setMovedBanner(
      t('movedToCartSuccess', {
        title: getLocalizedText(product.title, locale),
        size: chosenSize,
      })
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-labsa-cream bg-labsa-white p-6 shadow-craft sm:p-8">
        <div className="flex items-center gap-3.5">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-labsa-terracotta-light/60 text-labsa-terracotta-dark">
            <Heart className="h-6 w-6 fill-current" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-labsa-charcoal sm:text-3xl">
              {t('pageTitle')}
            </h1>
            <p className="mt-1 text-xs text-labsa-charcoal-muted sm:text-sm">
              {t('pageSubtitle', { count: entries.length })}
            </p>
          </div>
        </div>

        {entries.length > 0 && (
          <button
            type="button"
            onClick={clearWishlist}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-labsa-cream bg-labsa-canvas px-4 py-2 text-xs font-bold text-labsa-charcoal transition hover:border-labsa-status-danger hover:text-labsa-status-danger"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('clearAllBtn')}</span>
          </button>
        )}
      </div>

      {/* Browser-Local Persistence Notice (Does not claim cross-device sync) */}
      <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-dashed border-labsa-olive/60 bg-labsa-white p-4 text-xs text-labsa-charcoal">
        <Info
          className="mt-0.5 h-4 w-4 shrink-0 text-labsa-olive-dark"
          aria-hidden="true"
        />
        <p>{t('localPersistenceNote')}</p>
      </div>

      {movedBanner && (
        <div
          role="status"
          className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-labsa-status-success/40 bg-labsa-status-success/10 p-4 text-xs font-extrabold text-labsa-status-success"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{movedBanner}</span>
          </div>
          <Link
            href="/cart"
            className="rounded-lg bg-labsa-charcoal px-3 py-1.5 text-labsa-white transition hover:bg-labsa-terracotta"
          >
            {t('goToCartCta')}
          </Link>
        </div>
      )}

      {errorBanner && (
        <div
          role="alert"
          className="mt-4 flex items-center gap-2 rounded-2xl border border-labsa-status-danger/40 bg-labsa-status-danger/10 p-4 text-xs font-extrabold text-labsa-status-danger"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* Empty State */}
      {entries.length === 0 ? (
        <div className="mt-8 rounded-3xl border-2 border-dashed border-labsa-cream bg-labsa-white p-10 text-center shadow-craft sm:p-14">
          <Heart
            className="mx-auto h-12 w-12 text-labsa-terracotta"
            aria-hidden="true"
          />
          <h2 className="mt-4 text-xl font-extrabold text-labsa-charcoal sm:text-2xl">
            {t('emptyTitle')}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-labsa-charcoal-muted sm:text-sm">
            {t('emptySubtitle')}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/men"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-labsa-charcoal px-5 py-2.5 text-xs font-extrabold text-labsa-white transition hover:bg-labsa-olive-dark"
            >
              <span>{tCatalog('audienceMen')}</span>
              <ArrowIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <Link
              href="/kids"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-labsa-terracotta px-5 py-2.5 text-xs font-extrabold text-labsa-white transition hover:bg-labsa-terracotta-dark"
            >
              <span>{tCatalog('audienceKids')}</span>
              <ArrowIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {resolvedItems.map(({ entry, product }) => {
            // Unavailable / Archived item state
            if (!product || product.status === 'draft') {
              return (
                <article
                  key={entry.productId}
                  className="flex flex-col justify-between rounded-3xl border-2 border-dashed border-labsa-cream bg-labsa-white p-5 opacity-80"
                >
                  <div>
                    <span className="rounded-full bg-labsa-status-danger/15 px-3 py-1 text-xs font-bold text-labsa-status-danger">
                      {t('unavailableBadge')}
                    </span>
                    <p className="mt-3 text-sm font-bold text-labsa-charcoal">
                      {t('unavailableDesc')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromWishlist(entry.productId)}
                    className="mt-4 inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-labsa-cream bg-labsa-canvas px-4 py-2 text-xs font-bold text-labsa-charcoal"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t('removeBtn')}</span>
                  </button>
                </article>
              );
            }

            const inStock = isProductInStock(product);
            const selectedColor = selectedColorMap[product.id] ?? null;
            const selectedSize = selectedSizeMap[product.id] ?? null;
            const matchedVariant = getVariant(
              product,
              selectedColor,
              selectedSize
            );
            const matchedVariantLiveStock = matchedVariant
              ? getLiveVariantStock(matchedVariant.id, matchedVariant.stock)
              : 0;

            return (
              <article
                key={product.id}
                className="flex flex-col justify-between rounded-3xl border border-labsa-cream bg-labsa-white p-5 shadow-craft"
              >
                <div>
                  <div className="flex items-start gap-4">
                    <Link
                      href={`/product/${product.slug}`}
                      className="h-28 w-24 shrink-0 overflow-hidden rounded-2xl border border-labsa-cream bg-labsa-canvas"
                    >
                      <img
                        src={product.images[0]?.url}
                        alt={getLocalizedText(product.title, locale)}
                        className="h-full w-full object-cover"
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                            inStock
                              ? 'bg-labsa-status-success/15 text-labsa-status-success'
                              : 'bg-labsa-status-danger/15 text-labsa-status-danger'
                          )}
                        >
                          {inStock
                            ? tCatalog('availabilityInStock')
                            : tCatalog('badgeOutOfStock')}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeFromWishlist(product.id)}
                          aria-label={t('removeAria', {
                            title: getLocalizedText(product.title, locale),
                          })}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-labsa-charcoal-muted transition hover:bg-labsa-canvas hover:text-labsa-status-danger"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{t('removeBtn')}</span>
                        </button>
                      </div>

                      <h2 className="mt-1.5 text-base font-extrabold text-labsa-charcoal hover:text-labsa-terracotta-dark">
                        <Link href={`/product/${product.slug}`}>
                          {getLocalizedText(product.title, locale)}
                        </Link>
                      </h2>

                      <p className="mt-1 font-mono text-base font-extrabold text-labsa-terracotta-dark">
                        {formatEGP(product.priceEgp, locale)}
                      </p>
                    </div>
                  </div>

                  {/* Quick Variant Picker for Safe "Move to Cart" */}
                  {inStock && (
                    <div className="mt-4 rounded-2xl border border-labsa-cream bg-labsa-canvas p-3.5 text-xs">
                      <p className="font-bold text-labsa-charcoal">
                        {t('selectVariantPrompt')}
                      </p>
                      <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor={`wl-col-${product.id}`}
                            className="block text-[11px] font-bold text-labsa-charcoal-muted"
                          >
                            {t('colorSelectLabel')}
                          </label>
                          <select
                            id={`wl-col-${product.id}`}
                            value={selectedColor ?? ''}
                            onChange={(e) =>
                              setSelectedColorMap((prev) => ({
                                ...prev,
                                [product.id]: e.target
                                  .value as ProductColor['key'],
                              }))
                            }
                            className="mt-1 min-h-[38px] w-full rounded-xl border border-labsa-cream bg-labsa-white px-2.5 py-1.5 font-bold text-labsa-charcoal"
                          >
                            <option value="">{t('chooseOption')}</option>
                            {product.colors.map((c) => (
                              <option key={c.key} value={c.key}>
                                {getLocalizedText(c.name, locale)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor={`wl-size-${product.id}`}
                            className="block text-[11px] font-bold text-labsa-charcoal-muted"
                          >
                            {t('sizeSelectLabel')}
                          </label>
                          <select
                            id={`wl-size-${product.id}`}
                            value={selectedSize ?? ''}
                            onChange={(e) =>
                              setSelectedSizeMap((prev) => ({
                                ...prev,
                                [product.id]: e.target.value,
                              }))
                            }
                            className="mt-1 min-h-[38px] w-full rounded-xl border border-labsa-cream bg-labsa-white px-2.5 py-1.5 font-mono font-bold text-labsa-charcoal"
                          >
                            <option value="">{t('chooseOption')}</option>
                            {product.sizes.map((sz) => (
                              <option key={sz} value={sz}>
                                {sz}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="mt-4 flex flex-wrap gap-2.5 border-t border-dashed border-labsa-cream pt-4">
                  {inStock ? (
                    <button
                      type="button"
                      onClick={() => handleMoveToCart(product)}
                      disabled={
                        Boolean(selectedColor && selectedSize) &&
                        matchedVariantLiveStock <= 0
                      }
                      className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl bg-labsa-terracotta px-4 py-2.5 text-xs font-extrabold text-labsa-white shadow-craft transition hover:bg-labsa-terracotta-dark disabled:opacity-50"
                    >
                      <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                      <span>
                        {selectedColor && selectedSize
                          ? matchedVariantLiveStock > 0
                            ? t('moveToCartBtn')
                            : t('variantOutOfStockError')
                          : t('selectOnProductPageBtn')}
                      </span>
                    </button>
                  ) : (
                    <Link
                      href={`/product/${product.slug}`}
                      className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl border border-labsa-cream bg-labsa-canvas px-4 py-2.5 text-xs font-bold text-labsa-charcoal"
                    >
                      <span>{tCatalog('viewDetailsCta')}</span>
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
