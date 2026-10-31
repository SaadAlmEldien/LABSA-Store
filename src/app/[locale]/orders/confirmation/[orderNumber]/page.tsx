'use client';

import React, { useState, useEffect, use } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { getLocalizedText } from '@/data/catalog';
import {
  type DemoOrder,
  getDemoOrderByNumber,
  sanitizeOrderForCustomer,
} from '@/data/orders';
import { buildOrderNotificationsForCustomer } from '@/data/notifications';
import { getPaymentMethodOption } from '@/data/payments';
import { formatEGP } from '@/lib/utils';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  ClipboardCopy,
  CreditCard,
  MapPin,
  PackageSearch,
  Truck,
} from 'lucide-react';

export default function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = use(params);
  const locale = useLocale();
  const t = useTranslations('OrderConfirmation');
  const tStatuses = useTranslations('OrderStatuses');
  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight;

  const [order, setOrder] = useState<DemoOrder | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadConfirmation() {
      // Extract bearer token strictly from URL fragment (#token=...) or temporary session storage.
      // The token is NEVER passed in URL query strings, preserving privacy in server logs and Referer headers.
      let bearerToken = '';
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.replace(/^#/, '');
        if (hash) {
          const params = new URLSearchParams(hash);
          bearerToken = params.get('token')?.trim() || '';
        }
        if (!bearerToken) {
          try {
            bearerToken = sessionStorage.getItem(`labsa_token_${orderNumber}`)?.trim() || '';
          } catch {
            // sessionStorage blocked or unavailable
          }
        }
      }

      if (bearerToken) {
        try {
          const res = await fetch(
            `/api/orders/confirmation/${encodeURIComponent(orderNumber)}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: bearerToken }),
            }
          );
          if (res.ok) {
            const data = await res.json();
            if (active && data.ok && data.order) {
              setOrder(data.order);
              setIsLoaded(true);
              return;
            }
          }
        } catch {
          // Network or server error
        }
      }

      if (active) {
        const isDevDemoAllowed =
          process.env.NODE_ENV !== 'production' &&
          process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

        if (isDevDemoAllowed) {
          const raw = getDemoOrderByNumber(decodeURIComponent(orderNumber));
          const found = raw ? sanitizeOrderForCustomer(raw) : null;
          setOrder(found);
        } else {
          setOrder(null);
        }
        setIsLoaded(true);
      }
    }

    loadConfirmation();

    return () => {
      active = false;
    };
  }, [orderNumber]);

  async function handleCopyReference() {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignore clipboard permission errors
    }
  }

  if (!isLoaded) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="h-72 animate-pulse rounded-3xl border border-labsa-cream bg-labsa-white p-8" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border-2 border-dashed border-labsa-cream bg-labsa-white p-8 text-center shadow-craft sm:p-12">
          <h1 className="text-2xl font-extrabold text-labsa-charcoal">
            {t('notFoundTitle')}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-labsa-charcoal-muted">
            {t('notFoundDescription')}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/orders/track"
              className="inline-flex items-center gap-2 rounded-xl bg-labsa-terracotta px-5 py-2.5 text-sm font-bold text-labsa-white transition hover:bg-labsa-terracotta-dark"
            >
              <PackageSearch className="h-4 w-4" aria-hidden="true" />
              <span>{t('trackOrderCta')}</span>
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-xl border border-labsa-cream bg-labsa-canvas px-5 py-2.5 text-sm font-bold text-labsa-charcoal"
            >
              <span>{t('continueShoppingCta')}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const paymentOption = getPaymentMethodOption(order.paymentMethod);
  const govName = getLocalizedText(order.customer.governorateNameSnapshot, locale);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Privacy: Ensure no external links leak referrer information */}
      <meta name="referrer" content="no-referrer" />

      {/* Main Confirmation Header Card */}
      <div className="rounded-3xl border border-labsa-cream bg-labsa-white p-6 shadow-craft sm:p-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-labsa-status-success/15 px-3.5 py-1 text-xs font-extrabold text-labsa-status-success">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          <span>{t('badge')}</span>
        </div>

        <h1 className="mt-4 text-2xl font-extrabold text-labsa-charcoal sm:text-4xl">
          {t('title')}
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-labsa-charcoal-muted sm:text-base">
          {t('subtitle')}
        </p>

        {/* Copyable Order Reference & Mobile Lookup Reminder */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-labsa-cream bg-labsa-canvas p-5">
          <div>
            <p className="text-xs font-bold text-labsa-charcoal-muted">
              {t('orderNumberLabel')}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <span className="font-mono text-2xl font-extrabold tracking-wider text-labsa-charcoal">
                {order.orderNumber}
              </span>
              <button
                type="button"
                onClick={handleCopyReference}
                className="inline-flex items-center gap-1.5 rounded-xl border border-labsa-charcoal bg-labsa-white px-3.5 py-1.5 text-xs font-bold text-labsa-charcoal transition hover:bg-labsa-charcoal hover:text-labsa-white"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-labsa-status-success" aria-hidden="true" />
                    <span>{t('copiedDone')}</span>
                  </>
                ) : (
                  <>
                    <ClipboardCopy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t('copyOrderNumber')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="text-xs">
            <span className="block font-bold text-labsa-charcoal-muted">
              {t('lookupPhoneReminder')}
            </span>
            <span className="mt-1 inline-block rounded-lg bg-labsa-white px-3 py-1 font-mono text-sm font-bold text-labsa-olive-dark border border-labsa-cream">
              {order.customer.mobileNumber}
            </span>
          </div>
        </div>

        {/* 3. Three Separate Initial Lifecycle Statuses */}
        <div className="mt-8">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-labsa-charcoal">
            {t('statusesHeading')}
          </h2>

          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Track 1: Order Lifecycle */}
            <div className="rounded-2xl border border-labsa-cream bg-labsa-canvas p-4">
              <span className="text-xs font-bold text-labsa-charcoal-muted">
                {t('orderStatusLabel')}
              </span>
              <p className="mt-1.5 text-sm font-extrabold text-labsa-charcoal">
                {tStatuses(`order.${order.orderStatus}`)}
              </p>
            </div>

            {/* Track 2: Payment Lifecycle */}
            <div className="rounded-2xl border border-labsa-terracotta/50 bg-labsa-terracotta-light/30 p-4">
              <span className="text-xs font-bold text-labsa-terracotta-dark">
                {t('paymentStatusLabel')}
              </span>
              <p className="mt-1.5 text-sm font-extrabold text-labsa-charcoal">
                {tStatuses(`payment.${order.paymentStatus}`)}
              </p>
            </div>

            {/* Track 3: Shipment Lifecycle */}
            <div className="rounded-2xl border border-labsa-cream bg-labsa-canvas p-4">
              <span className="text-xs font-bold text-labsa-charcoal-muted">
                {t('shipmentStatusLabel')}
              </span>
              <p className="mt-1.5 text-sm font-extrabold text-labsa-olive-dark">
                {tStatuses(`shipment.${order.shipmentStatus}`)}
              </p>
            </div>
          </div>
        </div>

        {/* 4. Delivery Summary & Payment Method Details */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Delivery Address & Governorate Snapshot */}
          <div className="rounded-2xl border border-labsa-cream bg-labsa-canvas p-5">
            <div className="flex items-center gap-2 text-sm font-extrabold text-labsa-charcoal">
              <MapPin className="h-4 w-4 text-labsa-terracotta" aria-hidden="true" />
              <h3>{t('deliverySummaryHeading')}</h3>
            </div>

            <dl className="mt-3 space-y-2 text-xs text-labsa-charcoal">
              <div>
                <dt className="inline font-bold text-labsa-charcoal-muted">
                  {t('recipientLabel')}{' '}
                </dt>
                <dd className="inline font-bold">{order.customer.fullName}</dd>
              </div>
              <div>
                <dt className="inline font-bold text-labsa-charcoal-muted">
                  {t('mobileLabel')}{' '}
                </dt>
                <dd className="inline font-mono font-bold">
                  {order.customer.mobileNumber}
                </dd>
              </div>
              <div>
                <dt className="inline font-bold text-labsa-charcoal-muted">
                  {t('governorateLabel')}{' '}
                </dt>
                <dd className="inline font-bold text-labsa-olive-dark">
                  {govName} ({formatEGP(order.pricing.deliveryFeeEgp, locale)})
                </dd>
              </div>
              <div>
                <dt className="inline font-bold text-labsa-charcoal-muted">
                  {t('addressLabel')}{' '}
                </dt>
                <dd className="inline">
                  {order.customer.cityOrArea} — {order.customer.streetAndBuilding}
                </dd>
              </div>
              {order.customer.landmark && (
                <div>
                  <dt className="inline font-bold text-labsa-charcoal-muted">
                    {t('landmarkLabel')}{' '}
                  </dt>
                  <dd className="inline">{order.customer.landmark}</dd>
                </div>
              )}
              {order.customer.deliveryNote && (
                <div>
                  <dt className="inline font-bold text-labsa-charcoal-muted">
                    {t('notesLabel')}{' '}
                  </dt>
                  <dd className="inline">{order.customer.deliveryNote}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Payment Method & Demo Instructions */}
          <div className="rounded-2xl border border-labsa-cream bg-labsa-canvas p-5">
            <div className="flex items-center gap-2 text-sm font-extrabold text-labsa-charcoal">
              <CreditCard
                className="h-4 w-4 text-labsa-terracotta"
                aria-hidden="true"
              />
              <h3>{t('paymentMethodHeading')}</h3>
            </div>

            <p className="mt-3 text-sm font-bold text-labsa-charcoal">
              {getLocalizedText(paymentOption.title, locale)}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-labsa-charcoal-muted">
              {getLocalizedText(paymentOption.description, locale)}
            </p>
          </div>
        </div>

        {/* 5. Ordered Items & Locked-In EGP Totals */}
        <div className="mt-8 border-t border-dashed border-labsa-cream pt-6">
          <h2 className="text-base font-extrabold text-labsa-charcoal">
            {t('itemsHeading', {
              count: order.items.reduce((s, i) => s + i.quantity, 0),
            })}
          </h2>

          <ul className="mt-4 divide-y divide-dashed divide-labsa-cream">
            {order.items.map((item) => (
              <li
                key={item.variantId}
                className="flex flex-wrap items-center justify-between gap-4 py-3.5 text-xs sm:text-sm"
              >
                <div className="flex items-center gap-3.5">
                  <img
                    src={item.imageUrlSnapshot}
                    alt={getLocalizedText(item.titleSnapshot, locale)}
                    className="h-16 w-14 rounded-xl border border-labsa-cream object-cover"
                  />
                  <div>
                    <p className="font-bold text-labsa-charcoal">
                      {getLocalizedText(item.titleSnapshot, locale)}
                    </p>
                    <p className="mt-0.5 text-xs text-labsa-charcoal-muted">
                      {getLocalizedText(item.colorNameSnapshot, locale)} •{' '}
                      <span className="font-mono">{item.sizeSnapshot}</span> •{' '}
                      <span className="font-mono">{item.skuSnapshot}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-labsa-charcoal-muted">
                      {formatEGP(item.unitPriceEgp, locale)} ×{' '}
                      <strong className="font-mono">{item.quantity}</strong>
                    </p>
                  </div>
                </div>

                <span className="font-mono text-base font-extrabold text-labsa-charcoal">
                  {formatEGP(item.lineTotalEgp, locale)}
                </span>
              </li>
            ))}
          </ul>

          {/* Order Totals Box */}
          <dl className="mt-5 rounded-2xl border border-labsa-cream bg-labsa-canvas p-5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-labsa-charcoal-muted">{t('subtotalLabel')}</dt>
              <dd className="font-bold text-labsa-charcoal">
                {formatEGP(order.pricing.subtotalEgp, locale)}
              </dd>
            </div>
            {(order.pricing.discountEgp ?? 0) > 0 && (
              <div className="mt-2.5 flex items-center justify-between text-labsa-olive-dark">
                <dt className="font-bold">
                  {order.pricing.couponCodeSnapshot
                    ? `${locale === 'ar' ? 'خصم الكوبون' : 'Coupon Discount'} (${order.pricing.couponCodeSnapshot})`
                    : locale === 'ar'
                      ? 'الخصم'
                      : 'Discount'}
                </dt>
                <dd className="font-mono font-extrabold">
                  - {formatEGP(order.pricing.discountEgp ?? 0, locale)}
                </dd>
              </div>
            )}
            <div className="mt-2.5 flex items-center justify-between">
              <dt className="flex items-center gap-1.5 text-labsa-charcoal-muted">
                <Truck
                  className="h-4 w-4 text-labsa-terracotta"
                  aria-hidden="true"
                />
                <span>{t('shippingFeeLabel', { gov: govName })}</span>
              </dt>
              <dd className="font-bold text-labsa-olive-dark">
                {formatEGP(order.pricing.deliveryFeeEgp, locale)}
              </dd>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-labsa-cream pt-3 text-base">
              <dt className="font-extrabold text-labsa-charcoal">
                {t('totalLabel')}
              </dt>
              <dd className="text-2xl font-extrabold text-labsa-charcoal">
                {formatEGP(order.pricing.totalEgp, locale)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Order Activity & Status Updates */}
        <div className="mt-6 rounded-2xl border border-labsa-cream bg-labsa-canvas p-5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-labsa-charcoal">
              <Bell
                className="h-4 w-4 text-labsa-terracotta-dark"
                aria-hidden="true"
              />
              <span>
                {locale === 'ar'
                  ? 'تحديثات حالة الطلب'
                  : 'Order Status Updates'}
              </span>
            </h2>
          </div>
          <ul className="mt-3 space-y-2">
            {buildOrderNotificationsForCustomer(order).map((notif) => (
              <li
                key={notif.id}
                className="rounded-xl border border-labsa-cream bg-labsa-white p-3"
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
                <p className="mt-1 font-bold text-labsa-olive-dark">
                  {getLocalizedText(notif.message, locale)}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* 6. Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-labsa-cream pt-6">
          <Link
            href={`/orders/track?order=${encodeURIComponent(order.orderNumber)}`}
            className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-labsa-charcoal px-6 py-3 text-sm font-bold text-labsa-white shadow-craft transition hover:bg-labsa-olive-dark"
          >
            <PackageSearch className="h-4 w-4" aria-hidden="true" />
            <span>{t('trackOrderCta')}</span>
          </Link>

          <Link
            href="/shop"
            className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-labsa-terracotta px-6 py-3 text-sm font-bold text-labsa-white shadow-craft transition hover:bg-labsa-terracotta-dark"
          >
            <span>{t('continueShoppingCta')}</span>
            <ArrowIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
