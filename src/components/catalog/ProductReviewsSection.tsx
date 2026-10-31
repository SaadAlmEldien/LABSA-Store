'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  type ProductRatingSummary,
  type PublicProductReview,
  getApprovedReviewsForProduct,
  getProductRatingSummary,
  submitCustomerReview,
} from '@/data/reviews';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  CheckCircle2,
  MessageSquarePlus,
  ShieldCheck,
  Star,
} from 'lucide-react';

interface ProductReviewsSectionProps {
  productId: string;
  productSlug: string;
}

export function ProductReviewsSection({
  productId,
  productSlug,
}: ProductReviewsSectionProps) {
  const locale = useLocale();
  const t = useTranslations('Reviews');

  const [approvedReviews, setApprovedReviews] = useState<PublicProductReview[]>(
    []
  );
  const [summary, setSummary] = useState<ProductRatingSummary | null>(null);

  // Review Form State
  const [rating, setRating] = useState<number>(5);
  const [reviewerName, setReviewerName] = useState('');
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedNotice, setSubmittedNotice] = useState<{
    verifiedGranted: boolean;
  } | null>(null);

  const loadReviews = useCallback(() => {
    setApprovedReviews(getApprovedReviewsForProduct(productId));
    setSummary(getProductRatingSummary(productId));
  }, [productId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSubmittedNotice(null);

    const res = submitCustomerReview({
      productId,
      productSlug,
      rating,
      title,
      comment,
      reviewerName,
      orderNumber: orderNumber.trim() || undefined,
      customerMobile: customerMobile.trim() || undefined,
    });

    if (!res.ok) {
      if (res.errorCode === 'missing_fields') {
        setErrorMsg(t('errorMissingFields'));
      } else if (res.errorCode === 'comment_too_short') {
        setErrorMsg(t('errorCommentTooShort'));
      } else if (res.errorCode === 'duplicate_submission') {
        setErrorMsg(t('errorDuplicate'));
      } else {
        setErrorMsg(t('errorMissingFields'));
      }
      return;
    }

    setSubmittedNotice({
      verifiedGranted: res.verifiedPurchaseGranted,
    });
    setTitle('');
    setComment('');
    loadReviews();
  }

  return (
    <section
      aria-labelledby="pdp-reviews-heading"
      className="mt-14 border-t-2 border-dashed border-labsa-cream pt-10"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2
            id="pdp-reviews-heading"
            className="text-xl font-extrabold text-labsa-charcoal sm:text-2xl"
          >
            {t('sectionHeading')}
          </h2>
          <p className="mt-1 text-xs text-labsa-charcoal-muted sm:text-sm">
            {t('sectionSubtitle')}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left/Start Column: Rating Summary + Approved Reviews List */}
        <div className="space-y-6 lg:col-span-7">
          {/* Show Average Rating & Star Distribution ONLY when approved reviews exist */}
          {summary && summary.totalApprovedCount > 0 ? (
            <div className="rounded-3xl border border-labsa-cream bg-labsa-white p-6 shadow-craft">
              <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2">
                <div className="text-center sm:text-start">
                  <div className="flex items-baseline justify-center gap-2 sm:justify-start">
                    <span className="font-mono text-4xl font-extrabold text-labsa-charcoal">
                      {summary.averageRating}
                    </span>
                    <span className="text-sm font-bold text-labsa-charcoal-muted">
                      / 5
                    </span>
                  </div>
                  <div
                    className="mt-2 flex items-center justify-center gap-1 sm:justify-start"
                    aria-label={t('averageAria', {
                      rating: summary.averageRating,
                      count: summary.totalApprovedCount,
                    })}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          'h-4 w-4',
                          star <= Math.round(summary.averageRating)
                            ? 'fill-labsa-terracotta text-labsa-terracotta'
                            : 'text-labsa-cream'
                        )}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs font-bold text-labsa-charcoal-muted">
                    {t('basedOnApprovedCount', {
                      count: summary.totalApprovedCount,
                    })}
                  </p>
                </div>

                {/* Star Distribution Bars */}
                <div className="space-y-1.5 text-xs">
                  {([5, 4, 3, 2, 1] as const).map((starLevel) => {
                    const count = summary.distribution[starLevel] ?? 0;
                    const pct =
                      summary.totalApprovedCount > 0
                        ? Math.round((count / summary.totalApprovedCount) * 100)
                        : 0;
                    return (
                      <div key={starLevel} className="flex items-center gap-2">
                        <span className="w-8 font-mono font-bold text-labsa-charcoal">
                          {starLevel} ★
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-labsa-canvas">
                          <div
                            className="h-full rounded-full bg-labsa-terracotta transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-6 text-end font-mono text-[11px] text-labsa-charcoal-muted">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border-2 border-dashed border-labsa-cream bg-labsa-white p-6 text-center text-xs font-bold text-labsa-charcoal-muted">
              {t('noApprovedReviewsYet')}
            </div>
          )}

          {/* Approved Reviews Feed */}
          {approvedReviews.length > 0 && (
            <div className="space-y-4">
              {approvedReviews.map((rev) => (
                <article
                  key={rev.id}
                  className="rounded-3xl border border-labsa-cream bg-labsa-white p-5 shadow-craft"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn(
                            'h-3.5 w-3.5',
                            s <= rev.rating
                              ? 'fill-labsa-terracotta text-labsa-terracotta'
                              : 'text-labsa-cream'
                          )}
                          aria-hidden="true"
                        />
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {rev.isVerifiedDeliveredPurchase && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-labsa-status-success/15 px-2.5 py-0.5 text-[11px] font-bold text-labsa-status-success">
                          <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                          <span>{t('verifiedPurchaseBadge')}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="mt-2.5 text-sm font-extrabold text-labsa-charcoal">
                    {rev.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-labsa-charcoal">
                    {rev.comment}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-labsa-cream pt-2.5 text-[11px] text-labsa-charcoal-muted">
                    <span className="font-bold text-labsa-charcoal">
                      {rev.reviewerName}
                    </span>
                    <span className="font-mono">
                      {new Date(rev.createdAt).toLocaleDateString(
                        locale === 'ar' ? 'ar-EG' : 'en-EG',
                        { year: 'numeric', month: 'short', day: 'numeric' }
                      )}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Right/End Column: Submit a Review Form (Pending Moderation) */}
        <div className="lg:col-span-5">
          <div className="rounded-3xl border-2 border-dashed border-labsa-cream bg-labsa-white p-6 shadow-craft">
            <h3 className="flex items-center gap-2 text-base font-extrabold text-labsa-charcoal">
              <MessageSquarePlus
                className="h-5 w-5 text-labsa-terracotta"
                aria-hidden="true"
              />
              <span>{t('formHeading')}</span>
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-labsa-charcoal-muted">
              {t('moderationNotice')}
            </p>

            {submittedNotice && (
              <div
                role="status"
                className="mt-4 rounded-2xl border border-labsa-status-success/40 bg-labsa-status-success/10 p-4 text-xs text-labsa-status-success"
              >
                <div className="flex items-start gap-2 font-extrabold">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{t('submittedPendingTitle')}</span>
                </div>
                <p className="mt-1 text-labsa-charcoal">
                  {t('submittedPendingDesc')}
                </p>
                {submittedNotice.verifiedGranted && (
                  <p className="mt-1.5 font-bold text-labsa-status-success">
                    ✓ {t('verifiedPurchaseConfirmedNote')}
                  </p>
                )}
              </div>
            )}

            {errorMsg && (
              <div
                role="alert"
                className="mt-4 flex items-center gap-2 rounded-2xl border border-labsa-status-danger/40 bg-labsa-status-danger/10 p-3.5 text-xs font-extrabold text-labsa-status-danger"
              >
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form
              onSubmit={handleSubmitReview}
              noValidate
              className="mt-4 space-y-3.5 text-xs"
            >
              {/* Star Rating Picker */}
              <div>
                <span className="block font-bold text-labsa-charcoal">
                  {t('ratingLabel')}
                </span>
                <div className="mt-1.5 flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setRating(starVal)}
                      aria-pressed={rating === starVal}
                      aria-label={`${starVal} / 5`}
                      className={cn(
                        'inline-flex h-10 w-10 items-center justify-center rounded-xl border transition',
                        starVal <= rating
                          ? 'border-labsa-terracotta bg-labsa-terracotta-light/50 text-labsa-terracotta-dark'
                          : 'border-labsa-cream bg-labsa-canvas text-labsa-charcoal-muted'
                      )}
                    >
                      <Star
                        className={cn(
                          'h-4 w-4',
                          starVal <= rating && 'fill-labsa-terracotta'
                        )}
                        aria-hidden="true"
                      />
                    </button>
                  ))}
                  <span className="ms-2 font-mono font-bold text-labsa-charcoal">
                    {rating} / 5
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="rev-name"
                  className="block font-bold text-labsa-charcoal"
                >
                  {t('nameLabel')}
                </label>
                <input
                  id="rev-name"
                  type="text"
                  required
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder={t('namePlaceholder')}
                  className="mt-1 min-h-[40px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 text-labsa-charcoal focus:border-labsa-terracotta focus:bg-labsa-white focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="rev-title"
                  className="block font-bold text-labsa-charcoal"
                >
                  {t('titleLabel')}
                </label>
                <input
                  id="rev-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('titlePlaceholder')}
                  className="mt-1 min-h-[40px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 text-labsa-charcoal focus:border-labsa-terracotta focus:bg-labsa-white focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="rev-comment"
                  className="block font-bold text-labsa-charcoal"
                >
                  {t('commentLabel')}
                </label>
                <textarea
                  id="rev-comment"
                  rows={3}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t('commentPlaceholder')}
                  className="mt-1 w-full rounded-xl border border-labsa-cream bg-labsa-canvas p-3 text-labsa-charcoal focus:border-labsa-terracotta focus:bg-labsa-white focus:outline-none"
                />
              </div>

              {/* Optional Order Verification Fields for Verified Purchase Badge */}
              <div className="rounded-2xl border border-labsa-cream bg-labsa-canvas p-3">
                <p className="font-bold text-labsa-charcoal">
                  {t('verifiedOptionalTitle')}
                </p>
                <p className="mt-0.5 text-[11px] text-labsa-charcoal-muted">
                  {t('verifiedOptionalDesc')}
                </p>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    dir="ltr"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="LAB-2026-XXXX"
                    aria-label={t('orderRefLabel')}
                    className="min-h-[36px] rounded-lg border border-labsa-cream bg-labsa-white px-2.5 py-1 font-mono text-labsa-charcoal"
                  />
                  <input
                    type="tel"
                    dir="ltr"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    placeholder="01000000001"
                    aria-label={t('mobileLabel')}
                    className="min-h-[36px] rounded-lg border border-labsa-cream bg-labsa-white px-2.5 py-1 font-mono text-labsa-charcoal"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-labsa-charcoal px-5 py-2.5 text-xs font-extrabold text-labsa-white shadow-craft transition hover:bg-labsa-terracotta"
              >
                <span>{t('submitButton')}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
