'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { useCart } from '@/context/CartContext';
import { CouponBoxSection } from '@/components/cart/CouponBoxSection';
import { getLocalizedText } from '@/data/catalog';
import {
  EGYPT_GOVERNORATES,
  getGovernorateByCode,
  getGovernorateDisplayName,
} from '@/data/shipping';
import {
  DEMO_PAYMENT_METHODS,
  type PaymentMethodId,
} from '@/data/payments';
import {
  isValidEgyptianMobile,
  placeDemoOrder,
} from '@/data/orders';
import { formatEGP, cn } from '@/lib/utils';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  MapPin,
  Search,
  ShoppingBag,
  Truck,
} from 'lucide-react';

interface CheckoutFieldErrors {
  fullName?: string;
  mobileNumber?: string;
  governorateCode?: string;
  cityOrArea?: string;
  streetAndBuilding?: string;
  general?: string;
}

export default function CheckoutPage() {
  const locale = useLocale();
  const t = useTranslations('Checkout');
  const tCart = useTranslations('Cart');
  const tCoupons = useTranslations('Coupons');
  const tStatuses = useTranslations('OrderStatuses');
  const router = useRouter();

  const BackArrow = locale === 'ar' ? ArrowRight : ArrowLeft;
  const ForwardArrow = locale === 'ar' ? ArrowLeft : ArrowRight;

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
    clearCart,
    inspectItemHealth,
  } = useCart();

  // Form State (kept strictly in memory; never logged or exposed in URLs)
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [governorateSearch, setGovernorateSearch] = useState('');
  const [cityOrArea, setCityOrArea] = useState('');
  const [streetAndBuilding, setStreetAndBuilding] = useState('');
  const [landmark, setLandmark] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('cod');

  const [errors, setErrors] = useState<CheckoutFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active submission attempt tracking: strictly binds the idempotency key to the exact submitted payload.
  // The key is preserved across network retries AND page refreshes ONLY for the identical canonical payload.
  // CRITICAL: Raw customer data is NEVER persisted in browser storage; only a collision-resistant SHA-256 hash is kept.
  const activeSubmissionRef = useRef<{
    key: string;
    payloadHash: string;
  } | null>(null);

  // Restore unexpired pending submission key on mount in case user refreshed after an uncertain outcome
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem('labsa_pending_checkout_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          typeof parsed.key === 'string' &&
          typeof parsed.payloadHash === 'string' &&
          Date.now() - Number(parsed.timestamp) < 15 * 60 * 1000 // 15-minute window
        ) {
          activeSubmissionRef.current = {
            key: parsed.key,
            payloadHash: parsed.payloadHash,
          };
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  function getPayloadSignature(): string {
    const couponCode =
      couponValidation && couponValidation.valid
        ? couponValidation.coupon.code.trim().toUpperCase()
        : '';
    const sortedItems = [...items]
      .sort((a, b) => a.variantId.localeCompare(b.variantId))
      .map((i) => [i.variantId.trim(), Math.floor(Number(i.quantity))]);

    // Structured canonical representation: JSON array with fixed element positions
    // Prevents field-delimiter ambiguity vulnerabilities.
    return JSON.stringify([
      'v3_checkout_signature',
      fullName.trim().toLowerCase(),
      mobileNumber.trim(),
      selectedGovernorateCode.trim().toLowerCase(),
      cityOrArea.trim().toLowerCase(),
      streetAndBuilding.trim().toLowerCase(),
      landmark.trim().toLowerCase(),
      deliveryNote.trim().toLowerCase(),
      paymentMethod.trim().toLowerCase(),
      couponCode,
      sortedItems,
    ]);
  }

  async function computePayloadHash(signature: string): Promise<string> {
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      const msgBuffer = new TextEncoder().encode(signature);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    // Deterministic fallback hash if subtle crypto is unavailable
    let h1 = 0x811c9dc5;
    for (let i = 0; i < signature.length; i++) {
      h1 ^= signature.charCodeAt(i);
      h1 = Math.imul(h1, 0x01000193);
    }
    return `fnv_${(h1 >>> 0).toString(16)}`;
  }

  // Filterable 27-governorate list for quick searching in Arabic or English
  const filteredGovernorates = useMemo(() => {
    const q = governorateSearch.trim().toLowerCase();
    if (!q) return EGYPT_GOVERNORATES;
    return EGYPT_GOVERNORATES.filter(
      (g) =>
        g.name.ar.toLowerCase().includes(q) ||
        g.name.en.toLowerCase().includes(q) ||
        g.code.toLowerCase().includes(q)
    );
  }, [governorateSearch]);

  const selectedGov = useMemo(
    () => getGovernorateByCode(selectedGovernorateCode),
    [selectedGovernorateCode]
  );

  const deliveryFeeEgp = selectedGov ? selectedGov.feeEgp : null;
  const grandTotalEgp =
    deliveryFeeEgp !== null
      ? discountedSubtotalEgp + deliveryFeeEgp
      : discountedSubtotalEgp;

  const itemHealthList = useMemo(
    () => items.map((item) => ({ item, health: inspectItemHealth(item) })),
    [items, inspectItemHealth]
  );

  const cartHasBlockingIssues = itemHealthList.some(
    ({ health }) => !health.isValid
  );

  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="h-72 animate-pulse rounded-3xl border border-labsa-cream bg-labsa-white p-8" />
      </div>
    );
  }

  // If cart is empty and not currently redirecting after submit, show empty state
  if (items.length === 0 && !isSubmitting) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border-2 border-dashed border-labsa-cream bg-labsa-white p-8 text-center shadow-craft sm:p-12">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-labsa-surface text-labsa-terracotta">
            <ShoppingBag className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold text-labsa-charcoal sm:text-3xl">
            {tCart('emptyTitle')}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-labsa-charcoal-muted">
            {tCart('emptySubtitle')}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/men"
              className="inline-flex items-center gap-2 rounded-xl bg-labsa-charcoal px-6 py-3 text-sm font-bold text-labsa-white transition hover:bg-labsa-olive-dark"
            >
              <span>{tCart('browseMenCta')}</span>
            </Link>
            <Link
              href="/kids"
              className="inline-flex items-center gap-2 rounded-xl bg-labsa-terracotta px-6 py-3 text-sm font-bold text-labsa-white transition hover:bg-labsa-terracotta-dark"
            >
              <span>{tCart('browseKidsCta')}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  function validateForm(): boolean {
    const nextErrors: CheckoutFieldErrors = {};

    if (fullName.trim().length < 2) {
      nextErrors.fullName = t('validation.fullNameRequired');
    }

    if (!isValidEgyptianMobile(mobileNumber)) {
      nextErrors.mobileNumber = t('validation.mobileRequired');
    }

    if (!selectedGovernorateCode || !getGovernorateByCode(selectedGovernorateCode)) {
      nextErrors.governorateCode = t('validation.governorateRequired');
    }

    if (cityOrArea.trim().length < 2) {
      nextErrors.cityOrArea = t('validation.cityRequired');
    }

    if (streetAndBuilding.trim().length < 5) {
      nextErrors.streetAndBuilding = t('validation.streetRequired');
    }

    if (cartHasBlockingIssues) {
      nextErrors.general = t('validation.cartInvalid');
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmitOrder(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const currentSignature = getPayloadSignature();
    const currentHash = await computePayloadHash(currentSignature);
    let activeKey = '';

    // Check if we have an active in-flight or recovered submission matching this EXACT canonical payload
    let isReusingKey = false;
    if (
      activeSubmissionRef.current &&
      activeSubmissionRef.current.payloadHash === currentHash
    ) {
      activeKey = activeSubmissionRef.current.key;
      isReusingKey = true;
    } else if (typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem('labsa_pending_checkout_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (
            parsed &&
            typeof parsed.key === 'string' &&
            parsed.payloadHash === currentHash &&
            Date.now() - Number(parsed.timestamp) < 15 * 60 * 1000
          ) {
            activeKey = parsed.key;
            isReusingKey = true;
          }
        }
      } catch {
        // Ignore storage errors
      }
    }

    // If payload changed or no matching pending submission exists, generate a fresh cryptographic key
    if (!isReusingKey || !activeKey) {
      activeKey =
        typeof window !== 'undefined' && window.crypto?.randomUUID
          ? window.crypto.randomUUID()
          : `labsa_idemp_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    }

    // Persist submission key bound to payload hash (strictly non-PII) across refresh & retry
    activeSubmissionRef.current = {
      key: activeKey,
      payloadHash: currentHash,
    };
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(
          'labsa_pending_checkout_v1',
          JSON.stringify({
            key: activeKey,
            payloadHash: currentHash,
            timestamp: Date.now(),
          })
        );
      } catch {
        // Ignore quota/disabled storage
      }
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': activeKey,
        },
        body: JSON.stringify({
          idempotencyKey: activeKey,
          customer: {
            fullName,
            mobileNumber,
            governorateCode: selectedGovernorateCode,
            cityOrArea,
            streetAndBuilding,
            landmark: landmark.trim() || undefined,
            deliveryNote: deliveryNote.trim() || undefined,
          },
          paymentMethod,
          couponCode:
            couponValidation && couponValidation.valid
              ? couponValidation.coupon.code
              : null,
          items: items.map((i) => ({
            variantId: i.variantId,
            productId: i.productId,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setIsSubmitting(false);
        // On definitive error from server, clear pending submission so next submit gets a fresh key
        activeSubmissionRef.current = null;
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.removeItem('labsa_pending_checkout_v1');
          } catch {
            // Ignore
          }
        }

        if (data.errorCode === 'idempotency_conflict') {
          setErrors({
            general:
              locale === 'ar'
                ? 'حدث تعارض في مفتاح الطلب مع بيانات سابقة. تم تجديد جلسة الطلب، يُرجى المحاولة مرة أخرى.'
                : 'A checkout conflict occurred. Your attempt key was refreshed; please try again.',
          });
        } else if (data.errorCode === 'pricing_mismatch') {
          setErrors({
            general:
              locale === 'ar'
                ? 'تم تحديث أسعار المنتجات أو قسيمة الخصم في النظام. يُرجى مراجعة الإجمالي والمحاولة مجدداً.'
                : 'Catalog prices or coupon rules have updated. Please review your total and try again.',
          });
        } else if (
          data.errorCode === 'variant_unavailable' ||
          data.errorCode === 'insufficient_stock'
        ) {
          setErrors({ general: t('validation.cartInvalid') });
        } else if (data.errorCode === 'invalid_mobile') {
          setErrors({ mobileNumber: t('validation.mobileInvalid') });
        } else {
          setErrors({ general: data.message || t('validation.saveFailed') });
        }
        return;
      }

      // Successful order creation or idempotent replay: clear submission tracking and cart
      activeSubmissionRef.current = null;
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem('labsa_pending_checkout_v1');
        } catch {
          // Ignore
        }
      }
      clearCart();

      // Store lookup token in tab-local sessionStorage for reliable page reloads without URL exposure
      const token = data.order?.customerLookupToken;
      if (typeof window !== 'undefined' && token) {
        try {
          sessionStorage.setItem(`labsa_token_${data.order.orderNumber}`, token);
        } catch {
          // Ignore storage quota or disabled storage
        }
      }

      // Navigate using URL fragment (#token=...) to ensure token is NEVER passed in URL query strings or paths
      const tokenHash = token ? `#token=${encodeURIComponent(token)}` : '';
      router.push(`/orders/confirmation/${data.order.orderNumber}${tokenHash}`);
    } catch {
      // On network timeout or connection failure, KEEP activeSubmissionRef.current intact!
      // If the user retries immediately without modifying any field, the exact same key is safely reused.
      // If the user modifies any field, getPayloadSignature() will differ on the next submit, generating a fresh key.
      setIsSubmitting(false);
      setErrors({
        general:
          locale === 'ar'
            ? 'تعذر الوصول إلى الخادم أو انقطع الاتصال. يمكنك إعادة المحاولة بأمان دون تكرار الخصم أو الطلب.'
            : 'Connection lost or server timed out. You can safely retry without placing a duplicate order.',
      });
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header & Back to Cart Link */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-labsa-charcoal sm:text-4xl">
            {t('pageTitle')}
          </h1>
          <p className="mt-1.5 text-sm text-labsa-charcoal-muted sm:text-base">
            {t('pageSubtitle')}
          </p>
        </div>

        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 rounded-xl border border-labsa-cream bg-labsa-white px-4 py-2 text-xs font-bold text-labsa-charcoal transition hover:border-labsa-terracotta"
        >
          <BackArrow className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{t('backToCart')}</span>
        </Link>
      </div>

      {/* General Validation Error Banner */}
      {(Object.keys(errors).length > 0 || cartHasBlockingIssues) && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-2xl border-2 border-labsa-status-danger/50 bg-labsa-status-danger/10 p-4 text-sm font-bold text-labsa-status-danger"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p>{errors.general ?? t('validation.fixErrorsBanner')}</p>
            {cartHasBlockingIssues && (
              <Link
                href="/cart"
                className="mt-1.5 inline-block text-xs underline"
              >
                {t('backToCart')}
              </Link>
            )}
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmitOrder}
        noValidate
        className="grid grid-cols-1 gap-8 lg:grid-cols-12"
      >
        {/* Left / Start Column: Address Fields, Payment Selection & Final Review */}
        <div className="space-y-8 lg:col-span-7">
          {/* =================================================================
              STEP 1: RECIPIENT & EGYPTIAN DELIVERY ADDRESS
             ================================================================= */}
          <section className="rounded-3xl border border-labsa-cream bg-labsa-white p-6 shadow-craft sm:p-8">
            <div className="flex items-center gap-2.5 border-b border-dashed border-labsa-cream pb-4">
              <MapPin className="h-5 w-5 text-labsa-terracotta" aria-hidden="true" />
              <h2 className="text-lg font-extrabold text-labsa-charcoal">
                {t('step1Title')}
              </h2>
            </div>

            <div className="mt-6 space-y-5">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="checkout-fullname"
                  className="block text-xs font-bold text-labsa-charcoal"
                >
                  {t('fullNameLabel')}
                </label>
                <input
                  id="checkout-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) {
                      setErrors((prev) => ({ ...prev, fullName: undefined }));
                    }
                  }}
                  placeholder={t('fullNamePlaceholder')}
                  aria-invalid={Boolean(errors.fullName)}
                  aria-describedby={
                    errors.fullName ? 'err-checkout-fullname' : undefined
                  }
                  className={cn(
                    'mt-1.5 min-h-[44px] w-full rounded-xl border bg-labsa-canvas px-3.5 py-2.5 text-sm text-labsa-charcoal placeholder:text-labsa-charcoal-light focus:bg-labsa-white focus:outline-none',
                    errors.fullName
                      ? 'border-labsa-status-danger'
                      : 'border-labsa-cream focus:border-labsa-terracotta'
                  )}
                />
                {errors.fullName && (
                  <p
                    id="err-checkout-fullname"
                    role="alert"
                    className="mt-1.5 text-xs font-bold text-labsa-status-danger"
                  >
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Egyptian Mobile Number */}
              <div>
                <label
                  htmlFor="checkout-mobile"
                  className="block text-xs font-bold text-labsa-charcoal"
                >
                  {t('mobileLabel')}
                </label>
                <input
                  id="checkout-mobile"
                  type="tel"
                  inputMode="numeric"
                  dir="ltr"
                  required
                  value={mobileNumber}
                  onChange={(e) => {
                    setMobileNumber(e.target.value);
                    if (errors.mobileNumber) {
                      setErrors((prev) => ({
                        ...prev,
                        mobileNumber: undefined,
                      }));
                    }
                  }}
                  placeholder={t('mobilePlaceholder')}
                  aria-invalid={Boolean(errors.mobileNumber)}
                  aria-describedby={
                    errors.mobileNumber
                      ? 'err-checkout-mobile'
                      : 'hint-checkout-mobile'
                  }
                  className={cn(
                    'mt-1.5 min-h-[44px] w-full rounded-xl border bg-labsa-canvas px-3.5 py-2.5 text-start font-mono text-sm text-labsa-charcoal placeholder:text-labsa-charcoal-light focus:bg-labsa-white focus:outline-none',
                    errors.mobileNumber
                      ? 'border-labsa-status-danger'
                      : 'border-labsa-cream focus:border-labsa-terracotta'
                  )}
                />
                <p
                  id="hint-checkout-mobile"
                  className="mt-1 text-[11px] text-labsa-charcoal-muted"
                >
                  {t('mobileHint')}
                </p>
                {errors.mobileNumber && (
                  <p
                    id="err-checkout-mobile"
                    role="alert"
                    className="mt-1.5 text-xs font-bold text-labsa-status-danger"
                  >
                    {errors.mobileNumber}
                  </p>
                )}
              </div>

              {/* Searchable & Selectable 27-Governorate Selector */}
              <div className="rounded-2xl border border-labsa-cream bg-labsa-canvas p-4">
                <label
                  htmlFor="checkout-governorate"
                  className="block text-xs font-bold text-labsa-charcoal"
                >
                  {t('governorateLabel')}
                </label>

                {/* Quick Filter Input for 27 Governorates */}
                <div className="relative mt-2">
                  <Search
                    className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-labsa-charcoal-muted"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={governorateSearch}
                    onChange={(e) => setGovernorateSearch(e.target.value)}
                    placeholder={t('governorateSearchPlaceholder')}
                    aria-label={t('governorateSearchPlaceholder')}
                    className="min-h-[38px] w-full rounded-lg border border-labsa-cream bg-labsa-white ps-9 pe-3 py-1.5 text-xs text-labsa-charcoal placeholder:text-labsa-charcoal-light focus:border-labsa-terracotta focus:outline-none"
                  />
                </div>

                {/* Select Dropdown of All 27 Egyptian Governorates */}
                <select
                  id="checkout-governorate"
                  required
                  value={selectedGovernorateCode}
                  onChange={(e) => {
                    setSelectedGovernorateCode(e.target.value);
                    if (errors.governorateCode) {
                      setErrors((prev) => ({
                        ...prev,
                        governorateCode: undefined,
                      }));
                    }
                  }}
                  aria-invalid={Boolean(errors.governorateCode)}
                  aria-describedby={
                    errors.governorateCode ? 'err-checkout-gov' : undefined
                  }
                  className={cn(
                    'mt-2.5 min-h-[44px] w-full rounded-xl border bg-labsa-white px-3.5 py-2 text-sm font-bold text-labsa-charcoal focus:outline-none',
                    errors.governorateCode
                      ? 'border-labsa-status-danger'
                      : 'border-labsa-cream focus:border-labsa-terracotta'
                  )}
                >
                  <option value="">{t('governoratePlaceholder')}</option>
                  {filteredGovernorates.map((gov) => (
                    <option key={gov.code} value={gov.code}>
                      {gov.name.ar} ({gov.name.en}) —{' '}
                      {formatEGP(gov.feeEgp, locale)}
                    </option>
                  ))}
                </select>

                {/* Instant Governorate Fee Feedback */}
                {selectedGov && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-labsa-olive/40 bg-labsa-white px-3.5 py-2 text-xs">
                    <span className="font-bold text-labsa-charcoal">
                      {getGovernorateDisplayName(selectedGov, locale)} (
                      {getLocalizedText(selectedGov.estimatedDays, locale)})
                    </span>
                    <span className="rounded-lg bg-labsa-olive px-2.5 py-0.5 font-mono font-extrabold text-labsa-white">
                      {formatEGP(selectedGov.feeEgp, locale)}
                    </span>
                  </div>
                )}

                {errors.governorateCode && (
                  <p
                    id="err-checkout-gov"
                    role="alert"
                    className="mt-2 text-xs font-bold text-labsa-status-danger"
                  >
                    {errors.governorateCode}
                  </p>
                )}
              </div>

              {/* City / District / Area */}
              <div>
                <label
                  htmlFor="checkout-city"
                  className="block text-xs font-bold text-labsa-charcoal"
                >
                  {t('cityOrAreaLabel')}
                </label>
                <input
                  id="checkout-city"
                  type="text"
                  required
                  value={cityOrArea}
                  onChange={(e) => {
                    setCityOrArea(e.target.value);
                    if (errors.cityOrArea) {
                      setErrors((prev) => ({ ...prev, cityOrArea: undefined }));
                    }
                  }}
                  placeholder={t('cityOrAreaPlaceholder')}
                  aria-invalid={Boolean(errors.cityOrArea)}
                  aria-describedby={
                    errors.cityOrArea ? 'err-checkout-city' : undefined
                  }
                  className={cn(
                    'mt-1.5 min-h-[44px] w-full rounded-xl border bg-labsa-canvas px-3.5 py-2.5 text-sm text-labsa-charcoal placeholder:text-labsa-charcoal-light focus:bg-labsa-white focus:outline-none',
                    errors.cityOrArea
                      ? 'border-labsa-status-danger'
                      : 'border-labsa-cream focus:border-labsa-terracotta'
                  )}
                />
                {errors.cityOrArea && (
                  <p
                    id="err-checkout-city"
                    role="alert"
                    className="mt-1.5 text-xs font-bold text-labsa-status-danger"
                  >
                    {errors.cityOrArea}
                  </p>
                )}
              </div>

              {/* Street & Building Details */}
              <div>
                <label
                  htmlFor="checkout-street"
                  className="block text-xs font-bold text-labsa-charcoal"
                >
                  {t('streetAndBuildingLabel')}
                </label>
                <input
                  id="checkout-street"
                  type="text"
                  required
                  value={streetAndBuilding}
                  onChange={(e) => {
                    setStreetAndBuilding(e.target.value);
                    if (errors.streetAndBuilding) {
                      setErrors((prev) => ({
                        ...prev,
                        streetAndBuilding: undefined,
                      }));
                    }
                  }}
                  placeholder={t('streetAndBuildingPlaceholder')}
                  aria-invalid={Boolean(errors.streetAndBuilding)}
                  aria-describedby={
                    errors.streetAndBuilding ? 'err-checkout-street' : undefined
                  }
                  className={cn(
                    'mt-1.5 min-h-[44px] w-full rounded-xl border bg-labsa-canvas px-3.5 py-2.5 text-sm text-labsa-charcoal placeholder:text-labsa-charcoal-light focus:bg-labsa-white focus:outline-none',
                    errors.streetAndBuilding
                      ? 'border-labsa-status-danger'
                      : 'border-labsa-cream focus:border-labsa-terracotta'
                  )}
                />
                {errors.streetAndBuilding && (
                  <p
                    id="err-checkout-street"
                    role="alert"
                    className="mt-1.5 text-xs font-bold text-labsa-status-danger"
                  >
                    {errors.streetAndBuilding}
                  </p>
                )}
              </div>

              {/* Optional Landmark & Delivery Note */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="checkout-landmark"
                    className="block text-xs font-bold text-labsa-charcoal"
                  >
                    {t('landmarkLabel')}
                  </label>
                  <input
                    id="checkout-landmark"
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder={t('landmarkPlaceholder')}
                    className="mt-1.5 min-h-[44px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3.5 py-2 text-sm text-labsa-charcoal placeholder:text-labsa-charcoal-light focus:border-labsa-terracotta focus:bg-labsa-white focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="checkout-note"
                    className="block text-xs font-bold text-labsa-charcoal"
                  >
                    {t('deliveryNoteLabel')}
                  </label>
                  <input
                    id="checkout-note"
                    type="text"
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    placeholder={t('deliveryNotePlaceholder')}
                    className="mt-1.5 min-h-[44px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3.5 py-2 text-sm text-labsa-charcoal placeholder:text-labsa-charcoal-light focus:border-labsa-terracotta focus:bg-labsa-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* =================================================================
              STEP 2: DEMO PAYMENT METHOD SELECTION
             ================================================================= */}
          <section className="rounded-3xl border border-labsa-cream bg-labsa-white p-6 shadow-craft sm:p-8">
            <div className="flex items-center gap-2.5 border-b border-dashed border-labsa-cream pb-4">
              <CreditCard
                className="h-5 w-5 text-labsa-terracotta"
                aria-hidden="true"
              />
              <h2 className="text-lg font-extrabold text-labsa-charcoal">
                {t('step2Title')}
              </h2>
            </div>

            <fieldset className="mt-6 space-y-4">
              <legend className="sr-only">{t('step2Title')}</legend>

              {DEMO_PAYMENT_METHODS.map((method) => {
                const isSelected = paymentMethod === method.id;
                const initialStatusText = tStatuses(
                  `payment.${method.initialPaymentStatus}`
                );

                return (
                  <label
                    key={method.id}
                    htmlFor={`payment-${method.id}`}
                    className={cn(
                      'block cursor-pointer rounded-2xl border-2 p-4 transition sm:p-5',
                      isSelected
                        ? 'border-labsa-terracotta bg-labsa-terracotta-light/30 shadow-sm'
                        : 'border-labsa-cream bg-labsa-canvas hover:border-labsa-charcoal'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <input
                          id={`payment-${method.id}`}
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={isSelected}
                          onChange={() => setPaymentMethod(method.id)}
                          className="mt-1 h-4 w-4 accent-labsa-terracotta"
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-extrabold text-labsa-charcoal sm:text-base">
                              {getLocalizedText(method.title, locale)}
                            </span>
                            {isSelected && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-labsa-charcoal px-2.5 py-0.5 text-[11px] font-bold text-labsa-white">
                                <Check className="h-3 w-3" aria-hidden="true" />
                                <span>{t('paymentSelectedBadge')}</span>
                              </span>
                            )}
                          </div>

                          <p className="mt-1.5 text-xs leading-relaxed text-labsa-charcoal-muted">
                            {getLocalizedText(method.description, locale)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details when Selected */}
                    {isSelected && (
                      <div className="mt-4 space-y-2.5 border-t border-dashed border-labsa-cream pt-3.5 ps-7">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-bold text-labsa-charcoal">
                            {t('initialPaymentStateLabel')}
                          </span>
                          <span className="rounded-lg border border-labsa-olive/50 bg-labsa-white px-2.5 py-0.5 font-bold text-labsa-olive-dark">
                            {initialStatusText}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-labsa-charcoal">
                          {getLocalizedText(method.demoSafetyWarning, locale)}
                        </p>
                      </div>
                    )}
                  </label>
                );
              })}
            </fieldset>

            <p className="mt-4 text-xs leading-relaxed text-labsa-charcoal-muted">
              {t('noAutoVerificationNotice')}
            </p>
          </section>

          {/* =================================================================
              STEP 3: FINAL ADDRESS & PAYMENT REVIEW BEFORE SUBMISSION
             ================================================================= */}
          <section className="rounded-3xl border-2 border-dashed border-labsa-olive/60 bg-labsa-white p-6 shadow-craft sm:p-8">
            <div className="flex items-center gap-2.5 border-b border-dashed border-labsa-cream pb-3">
              <CheckCircle2
                className="h-5 w-5 text-labsa-olive-dark"
                aria-hidden="true"
              />
              <h2 className="text-base font-extrabold text-labsa-charcoal sm:text-lg">
                {t('step3Title')}
              </h2>
            </div>

            {fullName.trim() && selectedGov && cityOrArea.trim() && streetAndBuilding.trim() ? (
              <div className="mt-4 rounded-2xl border border-labsa-cream bg-labsa-canvas p-4 text-xs leading-relaxed text-labsa-charcoal">
                <p className="font-bold text-labsa-olive-dark">
                  {t('reviewAddressHeading')}
                </p>
                <p className="mt-1 font-bold">
                  {fullName} • <span className="font-mono">{mobileNumber}</span>
                </p>
                <p className="mt-0.5">
                  {getGovernorateDisplayName(selectedGov, locale)} — {cityOrArea} —{' '}
                  {streetAndBuilding}
                </p>
                {landmark.trim() && <p className="mt-0.5">{landmark}</p>}
              </div>
            ) : (
              <p className="mt-4 text-xs text-labsa-charcoal-muted">
                {t('reviewIncompleteHint')}
              </p>
            )}
          </section>
        </div>

        {/* Right / End Column: Order Items & Final EGP Breakdown */}
        <aside className="lg:col-span-5">
          <div className="sticky top-28 rounded-3xl border-2 border-dashed border-labsa-cream bg-labsa-white p-6 shadow-craft sm:p-7">
            <h2 className="text-lg font-extrabold text-labsa-charcoal">
              {t('summaryHeading')}
            </h2>

            {/* Itemized List */}
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-labsa-charcoal-muted">
                {t('itemsInOrderLabel', { count: totalQuantity })}
              </p>

              <ul className="mt-3 max-h-72 divide-y divide-dashed divide-labsa-cream overflow-y-auto pe-1">
                {itemHealthList.map(({ item, health }) => (
                  <li
                    key={item.variantId}
                    className="flex items-center justify-between gap-3 py-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imageUrl}
                        alt={getLocalizedText(item.title, locale)}
                        className="h-14 w-12 shrink-0 rounded-lg border border-labsa-cream object-cover"
                      />
                      <div>
                        <p className="font-bold text-labsa-charcoal">
                          {getLocalizedText(item.title, locale)}
                        </p>
                        <p className="mt-0.5 text-labsa-charcoal-muted">
                          {getLocalizedText(item.colorName, locale)} •{' '}
                          <span className="font-mono">{item.size}</span> ×{' '}
                          <strong className="font-mono">{item.quantity}</strong>
                        </p>
                      </div>
                    </div>

                    <span className="font-mono font-bold text-labsa-charcoal">
                      {formatEGP(
                        health.currentPriceEgp * item.quantity,
                        locale
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Discount Coupon Section */}
            <div className="mt-4">
              <CouponBoxSection />
            </div>

            {/* Subtotal, Coupon Discount, Governorate Delivery Fee & Grand Total */}
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
                <dt className="flex items-center gap-1.5 font-medium text-labsa-charcoal-muted">
                  <Truck
                    className="h-4 w-4 text-labsa-terracotta"
                    aria-hidden="true"
                  />
                  <span>
                    {t('shippingFeeLabel')}
                    {selectedGov
                      ? ` (${getGovernorateDisplayName(selectedGov, locale)})`
                      : ''}
                  </span>
                </dt>
                <dd className="font-bold text-labsa-olive-dark">
                  {deliveryFeeEgp !== null ? (
                    formatEGP(deliveryFeeEgp, locale)
                  ) : (
                    <span className="text-xs font-semibold text-labsa-status-warning">
                      {t('selectGovForShipping')}
                    </span>
                  )}
                </dd>
              </div>

              {selectedGov && (
                <div className="flex items-center justify-between text-xs text-labsa-charcoal-muted">
                  <dt>{t('estimatedDeliveryLabel')}</dt>
                  <dd className="font-semibold text-labsa-charcoal">
                    {getLocalizedText(selectedGov.estimatedDays, locale)}
                  </dd>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-labsa-cream pt-3 text-base">
                <dt className="font-extrabold text-labsa-charcoal">
                  {t('grandTotalLabel')}
                </dt>
                <dd className="text-2xl font-extrabold text-labsa-charcoal">
                  {formatEGP(grandTotalEgp, locale)}
                </dd>
              </div>
            </dl>

            <p className="mt-3 rounded-xl border border-labsa-cream bg-labsa-canvas p-3 text-[11px] leading-relaxed text-labsa-charcoal-muted">
              {t('immutableFeeNote')}
            </p>

            {/* Submit Simulated Demo Order Button */}
            <button
              type="submit"
              disabled={isSubmitting || cartHasBlockingIssues}
              className={cn(
                'mt-5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-base font-extrabold shadow-craft transition',
                isSubmitting || cartHasBlockingIssues
                  ? 'cursor-not-allowed bg-labsa-cream text-labsa-charcoal-muted'
                  : 'bg-labsa-terracotta text-labsa-white hover:bg-labsa-terracotta-dark'
              )}
            >
              <span>
                {isSubmitting
                  ? t('placingOrderLoading')
                  : `${t('placeOrderCta')} — ${formatEGP(
                      grandTotalEgp,
                      locale
                    )}`}
              </span>
              {!isSubmitting && (
                <ForwardArrow className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
}
