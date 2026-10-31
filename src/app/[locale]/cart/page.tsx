'use client';

import React, { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { useCart, type CartItem } from '@/context/CartContext';
import { CouponBoxSection } from '@/components/cart/CouponBoxSection';
import { getLocalizedText } from '@/data/catalog';
import {
  EGYPT_GOVERNORATES,
  getGovernorateByCode,
  getGovernorateDisplayName,
} from '@/data/shipping';
import { formatEGP, cn } from '@/lib/utils';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
} from 'lucide-react';

export default function CartPage() {
  const locale = useLocale();
  const t = useTranslations('Cart');
  const tCoupons = useTranslations('Coupons');
  const router = useRouter();
  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight;

  const {
    items,
    totalQuantity,
    subtotalEgp,
    couponValidation,
    discountEgp,
    discountedSubtotalEgp,
    isHydrated,
    selectedGovernorateCode,
    setSelectedGovernorateCode,
    updateItemQuantity,
    removeItem,
    inspectItemHealth,
  } = useCart();

  const [itemFeedback, setItemFeedback] = useState<Record<string, string>>({});

  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="h-64 animate-pulse rounded-3xl border border-labsa-cream bg-labsa-white p-8" />
      </div>
    );
  }

  // Empty Cart State
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border-2 border-dashed border-labsa-cream bg-labsa-white p-8 text-center shadow-craft sm:p-12">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-labsa-surface text-labsa-terracotta">
            <ShoppingBag className="h-8 w-8" aria-hidden="true" />
          </div>

          <h1 className="mt-5 text-2xl font-extrabold text-labsa-charcoal sm:text-3xl">
            {t('emptyTitle')}
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-labsa-charcoal-muted sm:text-base">
            {t('emptySubtitle')}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/men"
              className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-labsa-charcoal px-6 py-3 text-sm font-bold text-labsa-white shadow-craft transition hover:bg-labsa-olive-dark"
            >
              <span>{t('browseMenCta')}</span>
              <ArrowIcon className="h-4 w-4" aria-hidden="true" />
            </Link>

            <Link
              href="/kids"
              className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-labsa-terracotta px-6 py-3 text-sm font-bold text-labsa-white shadow-craft transition hover:bg-labsa-terracotta-dark"
            >
              <span>{t('browseKidsCta')}</span>
              <ArrowIcon className="h-4 w-4" aria-hidden="true" />
            </Link>

            <Link
              href="/shop"
              className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-labsa-cream bg-labsa-canvas px-5 py-3 text-sm font-bold text-labsa-charcoal transition hover:border-labsa-charcoal"
            >
              <span>{t('browseAllCta')}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const itemHealthList = items.map((item) => ({
    item,
    health: inspectItemHealth(item),
  }));

  const cartHasBlockingIssues = itemHealthList.some(
    ({ health }) => !health.isValid
  );

  const selectedGov = getGovernorateByCode(selectedGovernorateCode);
  const deliveryFeeEgp = selectedGov ? selectedGov.feeEgp : null;
  const totalEgp =
    deliveryFeeEgp !== null
      ? discountedSubtotalEgp + deliveryFeeEgp
      : discountedSubtotalEgp;

  function handleQtyChange(item: CartItem, nextQty: number) {
    setItemFeedback((prev) => {
      const copy = { ...prev };
      delete copy[item.variantId];
      return copy;
    });

    const res = updateItemQuantity(item.variantId, nextQty);
    if (!res.ok) {
      let msg = t('issueOutOfStock');
      if (res.reason === 'discontinued') {
        msg = t('issueDiscontinued');
      } else if (res.reason === 'exceeds_stock') {
        msg = t('issueExceedsStock', { available: res.availableStock });
      }
      setItemFeedback((prev) => ({ ...prev, [item.variantId]: msg }));
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-dashed border-labsa-cream pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-labsa-charcoal sm:text-4xl">
            {t('pageTitle')}
          </h1>
          <p className="mt-2 text-sm text-labsa-charcoal-muted sm:text-base">
            {t('pageSubtitle')}
          </p>
        </div>

        <span className="rounded-xl border border-labsa-cream bg-labsa-white px-4 py-2 text-xs font-bold text-labsa-charcoal shadow-sm">
          {t('itemsCountLabel', { count: totalQuantity })}
        </span>
      </div>

      {/* Blocking Stock/Availability Warning Banner */}
      {cartHasBlockingIssues && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-2xl border-2 border-labsa-status-danger/40 bg-labsa-status-danger/10 p-4 text-sm font-bold text-labsa-status-danger"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>{t('cartHasIssuesBanner')}</p>
        </div>
      )}

      {/* Main Cart Grid: Line Items + Order Summary */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left / Start Column: Cart Line Items */}
        <div className="min-w-0 space-y-4 lg:col-span-8">
          {itemHealthList.map(({ item, health }) => {
            const unitPrice = health.currentPriceEgp;
            const lineTotal = unitPrice * item.quantity;
            const feedbackMsg = itemFeedback[item.variantId];

            return (
              <article
                key={item.variantId}
                className={cn(
                  'rounded-2xl border bg-labsa-white p-4 shadow-craft sm:p-6',
                  health.isValid
                    ? 'border-labsa-cream'
                    : 'border-2 border-labsa-status-danger/60 bg-labsa-status-danger/5'
                )}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {/* Product Thumbnail Image */}
                  <Link
                    href={`/product/${item.slug}`}
                    className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl border border-labsa-cream bg-labsa-canvas"
                  >
                    <img
                      src={item.imageUrl}
                      alt={getLocalizedText(item.title, locale)}
                      className="h-full w-full object-cover"
                    />
                  </Link>

                  {/* Item Details */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h2 className="text-base font-bold text-labsa-charcoal hover:text-labsa-terracotta-dark">
                          <Link
                            href={`/product/${item.slug}`}
                            className="hover:underline"
                          >
                            {getLocalizedText(item.title, locale)}
                          </Link>
                        </h2>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-labsa-charcoal-muted">
                          {/* Color Badge */}
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-labsa-cream bg-labsa-canvas px-2.5 py-0.5 font-semibold text-labsa-charcoal">
                            <span
                              style={{ backgroundColor: item.colorHex }}
                              className="h-3 w-3 rounded-full border border-labsa-charcoal/25"
                              aria-hidden="true"
                            />
                            <span>
                              {t('colorLabel')}{' '}
                              {getLocalizedText(item.colorName, locale)}
                            </span>
                          </span>

                          {/* Size Badge */}
                          <span className="rounded-md border border-labsa-cream bg-labsa-canvas px-2.5 py-0.5 font-mono font-bold text-labsa-charcoal">
                            {t('sizeLabel')} {item.size}
                          </span>

                          {/* SKU */}
                          <span className="font-mono text-[11px]">
                            {t('skuLabel')} {item.sku}
                          </span>
                        </div>
                      </div>

                      {/* Unit & Line Price */}
                      <div className="text-end">
                        <p className="text-xs text-labsa-charcoal-muted">
                          {t('unitPriceLabel')} {formatEGP(unitPrice, locale)}
                        </p>
                        <p className="mt-0.5 text-base font-extrabold text-labsa-charcoal">
                          {t('lineTotalLabel')} {formatEGP(lineTotal, locale)}
                        </p>
                      </div>
                    </div>

                    {/* Availability / Stock Issue Banner */}
                    {!health.isValid && (
                      <div
                        role="alert"
                        className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-labsa-status-danger/40 bg-labsa-white p-3 text-xs font-bold text-labsa-status-danger"
                      >
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span>
                            {health.issue === 'discontinued'
                              ? t('issueDiscontinued')
                              : health.issue === 'out_of_stock'
                                ? t('issueOutOfStock')
                                : t('issueExceedsStock', {
                                    available: health.liveStock,
                                  })}
                          </span>
                        </div>

                        {health.issue === 'exceeds_stock' &&
                        health.liveStock > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleQtyChange(item, health.liveStock)
                            }
                            className="rounded-lg bg-labsa-charcoal px-3 py-1.5 text-xs font-bold text-labsa-white transition hover:bg-labsa-terracotta"
                          >
                            {t('adjustToAvailable', {
                              available: health.liveStock,
                            })}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => removeItem(item.variantId)}
                            className="rounded-lg bg-labsa-status-danger px-3 py-1.5 text-xs font-bold text-labsa-white"
                          >
                            {t('removeItem')}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Feedback when trying to exceed stock */}
                    {feedbackMsg && health.isValid && (
                      <p
                        role="alert"
                        className="mt-2 text-xs font-bold text-labsa-status-warning"
                      >
                        {feedbackMsg}
                      </p>
                    )}

                    {/* Quantity Controls, Return to Product & Remove Action */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-labsa-cream pt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-labsa-charcoal">
                          {t('quantityLabel')}:
                        </span>
                        <div className="inline-flex items-center rounded-xl border border-labsa-cream bg-labsa-canvas">
                          <button
                            type="button"
                            onClick={() =>
                              handleQtyChange(item, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1 || !health.isValid}
                            aria-label={t('decreaseQty')}
                            className="inline-flex h-11 w-11 items-center justify-center text-labsa-charcoal transition hover:text-labsa-terracotta-dark disabled:opacity-40"
                          >
                            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <span className="min-w-[34px] text-center font-mono text-xs font-bold text-labsa-charcoal">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleQtyChange(item, item.quantity + 1)
                            }
                            disabled={
                              !health.isValid ||
                              item.quantity >= health.liveStock
                            }
                            aria-label={t('increaseQty')}
                            className="inline-flex h-11 w-11 items-center justify-center text-labsa-charcoal transition hover:text-labsa-terracotta-dark disabled:opacity-40"
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          href={`/product/${item.slug}`}
                          className="inline-flex min-h-[44px] items-center gap-1 text-xs font-semibold text-labsa-olive-dark hover:text-labsa-terracotta-dark hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{t('returnToProduct')}</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => removeItem(item.variantId)}
                          className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-labsa-cream bg-labsa-canvas px-3 py-2 text-xs font-bold text-labsa-status-danger transition hover:border-labsa-status-danger hover:bg-labsa-status-danger/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{t('removeItem')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Right / End Column: Transparent Order Summary & Delivery Fee Estimator */}
        <aside className="min-w-0 lg:col-span-4">
          <div className="sticky top-28 rounded-3xl border-2 border-dashed border-labsa-cream bg-labsa-white p-6 shadow-craft">
            <h2 className="text-lg font-extrabold text-labsa-charcoal">
              {t('summaryTitle')}
            </h2>

            {/* Optional 27-Governorate Delivery Fee Estimator */}
            <div className="mt-4 rounded-2xl border border-labsa-cream bg-labsa-canvas p-4">
              <label
                htmlFor="cart-gov-select"
                className="flex items-center gap-1.5 text-xs font-bold text-labsa-charcoal"
              >
                <Truck className="h-4 w-4 text-labsa-terracotta" aria-hidden="true" />
                <span>{t('governorateEstimatorLabel')}</span>
              </label>

              <select
                id="cart-gov-select"
                value={selectedGovernorateCode}
                onChange={(e) => setSelectedGovernorateCode(e.target.value)}
                className="mt-2.5 min-h-[42px] w-full rounded-xl border border-labsa-cream bg-labsa-white px-3 py-2 text-xs font-bold text-labsa-charcoal focus:border-labsa-terracotta focus:outline-none"
              >
                <option value="">{t('selectGovernoratePlaceholder')}</option>
                {EGYPT_GOVERNORATES.map((gov) => (
                  <option key={gov.code} value={gov.code}>
                    {getGovernorateDisplayName(gov, locale)} —{' '}
                    {formatEGP(gov.feeEgp, locale)}
                  </option>
                ))}
              </select>
            </div>

            {/* Discount Coupon Section */}
            <div className="mt-4">
              <CouponBoxSection />
            </div>

            {/* Transparent EGP Breakdown (Subtotal, Coupon Discount, Delivery Fee, Total) */}
            <dl className="mt-5 space-y-3 border-t border-dashed border-labsa-cream pt-4 text-sm">
              <div className="flex items-center justify-between">
                <dt className="font-medium text-labsa-charcoal-muted">
                  {t('subtotalLabel')}
                </dt>
                <dd className="font-bold text-labsa-charcoal">
                  {formatEGP(subtotalEgp, locale)}
                </dd>
              </div>

              {couponValidation && couponValidation.valid && discountEgp > 0 && (
                <div className="flex items-center justify-between text-labsa-status-success">
                  <dt className="font-bold">
                    {tCoupons('summaryDiscountLine', {
                      code: couponValidation.coupon.code,
                    })}
                  </dt>
                  <dd className="font-mono font-extrabold">
                    - {formatEGP(discountEgp, locale)}
                  </dd>
                </div>
              )}

              <div className="flex items-center justify-between">
                <dt className="font-medium text-labsa-charcoal-muted">
                  {selectedGov
                    ? t('deliveryFeeLabel', {
                        gov: getGovernorateDisplayName(selectedGov, locale),
                      })
                    : t('deliveryFeeLabel', { gov: '—' })}
                </dt>
                <dd className="font-bold text-labsa-olive-dark">
                  {deliveryFeeEgp !== null ? (
                    formatEGP(deliveryFeeEgp, locale)
                  ) : (
                    <span className="text-xs font-semibold text-labsa-charcoal-muted">
                      {t('deliveryFeeUnselected')}
                    </span>
                  )}
                </dd>
              </div>

              <div className="flex items-center justify-between border-t border-labsa-cream pt-3 text-base">
                <dt className="font-extrabold text-labsa-charcoal">
                  {deliveryFeeEgp !== null
                    ? t('totalLabel')
                    : t('totalBeforeShippingLabel')}
                </dt>
                <dd className="text-xl font-extrabold text-labsa-charcoal">
                  {formatEGP(totalEgp, locale)}
                </dd>
              </div>
            </dl>

            <p className="mt-3 text-[11px] leading-relaxed text-labsa-charcoal-muted">
              {t('noExtraFeesNote')}
            </p>

            {/* Proceed to Checkout CTA */}
            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                disabled={cartHasBlockingIssues}
                onClick={() => router.push('/checkout')}
                className={cn(
                  'flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-extrabold shadow-craft transition',
                  cartHasBlockingIssues
                    ? 'cursor-not-allowed bg-labsa-cream text-labsa-charcoal-muted'
                    : 'bg-labsa-terracotta text-labsa-white hover:bg-labsa-terracotta-dark'
                )}
              >
                <span>{t('proceedToCheckoutCta')}</span>
                <ArrowIcon className="h-4 w-4" aria-hidden="true" />
              </button>

              <Link
                href="/shop"
                className="flex min-h-[42px] w-full items-center justify-center rounded-xl border border-labsa-cream bg-labsa-canvas px-4 py-2 text-xs font-bold text-labsa-charcoal transition hover:border-labsa-charcoal"
              >
                {t('continueShoppingCta')}
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
