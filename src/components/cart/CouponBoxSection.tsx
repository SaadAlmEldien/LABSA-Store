'use client';

import React, { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { getLocalizedText } from '@/data/catalog';
import type { CouponFailureReason } from '@/data/coupons';
import { useCart } from '@/context/CartContext';
import { formatEGP } from '@/lib/utils';
import {
  AlertCircle,
  CheckCircle2,
  Tag,
  X,
} from 'lucide-react';

export function CouponBoxSection() {
  const locale = useLocale();
  const t = useTranslations('Coupons');
  const {
    appliedCouponCode,
    couponValidation,
    discountEgp,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [codeInput, setCodeInput] = useState(appliedCouponCode ?? '');
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  function formatFailureMessage(
    reason: CouponFailureReason,
    minSubtotal?: number
  ): string {
    switch (reason) {
      case 'empty_code':
        return t('errorEmpty');
      case 'not_found':
        return t('errorNotFound');
      case 'inactive':
        return t('errorInactive');
      case 'not_started':
        return t('errorNotStarted');
      case 'expired':
        return t('errorExpired');
      case 'usage_limit_reached':
        return t('errorExhausted');
      case 'min_subtotal_not_met':
        return t('errorMinSubtotal', {
          min: formatEGP(minSubtotal ?? 0, locale),
        });
      default:
        return t('errorNotFound');
    }
  }

  function handleApply(raw: string) {
    setFeedbackError(null);
    const res = applyCoupon(raw);
    if (!res.valid) {
      setFeedbackError(
        formatFailureMessage(res.reason, res.requiredMinSubtotalEgp)
      );
    } else {
      setCodeInput(res.coupon.code);
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleApply(codeInput);
  }

  return (
    <div className="rounded-2xl border border-labsa-cream bg-labsa-canvas p-4 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-extrabold text-labsa-charcoal">
          <Tag className="h-4 w-4 text-labsa-terracotta" aria-hidden="true" />
          <span>{t('boxHeading')}</span>
        </span>
        <span className="text-[11px] font-semibold text-labsa-charcoal-muted">
          {t('onePerOrderRule')}
        </span>
      </div>

      {/* Applied Valid Coupon Card */}
      {couponValidation && couponValidation.valid ? (
        <div className="mt-3 rounded-xl border border-labsa-status-success/40 bg-labsa-white p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 font-mono text-xs font-extrabold text-labsa-status-success">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{couponValidation.coupon.code}</span>
              </div>
              <p className="mt-1 font-bold text-labsa-charcoal">
                {getLocalizedText(couponValidation.coupon.title, locale)}
              </p>
              <p className="mt-0.5 text-[11px] text-labsa-charcoal-muted">
                {t('discountAppliedNote', {
                  amount: formatEGP(discountEgp, locale),
                })}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                removeCoupon();
                setCodeInput('');
                setFeedbackError(null);
              }}
              aria-label={t('removeCouponBtn')}
              className="inline-flex items-center gap-1 rounded-lg border border-labsa-cream bg-labsa-canvas px-2.5 py-1 text-[11px] font-bold text-labsa-charcoal transition hover:border-labsa-status-danger hover:text-labsa-status-danger"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t('removeCouponBtn')}</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* If a previously applied coupon is now invalid (e.g. cart subtotal dropped below minSubtotalEgp) */}
          {appliedCouponCode && couponValidation && !couponValidation.valid && (
            <div
              role="alert"
              className="mt-2.5 flex items-center justify-between gap-2 rounded-xl border border-labsa-status-warning/50 bg-labsa-status-warning/10 p-2.5 text-[11px] font-bold text-labsa-charcoal"
            >
              <span>
                {formatFailureMessage(
                  couponValidation.reason,
                  couponValidation.requiredMinSubtotalEgp
                )}
              </span>
              <button
                type="button"
                onClick={removeCoupon}
                className="underline"
              >
                {t('removeCouponBtn')}
              </button>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="mt-2.5 flex gap-2">
            <input
              type="text"
              dir="ltr"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder={t('codePlaceholder')}
              aria-label={t('codePlaceholder')}
              className="min-h-[38px] flex-1 rounded-xl border border-labsa-cream bg-labsa-white px-3 py-1.5 font-mono text-xs font-bold uppercase text-labsa-charcoal placeholder:font-sans placeholder:font-normal placeholder:normal-case focus:border-labsa-terracotta focus:outline-none"
            />
            <button
              type="submit"
              className="min-h-[38px] rounded-xl bg-labsa-charcoal px-4 py-1.5 font-extrabold text-labsa-white transition hover:bg-labsa-terracotta"
            >
              {t('applyBtn')}
            </button>
          </form>

          {feedbackError && (
            <div
              role="alert"
              className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-labsa-status-danger"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{feedbackError}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
