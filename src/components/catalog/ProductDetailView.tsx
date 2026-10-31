'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  type CatalogProduct,
  type ProductColor,
  getAllCatalogProducts,
  getCategoryByKey,
  getLocalizedText,
  getRelatedProducts,
  getVariant,
  isProductInStock,
} from '@/data/catalog';
import { getLiveVariantStock } from '@/data/orders';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { SizeGuideModal } from '@/components/catalog/SizeGuideModal';
import { ProductCard } from '@/components/catalog/ProductCard';
import { ProductReviewsSection } from '@/components/catalog/ProductReviewsSection';
import { formatEGP, cn } from '@/lib/utils';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  Ruler,
  ShoppingBag,
  Sparkles,
  Truck,
} from 'lucide-react';

interface ProductDetailViewProps {
  product: CatalogProduct;
}

export function ProductDetailView({
  product: initialProduct,
}: ProductDetailViewProps) {
  const locale = useLocale();
  const tPDP = useTranslations('PDP');
  const tCatalog = useTranslations('Catalog');
  const tWishlist = useTranslations('Wishlist');
  const { addItem, getVariantCartQuantity, totalQuantity } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [hydratedCatalogProduct, setHydratedCatalogProduct] =
    useState<CatalogProduct | null>(null);

  useEffect(() => {
    const found = getAllCatalogProducts().find(
      (p) => p.id === initialProduct.id || p.slug === initialProduct.slug
    );
    if (found) {
      setHydratedCatalogProduct(found);
    }
  }, [initialProduct.id, initialProduct.slug]);

  const product = hydratedCatalogProduct ?? initialProduct;

  const BreadcrumbSeparator = locale === 'ar' ? ChevronLeft : ChevronRight;
  const BackArrow = locale === 'ar' ? ArrowRight : ArrowLeft;

  const productHasStock = isProductInStock(product);

  // Initialize default color to first color that has any stock, or first color
  const defaultColorKey = useMemo(() => {
    const firstWithStock = product.colors.find((c) =>
      product.variants.some((v) => v.colorKey === c.key && v.stock > 0)
    );
    return firstWithStock?.key ?? product.colors[0]?.key ?? null;
  }, [product]);

  const [selectedColorKey, setSelectedColorKey] = useState<
    ProductColor['key'] | null
  >(defaultColorKey);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [fallbackMap, setFallbackMap] = useState<Record<string, boolean>>({});
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  // Validation and confirmation feedback states
  const [validationError, setValidationError] = useState<string | null>(null);
  const [addedNotice, setAddedNotice] = useState<{
    qty: number;
    color: string;
    size: string;
  } | null>(null);

  const selectedColorObj = useMemo(
    () => product.colors.find((c) => c.key === selectedColorKey) ?? null,
    [product.colors, selectedColorKey]
  );

  const selectedVariant = useMemo(
    () => getVariant(product, selectedColorKey, selectedSize),
    [product, selectedColorKey, selectedSize]
  );

  const alreadyInCart = selectedVariant
    ? getVariantCartQuantity(selectedVariant.id)
    : 0;

  const selectedVariantLiveStock = selectedVariant
    ? getLiveVariantStock(selectedVariant.id, selectedVariant.stock)
    : 0;

  const remainingAddableStock = selectedVariant
    ? Math.max(0, selectedVariantLiveStock - alreadyInCart)
    : 0;

  const maxSelectableQty = selectedVariant
    ? Math.max(1, remainingAddableStock)
    : 5;

  const categoryDef = getCategoryByKey(product.category);
  const categoryName = categoryDef
    ? getLocalizedText(categoryDef.name, locale)
    : product.category;

  const collectionHref = product.audience === 'men' ? '/men' : '/kids';
  const collectionName =
    product.audience === 'men'
      ? tPDP('breadcrumbMen')
      : tPDP('breadcrumbKids');

  const hasSale =
    typeof product.previousPriceEgp === 'number' &&
    product.previousPriceEgp > product.priceEgp;

  const relatedProducts = useMemo(() => getRelatedProducts(product, 4), [product]);

  const activeImage = product.images[activeImageIndex] ?? product.images[0];
  const activeImageSrc =
    fallbackMap[activeImage.id] && activeImage.fallbackUrl
      ? activeImage.fallbackUrl
      : activeImage.url;

  function handleSelectColor(colorKey: ProductColor['key']) {
    setSelectedColorKey(colorKey);
    setValidationError(null);
    setAddedNotice(null);
    // If an image is bound to this color, switch to it
    const colorImgIndex = product.images.findIndex(
      (img) => img.colorKey === colorKey
    );
    if (colorImgIndex !== -1) {
      setActiveImageIndex(colorImgIndex);
    }
    // Reset quantity to 1 when switching variant
    setQuantity(1);
  }

  function handleSelectSize(size: string) {
    setSelectedSize(size);
    setValidationError(null);
    setAddedNotice(null);
    setQuantity(1);
  }

  function handleAddToCart() {
    setValidationError(null);
    setAddedNotice(null);

    if (!productHasStock) {
      setValidationError(tPDP('statusProductOut'));
      return;
    }

    if (!selectedColorKey || !selectedColorObj) {
      setValidationError(tPDP('validationMissingColor'));
      return;
    }

    if (!selectedSize) {
      setValidationError(tPDP('validationMissingSize'));
      return;
    }

    if (!selectedVariant || selectedVariant.stock <= 0) {
      setValidationError(tPDP('validationVariantOut'));
      return;
    }

    const primaryImg =
      product.images.find((i) => i.isPrimary) ?? product.images[0];

    const result = addItem(
      {
        variantId: selectedVariant.id,
        productId: product.id,
        slug: product.slug,
        sku: selectedVariant.sku,
        title: product.title,
        colorKey: selectedColorObj.key,
        colorName: selectedColorObj.name,
        colorHex: selectedColorObj.hex,
        size: selectedVariant.size,
        priceEgp: product.priceEgp,
        maxStock: selectedVariant.stock,
        imageUrl: primaryImg.url,
      },
      quantity
    );

    if (!result.ok) {
      if (result.reason === 'out_of_stock') {
        setValidationError(tPDP('validationVariantOut'));
      } else {
        setValidationError(
          tPDP('validationExceedsStock', { available: result.availableToAdd })
        );
      }
      return;
    }

    setAddedNotice({
      qty: result.addedQuantity,
      color: getLocalizedText(selectedColorObj.name, locale),
      size: selectedVariant.size,
    });
    setQuantity(1);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 1. Breadcrumbs & Back to Collection Navigation */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-labsa-charcoal-muted"
        >
          <Link href="/" className="hover:text-labsa-terracotta-dark">
            {tPDP('breadcrumbHome')}
          </Link>
          <BreadcrumbSeparator className="h-3.5 w-3.5" aria-hidden="true" />
          <Link
            href={collectionHref}
            className="hover:text-labsa-terracotta-dark"
          >
            {collectionName}
          </Link>
          <BreadcrumbSeparator className="h-3.5 w-3.5" aria-hidden="true" />
          <Link
            href={`${collectionHref}?category=${product.category}`}
            className="hover:text-labsa-terracotta-dark"
          >
            {categoryName}
          </Link>
          <BreadcrumbSeparator className="h-3.5 w-3.5" aria-hidden="true" />
          <span
            aria-current="page"
            className="font-bold text-labsa-charcoal"
          >
            {getLocalizedText(product.title, locale)}
          </span>
        </nav>

        <Link
          href={collectionHref}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-labsa-cream bg-labsa-white px-3.5 py-1.5 text-xs font-bold text-labsa-charcoal transition hover:border-labsa-terracotta hover:text-labsa-terracotta-dark"
        >
          <BackArrow className="h-3.5 w-3.5" aria-hidden="true" />
          <span>
            {tPDP('backToCollection', { collection: collectionName })}
          </span>
        </Link>
      </div>

      {/* 2. Main Product Detail Layout: Image Gallery + Variant Selector */}
      <div className="grid grid-cols-1 gap-8 rounded-3xl border-2 border-dashed border-labsa-cream bg-labsa-white p-6 shadow-craft sm:p-8 lg:grid-cols-12 lg:gap-12">
        {/* Left / Start Column: Responsive Image Gallery */}
        <div className="min-w-0 lg:col-span-6">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-labsa-cream bg-labsa-canvas">
            <img
              src={activeImageSrc}
              alt={getLocalizedText(activeImage.alt, locale)}
              onError={() => {
                if (activeImage.fallbackUrl && !fallbackMap[activeImage.id]) {
                  setFallbackMap((prev) => ({ ...prev, [activeImage.id]: true }));
                }
              }}
              className="h-full w-full object-cover object-center"
            />

            {/* Status Badges */}
            <div className="absolute start-4 top-4 flex flex-wrap gap-2">
              {!productHasStock ? (
                <span className="rounded-full bg-labsa-charcoal px-3.5 py-1 text-xs font-bold text-labsa-white shadow-sm">
                  {tCatalog('badgeOutOfStock')}
                </span>
              ) : (
                <>
                  {product.isNew && (
                    <span className="rounded-full bg-labsa-olive px-3.5 py-1 text-xs font-bold text-labsa-white shadow-sm">
                      {tCatalog('badgeNew')}
                    </span>
                  )}
                  {hasSale && (
                    <span className="rounded-full bg-labsa-terracotta px-3.5 py-1 text-xs font-bold text-labsa-white shadow-sm">
                      {tCatalog('badgeSale')}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Gallery Thumbnails */}
          {product.images.length > 1 && (
            <div className="mt-4 flex items-center gap-3 overflow-x-auto pb-1">
              {product.images.map((img, idx) => {
                const isSelected = idx === activeImageIndex;
                const thumbSrc =
                  fallbackMap[img.id] && img.fallbackUrl
                    ? img.fallbackUrl
                    : img.url;
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    aria-label={tPDP('galleryThumbLabel', { index: idx + 1 })}
                    aria-current={isSelected ? 'true' : undefined}
                    className={cn(
                      'relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-labsa-canvas transition',
                      isSelected
                        ? 'border-labsa-terracotta ring-2 ring-labsa-terracotta/30'
                        : 'border-labsa-cream opacity-75 hover:opacity-100'
                    )}
                  >
                    <img
                      src={thumbSrc}
                      alt={getLocalizedText(img.alt, locale)}
                      onError={() => {
                        if (img.fallbackUrl && !fallbackMap[img.id]) {
                          setFallbackMap((prev) => ({
                            ...prev,
                            [img.id]: true,
                          }));
                        }
                      }}
                      className="h-full w-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right / End Column: Product Info, Variants & Add to Cart */}
        <div className="flex min-w-0 flex-col justify-between lg:col-span-6">
          <div>
            {/* Department & Category Pill + Model SKU */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-labsa-surface px-3.5 py-1 text-xs font-bold text-labsa-charcoal">
                <Sparkles className="h-3.5 w-3.5 text-labsa-terracotta" aria-hidden="true" />
                <span>
                  {collectionName} • {categoryName}
                </span>
              </span>

              {selectedVariant && (
                <span className="font-mono text-xs text-labsa-charcoal-muted">
                  {tPDP('skuLabel')} <strong>{selectedVariant.sku}</strong>
                </span>
              )}
            </div>

            {/* Product Title */}
            <h1 className="mt-4 text-2xl font-extrabold leading-tight text-labsa-charcoal sm:text-3xl">
              {getLocalizedText(product.title, locale)}
            </h1>

            {/* Price in EGP & Optional Sale Comparison */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-2xl font-extrabold text-labsa-charcoal sm:text-3xl">
                {formatEGP(product.priceEgp, locale)}
              </span>
              {hasSale && product.previousPriceEgp && (
                <span className="text-base font-semibold text-labsa-charcoal-light line-through">
                  {formatEGP(product.previousPriceEgp, locale)}
                </span>
              )}
            </div>

            {/* Full Description */}
            <p className="mt-4 text-sm leading-relaxed text-labsa-charcoal-muted sm:text-base">
              {getLocalizedText(product.description, locale)}
            </p>

            {/* Availability Status Banner */}
            <div className="mt-5">
              {!productHasStock ? (
                <div className="inline-flex items-center gap-2 rounded-xl border border-labsa-status-danger/30 bg-labsa-status-danger/10 px-3.5 py-2 text-xs font-bold text-labsa-status-danger">
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{tPDP('statusProductOut')}</span>
                </div>
              ) : selectedVariant ? (
                selectedVariant.stock <= 0 ? (
                  <div className="inline-flex items-center gap-2 rounded-xl border border-labsa-status-danger/30 bg-labsa-status-danger/10 px-3.5 py-2 text-xs font-bold text-labsa-status-danger">
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{tPDP('statusVariantOut')}</span>
                  </div>
                ) : selectedVariant.stock <= 3 ? (
                  <div className="inline-flex items-center gap-2 rounded-xl border border-labsa-status-warning/40 bg-labsa-status-warning/10 px-3.5 py-2 text-xs font-bold text-labsa-status-warning">
                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>
                      {tPDP('statusLowStock', { count: selectedVariant.stock })}
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-xl border border-labsa-status-success/30 bg-labsa-status-success/10 px-3.5 py-2 text-xs font-bold text-labsa-status-success">
                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>
                      {tPDP('statusInStock', { count: selectedVariant.stock })}
                    </span>
                  </div>
                )
              ) : (
                <div className="inline-flex items-center gap-2 rounded-xl border border-labsa-cream bg-labsa-canvas px-3.5 py-2 text-xs font-semibold text-labsa-charcoal-muted">
                  <span>{tPDP('selectColorPrompt')}</span>
                </div>
              )}
            </div>

            {/* 3. Color Selection (Accessible: shows color swatch + localized name + check icon) */}
            <div className="mt-6 border-t border-dashed border-labsa-cream pt-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-labsa-charcoal">
                  {tPDP('colorLabel')}{' '}
                  <strong className="text-labsa-terracotta-dark">
                    {selectedColorObj
                      ? getLocalizedText(selectedColorObj.name, locale)
                      : tPDP('selectColorHint')}
                  </strong>
                </span>
              </div>

              <div
                role="group"
                aria-label={tPDP('colorLabel')}
                className="mt-3 flex flex-wrap gap-2.5"
              >
                {product.colors.map((color) => {
                  const isSelected = selectedColorKey === color.key;
                  const colorHasAnyStock = product.variants.some(
                    (v) => v.colorKey === color.key && v.stock > 0
                  );

                  return (
                    <button
                      key={color.key}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => handleSelectColor(color.key)}
                      className={cn(
                        'inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 px-3.5 py-2 text-xs font-bold transition',
                        isSelected
                          ? 'border-labsa-terracotta bg-labsa-terracotta-light/60 text-labsa-charcoal shadow-sm'
                          : 'border-labsa-cream bg-labsa-canvas text-labsa-charcoal hover:border-labsa-charcoal',
                        !colorHasAnyStock && 'opacity-65'
                      )}
                    >
                      <span
                        style={{ backgroundColor: color.hex }}
                        className="h-4 w-4 rounded-full border border-labsa-charcoal/30"
                        aria-hidden="true"
                      />
                      <span>{getLocalizedText(color.name, locale)}</span>
                      {!colorHasAnyStock && (
                        <span className="text-[10px] font-normal text-labsa-charcoal-muted">
                          ({tPDP('sizeOutSuffix')})
                        </span>
                      )}
                      {isSelected && (
                        <Check
                          className="h-3.5 w-3.5 text-labsa-terracotta-dark"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Size Selection + Size Guide Dialog Trigger */}
            <div className="mt-6 border-t border-dashed border-labsa-cream pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-labsa-charcoal">
                  {tPDP('sizeLabel')}{' '}
                  <strong className="font-mono text-labsa-terracotta-dark">
                    {selectedSize ?? tPDP('selectSizeHint')}
                  </strong>
                </span>

                <button
                  type="button"
                  onClick={() => setSizeGuideOpen(true)}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-labsa-olive/60 bg-labsa-canvas px-3.5 py-2 text-xs font-bold text-labsa-olive-dark transition hover:border-labsa-terracotta hover:text-labsa-terracotta-dark"
                >
                  <Ruler className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{tPDP('openSizeGuide')}</span>
                </button>
              </div>

              <div
                role="group"
                aria-label={tPDP('sizeLabel')}
                className="mt-3 flex flex-wrap gap-2"
              >
                {product.sizes.map((size) => {
                  const isSelected = selectedSize === size;
                  const variantForSize = selectedColorKey
                    ? getVariant(product, selectedColorKey, size)
                    : undefined;
                  const isAvailable = variantForSize
                    ? variantForSize.stock > 0
                    : product.variants.some((v) => v.size === size && v.stock > 0);

                  return (
                    <button
                      key={size}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => handleSelectSize(size)}
                      className={cn(
                        'inline-flex min-h-[44px] min-w-[60px] flex-col items-center justify-center rounded-xl border-2 px-3.5 py-1.5 font-mono text-xs font-bold transition',
                        isSelected
                          ? 'border-labsa-charcoal bg-labsa-charcoal text-labsa-white shadow-sm'
                          : isAvailable
                            ? 'border-labsa-cream bg-labsa-canvas text-labsa-charcoal hover:border-labsa-terracotta'
                            : 'border-dashed border-labsa-cream bg-labsa-canvas/50 text-labsa-charcoal-light line-through'
                      )}
                    >
                      <span className="flex items-center gap-1">
                        <span>{size}</span>
                        {isSelected && (
                          <Check className="h-3 w-3" aria-hidden="true" />
                        )}
                      </span>
                      {!isAvailable && (
                        <span className="font-sans text-[10px] font-medium no-underline">
                          {tPDP('sizeOutSuffix')}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Quantity Selector & Add-to-Cart Controls */}
            <div className="mt-6 border-t border-dashed border-labsa-cream pt-5">
              <div className="flex flex-wrap items-center gap-4">
                {/* Quantity Stepper */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-labsa-charcoal">
                    {tPDP('quantityLabel')}
                  </span>
                  <div className="inline-flex items-center rounded-xl border border-labsa-cream bg-labsa-canvas">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || !productHasStock}
                      aria-label={tPDP('decreaseQty')}
                      className="inline-flex h-11 w-11 items-center justify-center text-labsa-charcoal transition hover:text-labsa-terracotta-dark disabled:opacity-40"
                    >
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <span className="min-w-[36px] text-center font-mono text-sm font-bold text-labsa-charcoal">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((q) => Math.min(maxSelectableQty, q + 1))
                      }
                      disabled={
                        !productHasStock ||
                        (selectedVariant !== undefined &&
                          quantity >= remainingAddableStock)
                      }
                      aria-label={tPDP('increaseQty')}
                      className="inline-flex h-11 w-11 items-center justify-center text-labsa-charcoal transition hover:text-labsa-terracotta-dark disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Stock & In-Cart Notes */}
                {selectedVariant && selectedVariant.stock > 0 && (
                  <div className="text-xs text-labsa-charcoal-muted">
                    <span>
                      {tPDP('maxAvailableNote', {
                        max: remainingAddableStock,
                      })}
                    </span>
                    {alreadyInCart > 0 && (
                      <span className="ms-2 font-bold text-labsa-olive-dark">
                        ({tPDP('alreadyInCartNote', { count: alreadyInCart })})
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Validation Error Message */}
              {validationError && (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-2.5 rounded-xl border border-labsa-status-danger/40 bg-labsa-status-danger/10 p-3.5 text-xs font-bold text-labsa-status-danger"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Added to Cart Confirmation Banner */}
              {addedNotice && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mt-4 rounded-2xl border-2 border-labsa-status-success/40 bg-labsa-status-success/10 p-4 text-xs text-labsa-charcoal"
                >
                  <div className="flex items-center gap-2 font-extrabold text-labsa-status-success">
                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{tPDP('addedSuccessHeading')}</span>
                  </div>
                  <p className="mt-1 text-labsa-charcoal">
                    {tPDP('addedSuccessBody', {
                      qty: addedNotice.qty,
                      title: getLocalizedText(product.title, locale),
                      color: addedNotice.color,
                      size: addedNotice.size,
                    })}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Link
                      href="/cart"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-labsa-charcoal px-3.5 py-1.5 text-xs font-bold text-labsa-white transition hover:bg-labsa-terracotta"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {tPDP('viewCartLink', { count: totalQuantity })}
                      </span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setAddedNotice(null)}
                      className="text-xs font-bold text-labsa-charcoal-muted underline hover:text-labsa-charcoal"
                    >
                      {tPDP('continueShopping')}
                    </button>
                  </div>
                </div>
              )}

              {/* Prominent Add to Cart CTA + Wishlist Toggle */}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={
                    !productHasStock ||
                    (selectedVariant !== undefined &&
                      selectedVariant.stock <= 0)
                  }
                  className={cn(
                    'flex min-h-[52px] flex-1 items-center justify-center gap-2.5 rounded-2xl px-6 py-3.5 text-base font-extrabold shadow-craft transition',
                    !productHasStock ||
                      (selectedVariant !== undefined &&
                        selectedVariant.stock <= 0)
                      ? 'cursor-not-allowed bg-labsa-cream text-labsa-charcoal-muted'
                      : 'bg-labsa-terracotta text-labsa-white hover:bg-labsa-terracotta-dark'
                  )}
                >
                  <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                  <span>
                    {!productHasStock ||
                    (selectedVariant !== undefined &&
                      selectedVariant.stock <= 0)
                      ? tPDP('outOfStockCta')
                      : `${tPDP('addToCartCta')} — ${formatEGP(
                          product.priceEgp * quantity,
                          locale
                        )}`}
                  </span>
                </button>

                <button
                  type="button"
                  aria-pressed={isInWishlist(product.id)}
                  aria-label={
                    isInWishlist(product.id)
                      ? tWishlist('removeAria', {
                          title: getLocalizedText(product.title, locale),
                        })
                      : tWishlist('addAria', {
                          title: getLocalizedText(product.title, locale),
                        })
                  }
                  onClick={() => toggleWishlist(product.id, product.slug)}
                  className={cn(
                    'inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-2 px-5 py-3 text-sm font-extrabold transition',
                    isInWishlist(product.id)
                      ? 'border-labsa-terracotta bg-labsa-terracotta-light/60 text-labsa-terracotta-dark'
                      : 'border-labsa-cream bg-labsa-canvas text-labsa-charcoal hover:border-labsa-terracotta hover:text-labsa-terracotta-dark'
                  )}
                >
                  <Heart
                    className={cn(
                      'h-5 w-5',
                      isInWishlist(product.id) &&
                        'fill-labsa-terracotta text-labsa-terracotta'
                    )}
                    aria-hidden="true"
                  />
                  <span>
                    {isInWishlist(product.id)
                      ? tWishlist('savedInWishlistBtn')
                      : tWishlist('saveToWishlistBtn')}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Delivery & Returns Reassurance Box */}
          <div className="mt-6 rounded-2xl border border-labsa-cream bg-labsa-canvas p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-labsa-charcoal">
              <Truck className="h-4 w-4 text-labsa-terracotta" aria-hidden="true" />
              <span>{tPDP('deliveryReassuranceTitle')}</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-labsa-charcoal-muted">
              {tPDP('deliveryReassuranceBody')}
            </p>
          </div>
        </div>
      </div>

      {/* 6. Material, Fit & Care Specification Section */}
      <section className="mt-10 rounded-3xl border border-labsa-cream bg-labsa-white p-6 shadow-craft sm:p-8">
        <h2 className="text-lg font-extrabold text-labsa-charcoal sm:text-xl">
          {tPDP('detailsSectionTitle')}
        </h2>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-dashed border-labsa-cream bg-labsa-canvas p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-labsa-olive-dark">
              {tPDP('materialHeading')}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-labsa-charcoal">
              {getLocalizedText(product.details.material, locale)}
            </p>
          </div>

          <div className="rounded-2xl border border-dashed border-labsa-cream bg-labsa-canvas p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-labsa-terracotta-dark">
              {tPDP('fitHeading')}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-labsa-charcoal">
              {getLocalizedText(product.details.fit, locale)}
            </p>
          </div>

          <div className="rounded-2xl border border-dashed border-labsa-cream bg-labsa-canvas p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-labsa-charcoal">
              {tPDP('careHeading')}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-labsa-charcoal">
              {getLocalizedText(product.details.care, locale)}
            </p>
          </div>
        </div>
      </section>

      {/* 6B. Customer Ratings & Moderated Product Reviews */}
      <ProductReviewsSection
        productId={product.id}
        productSlug={product.slug}
      />

      {/* 7. Related Products from the Same Audience Collection */}
      {relatedProducts.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-extrabold text-labsa-charcoal sm:text-2xl">
            {tPDP('relatedProductsTitle')}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}

      {/* Interactive Size Guide Modal */}
      <SizeGuideModal
        isOpen={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        defaultAudience={product.audience}
      />
    </div>
  );
}
