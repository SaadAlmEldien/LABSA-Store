'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { getLocalizedText } from '@/data/catalog';
import {
  type DemoOrder,
  lookupDemoOrderSafe,
} from '@/data/orders';
import { buildOrderNotificationsForCustomer } from '@/data/notifications';
import { getPaymentMethodOption } from '@/data/payments';
import { formatEGP } from '@/lib/utils';
import {
  AlertCircle,
  Bell,
  Clock,
  CreditCard,
  MapPin,
  PackageSearch,
  Tag,
  Truck,
} from 'lucide-react';

function OrderTrackContent() {
  const locale = useLocale();
  const t = useTranslations('OrderTrack');
  const tConfirm = useTranslations('OrderConfirmation');
  const tStatuses = useTranslations('OrderStatuses');
  const searchParams = useSearchParams();

  const initialOrderParam = searchParams.get('order') ?? '';

  const [orderRefInput, setOrderRefInput] = useState(initialOrderParam);
  const [mobileInput, setMobileInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [matchedOrder, setMatchedOrder] = useState<DemoOrder | null>(null);

  useEffect(() => {
    if (initialOrderParam) {
      setOrderRefInput(initialOrderParam);
    }
  }, [initialOrderParam]);

  const [isSearching, setIsSearching] = useState(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setMatchedOrder(null);

    if (!orderRefInput.trim() || !mobileInput.trim()) {
      setErrorMsg(t('errorMissingFields'));
      return;
    }

    setIsSearching(true);

    try {
      const res = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: orderRefInput.trim(),
          mobileNumber: mobileInput.trim(),
        }),
      });

      const data = await res.json();
      setIsSearching(false);

      if (!res.ok || !data.ok || !data.order) {
        setErrorMsg(t('errorNotFound'));
        return;
      }

      setMatchedOrder(data.order);
    } catch {
      setIsSearching(false);
      // Fallback ONLY for explicit local offline demo mode during development
      // Strictly disabled and inaccessible in production environments
      const isDevDemoAllowed =
        process.env.NODE_ENV !== 'production' &&
        process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

      if (isDevDemoAllowed) {
        const found = lookupDemoOrderSafe(orderRefInput, mobileInput);
        if (found) {
          setMatchedOrder(found);
          return;
        }
      }

      setErrorMsg(t('errorNotFound'));
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Lookup Form Card */}
      <div className="rounded-3xl border border-labsa-cream bg-labsa-white p-6 shadow-craft sm:p-10">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-labsa-surface text-labsa-terracotta">
            <PackageSearch className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-labsa-charcoal sm:text-3xl">
              {t('pageTitle')}
            </h1>
            <p className="mt-1 text-sm text-labsa-charcoal-muted">
              {t('pageSubtitle')}
            </p>
          </div>
        </div>

        {/* Lookup Form */}
        <form onSubmit={handleLookup} noValidate className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="track-order-ref"
                className="block text-xs font-bold text-labsa-charcoal"
              >
                {t('orderNumberLabel')}
              </label>
              <input
                id="track-order-ref"
                type="text"
                dir="ltr"
                required
                value={orderRefInput}
                onChange={(e) => setOrderRefInput(e.target.value)}
                placeholder={t('orderNumberPlaceholder')}
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3.5 py-2.5 font-mono text-sm text-labsa-charcoal placeholder:text-labsa-charcoal-light focus:border-labsa-terracotta focus:bg-labsa-white focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="track-mobile"
                className="block text-xs font-bold text-labsa-charcoal"
              >
                {t('mobileLabel')}
              </label>
              <input
                id="track-mobile"
                type="tel"
                inputMode="numeric"
                dir="ltr"
                required
                value={mobileInput}
                onChange={(e) => setMobileInput(e.target.value)}
                placeholder={t('mobilePlaceholder')}
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3.5 py-2.5 font-mono text-sm text-labsa-charcoal placeholder:text-labsa-charcoal-light focus:border-labsa-terracotta focus:bg-labsa-white focus:outline-none"
              />
            </div>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-labsa-status-danger/40 bg-labsa-status-danger/10 p-3.5 text-xs font-bold text-labsa-status-danger"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSearching}
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-labsa-terracotta px-6 py-3 text-sm font-extrabold text-labsa-white shadow-craft transition hover:bg-labsa-terracotta-dark disabled:opacity-60 sm:w-auto"
          >
            <PackageSearch className="h-4 w-4" aria-hidden="true" />
            <span>{isSearching ? t('searching') || t('searchButton') : t('searchButton')}</span>
          </button>
        </form>
      </div>

      {/* Matched Order Details & Status Tracks */}
      {matchedOrder && (
        <section className="mt-8 rounded-3xl border-2 border-dashed border-labsa-olive/60 bg-labsa-white p-6 shadow-craft sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-labsa-cream pb-4">
            <h2 className="text-xl font-extrabold text-labsa-charcoal">
              {t('resultHeading', { orderNumber: matchedOrder.orderNumber })}
            </h2>
            <span className="font-mono text-xs text-labsa-charcoal-muted">
              {t('placedAtLabel')}{' '}
              {new Date(matchedOrder.createdAt).toLocaleDateString(
                locale === 'ar' ? 'ar-EG' : 'en-EG',
                { year: 'numeric', month: 'short', day: 'numeric' }
              )}
            </span>
          </div>

          {/* 3 Independent Lifecycle Statuses */}
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-labsa-cream bg-labsa-canvas p-4">
              <span className="text-xs font-bold text-labsa-charcoal-muted">
                {tConfirm('orderStatusLabel')}
              </span>
              <p className="mt-1.5 text-sm font-extrabold text-labsa-charcoal">
                {tStatuses(`order.${matchedOrder.orderStatus}`)}
              </p>
            </div>

            <div className="rounded-2xl border border-labsa-terracotta/50 bg-labsa-terracotta-light/30 p-4">
              <span className="text-xs font-bold text-labsa-terracotta-dark">
                {tConfirm('paymentStatusLabel')}
              </span>
              <p className="mt-1.5 text-sm font-extrabold text-labsa-charcoal">
                {tStatuses(`payment.${matchedOrder.paymentStatus}`)}
              </p>
            </div>

            <div className="rounded-2xl border border-labsa-cream bg-labsa-canvas p-4">
              <span className="text-xs font-bold text-labsa-charcoal-muted">
                {tConfirm('shipmentStatusLabel')}
              </span>
              <p className="mt-1.5 text-sm font-extrabold text-labsa-olive-dark">
                {tStatuses(`shipment.${matchedOrder.shipmentStatus}`)}
              </p>
            </div>
          </div>

          {/* Shipment & Tracking Card */}
          {matchedOrder.shipmentTracking && (
            <div className="mt-5 rounded-2xl border border-labsa-olive/60 bg-labsa-olive-light/30 p-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 font-extrabold text-labsa-charcoal">
                  <Truck
                    className="h-4 w-4 text-labsa-olive-dark"
                    aria-hidden="true"
                  />
                  <span>{t('manualTrackingHeading')}</span>
                </p>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-labsa-cream bg-labsa-white p-3">
                  <span className="text-[11px] font-bold text-labsa-charcoal-muted">
                    {t('carrierLabel')}
                  </span>
                  <p className="mt-1 font-bold text-labsa-charcoal">
                    {matchedOrder.shipmentTracking.carrierName || '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-labsa-cream bg-labsa-white p-3">
                  <span className="text-[11px] font-bold text-labsa-charcoal-muted">
                    {t('trackingNumberLabel')}
                  </span>
                  <p
                    dir="ltr"
                    className="mt-1 font-mono font-bold text-labsa-charcoal"
                  >
                    {matchedOrder.shipmentTracking.trackingNumber || '—'}
                  </p>
                </div>
              </div>
              {matchedOrder.shipmentTracking.latestCustomerUpdate && (
                <div className="mt-3 rounded-xl border border-labsa-cream bg-labsa-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-labsa-olive-dark">
                      {t('latestTrackingUpdateLabel')}
                    </span>
                    <span className="font-mono text-[11px] text-labsa-charcoal-muted">
                      {new Date(
                        matchedOrder.shipmentTracking.updatedAt
                      ).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-EG')}
                    </span>
                  </div>
                  <p className="mt-1 font-bold text-labsa-charcoal">
                    {getLocalizedText(
                      matchedOrder.shipmentTracking.latestCustomerUpdate,
                      locale
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Address & Payment Summary */}
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-labsa-cream bg-labsa-canvas p-4 text-xs">
              <p className="flex items-center gap-1.5 font-extrabold text-labsa-charcoal">
                <MapPin className="h-4 w-4 text-labsa-terracotta" aria-hidden="true" />
                <span>{tConfirm('deliverySummaryHeading')}</span>
              </p>
              <p className="mt-2 font-bold text-labsa-charcoal">
                {matchedOrder.customer.fullName}
              </p>
              <p className="mt-1 text-labsa-charcoal-muted">
                {getLocalizedText(
                  matchedOrder.customer.governorateNameSnapshot,
                  locale
                )}{' '}
                — {matchedOrder.customer.cityOrArea} —{' '}
                {matchedOrder.customer.streetAndBuilding}
              </p>
            </div>

            <div className="rounded-2xl border border-labsa-cream bg-labsa-canvas p-4 text-xs">
              <p className="flex items-center gap-1.5 font-extrabold text-labsa-charcoal">
                <CreditCard
                  className="h-4 w-4 text-labsa-terracotta"
                  aria-hidden="true"
                />
                <span>{tConfirm('paymentMethodHeading')}</span>
              </p>
              <p className="mt-2 font-bold text-labsa-charcoal">
                {getLocalizedText(
                  getPaymentMethodOption(matchedOrder.paymentMethod).title,
                  locale
                )}
              </p>
              <p className="mt-1 text-labsa-charcoal-muted">
                {tConfirm('totalLabel')}:{' '}
                <strong className="font-mono text-sm text-labsa-charcoal">
                  {formatEGP(matchedOrder.pricing.totalEgp, locale)}
                </strong>{' '}
                ({tConfirm('subtotalLabel')}:{' '}
                {formatEGP(matchedOrder.pricing.subtotalEgp, locale)}
                {(matchedOrder.pricing.discountEgp ?? 0) > 0 && (
                  <>
                    {' '}
                    −{' '}
                    <span className="font-bold text-labsa-olive-dark">
                      <Tag className="inline h-3 w-3" />{' '}
                      {matchedOrder.pricing.couponCodeSnapshot
                        ? `${matchedOrder.pricing.couponCodeSnapshot}: `
                        : ''}
                      {formatEGP(matchedOrder.pricing.discountEgp ?? 0, locale)}
                    </span>
                  </>
                )}{' '}
                + <Truck className="inline h-3.5 w-3.5 text-labsa-terracotta" />{' '}
                {formatEGP(matchedOrder.pricing.deliveryFeeEgp, locale)})
              </p>
            </div>
          </div>

          {/* Ordered Items */}
          <div className="mt-6 border-t border-dashed border-labsa-cream pt-5">
            <h3 className="text-sm font-extrabold text-labsa-charcoal">
              {tConfirm('itemsHeading', {
                count: matchedOrder.items.reduce((s, i) => s + i.quantity, 0),
              })}
            </h3>
            <ul className="mt-3 divide-y divide-dashed divide-labsa-cream">
              {matchedOrder.items.map((item) => (
                <li
                  key={item.variantId}
                  className="flex items-center justify-between gap-3 py-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-labsa-charcoal">
                      {getLocalizedText(item.titleSnapshot, locale)}
                    </p>
                    <p className="mt-0.5 text-labsa-charcoal-muted">
                      {getLocalizedText(item.colorNameSnapshot, locale)} •{' '}
                      <span className="font-mono">{item.sizeSnapshot}</span> ×{' '}
                      <strong className="font-mono">{item.quantity}</strong>
                    </p>
                  </div>
                  <span className="font-mono font-bold text-labsa-charcoal">
                    {formatEGP(item.lineTotalEgp, locale)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Order Status Updates */}
          <div className="mt-6 rounded-2xl border border-labsa-cream bg-labsa-canvas p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-labsa-charcoal">
                <Bell
                  className="h-4 w-4 text-labsa-terracotta-dark"
                  aria-hidden="true"
                />
                <span>
                  {locale === 'ar'
                    ? 'تحديثات حالة الطلب'
                    : 'Order Status Updates'}
                </span>
              </h3>
            </div>
            <ul className="mt-3.5 space-y-2.5 text-xs">
              {buildOrderNotificationsForCustomer(matchedOrder).map((notif) => (
                <li
                  key={notif.id}
                  className="rounded-xl border border-labsa-cream bg-labsa-white p-3.5 shadow-2xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-extrabold text-labsa-charcoal">
                      {getLocalizedText(notif.title, locale)}
                    </span>
                    <span className="font-mono text-[11px] text-labsa-charcoal-muted">
                      {new Date(notif.timestamp).toLocaleString(
                        locale === 'ar' ? 'ar-EG' : 'en-EG'
                      )}
                    </span>
                  </div>
                  <p className="mt-1.5 font-bold text-labsa-olive-dark">
                    {getLocalizedText(notif.message, locale)}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Status History Log */}
          <div className="mt-6 border-t border-dashed border-labsa-cream pt-5">
            <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-labsa-charcoal">
              <Clock className="h-4 w-4 text-labsa-olive-dark" aria-hidden="true" />
              <span>{t('timelineHeading')}</span>
            </h3>
            <ul className="mt-3 space-y-2.5 text-xs">
              {matchedOrder.statusHistory.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-xl border border-labsa-cream bg-labsa-canvas p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-labsa-charcoal">
                      {getLocalizedText(entry.note, locale)}
                    </span>
                    <span className="font-mono text-[11px] text-labsa-charcoal-muted">
                      {new Date(entry.timestamp).toLocaleString(
                        locale === 'ar' ? 'ar-EG' : 'en-EG'
                      )}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}

export default function OrderTrackPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-12 text-center text-sm text-labsa-charcoal-muted">
          ...
        </div>
      }
    >
      <OrderTrackContent />
    </Suspense>
  );
}
