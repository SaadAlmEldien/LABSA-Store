'use client';

import React, { useState, useMemo } from 'react';
import { useLocale } from 'next-intl';
import {
  type ProductReview,
  type ReviewModerationStatus,
  adminModerateReview,
} from '@/data/reviews';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Lock,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Star,
  XCircle,
} from 'lucide-react';

interface AdminReviewsSectionProps {
  reviews: ProductReview[];
  onReviewsUpdated: () => void;
  authorizeAction: (actionType: string) => Promise<{
    authorized: boolean;
    actorIdentity?: string;
    serverTimestamp?: string;
  }>;
}

export function AdminReviewsSection({
  reviews,
  onReviewsUpdated,
  authorizeAction,
}: AdminReviewsSectionProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [statusFilter, setStatusFilter] = useState<'all' | ReviewModerationStatus>('all');
  const [privateNotesByReview, setPrivateNotesByReview] = useState<
    Record<string, string>
  >({});
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isModerating, setIsModerating] = useState<string | null>(null);

  const filteredReviews = useMemo(() => {
    if (statusFilter === 'all') return reviews;
    return reviews.filter((r) => r.status === statusFilter);
  }, [reviews, statusFilter]);

  async function handleModeration(
    review: ProductReview,
    newStatus: 'approved' | 'rejected'
  ) {
    setFeedbackMsg(null);
    setIsModerating(review.id);
    try {
      const auth = await authorizeAction(`review_${newStatus}`);
      if (!auth.authorized || !auth.actorIdentity) {
        return;
      }

      const note =
        privateNotesByReview[review.id] !== undefined
          ? privateNotesByReview[review.id]
          : review.privateModerationNote ?? '';

      try {
        await fetch('/api/admin/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reviewId: review.id,
            newStatus,
            privateNote: note,
          }),
        });
      } catch {
        // Fallback
      }

      adminModerateReview({
        reviewId: review.id,
        newStatus,
        privateModerationNote: note,
        actorIdentity: auth.actorIdentity,
        timestamp: auth.serverTimestamp ?? new Date().toISOString(),
      });

      setFeedbackMsg(
        isAr
          ? `تم تحديث حالة التقييم (${newStatus === 'approved' ? 'معتمد ومنشور' : 'مرفوض'}) بنجاح.`
          : `Review status updated to ${newStatus.toUpperCase()}.`
      );
      onReviewsUpdated();
    } finally {
      setIsModerating(null);
    }
  }

  const pendingCount = reviews.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-labsa-cream bg-labsa-white p-6 shadow-craft">
        <div>
          <h2 className="text-xl font-extrabold text-labsa-charcoal sm:text-2xl">
            {isAr
              ? 'مراجعة وتدقيق تقييمات المنتجات'
              : 'Product Reviews Moderation Queue'}
          </h2>
          <p className="mt-1 text-xs text-labsa-charcoal-muted sm:text-sm">
            {isAr
              ? 'التقييمات المرسلة من العملاء تُحفظ في حالة «بانتظار المراجعة» ولا تظهر في صفحات المنتجات إلا بعد اعتمادها هنا.'
              : 'Submitted customer reviews default to pending moderation and are only displayed on product pages after approval.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={cn(
                'min-h-[38px] rounded-xl px-3.5 py-2 text-xs font-extrabold transition',
                statusFilter === st
                  ? 'bg-labsa-charcoal text-labsa-white'
                  : 'border border-labsa-cream bg-labsa-canvas text-labsa-charcoal'
              )}
            >
              {st === 'all'
                ? isAr
                  ? `الكل (${reviews.length})`
                  : `All (${reviews.length})`
                : st === 'pending'
                  ? isAr
                    ? `بانتظار المراجعة (${pendingCount})`
                    : `Pending (${pendingCount})`
                  : st === 'approved'
                    ? isAr
                      ? 'المعتمدة'
                      : 'Approved'
                    : isAr
                      ? 'المرفوضة'
                      : 'Rejected'}
            </button>
          ))}
        </div>
      </div>

      {feedbackMsg && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-2xl border border-labsa-status-success/40 bg-labsa-status-success/10 p-4 text-xs font-extrabold text-labsa-status-success"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {filteredReviews.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-labsa-cream bg-labsa-white p-10 text-center text-sm font-bold text-labsa-charcoal-muted">
          {isAr
            ? 'لا توجد تقييمات مطابقة لهذا الفلتر.'
            : 'No reviews match this moderation filter.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((rev) => (
            <article
              key={rev.id}
              className="rounded-3xl border border-labsa-cream bg-labsa-white p-5 shadow-craft"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-dashed border-labsa-cream pb-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-labsa-terracotta-light/50 px-2.5 py-0.5 font-mono text-xs font-extrabold text-labsa-terracotta-dark">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span>{rev.rating} / 5</span>
                    </span>

                    <span className="font-mono text-xs font-bold text-labsa-charcoal-muted">
                      {rev.productSlug}
                    </span>

                    {rev.isVerifiedDeliveredPurchase && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-labsa-status-success/15 px-2.5 py-0.5 text-[11px] font-bold text-labsa-status-success">
                        <ShieldCheck className="h-3 w-3" />
                        <span>
                          {isAr
                            ? 'شراء مُوثّق ومُسلّم'
                            : 'Verified Delivered Purchase'}
                        </span>
                      </span>
                    )}

                    {rev.isDemoSample && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-labsa-olive-light px-2.5 py-0.5 text-[11px] font-bold text-labsa-olive-dark">
                        <Sparkles className="h-3 w-3" />
                        <span>
                          {isAr ? 'تقييم تجريبي للعرض' : 'Demo Sample Review'}
                        </span>
                      </span>
                    )}
                  </div>

                  <h3 className="mt-2 text-base font-extrabold text-labsa-charcoal">
                    {rev.title}
                  </h3>
                </div>

                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-extrabold',
                    rev.status === 'approved'
                      ? 'bg-labsa-status-success/15 text-labsa-status-success'
                      : rev.status === 'pending'
                        ? 'bg-labsa-terracotta-light text-labsa-terracotta-dark'
                        : 'bg-labsa-status-danger/15 text-labsa-status-danger'
                  )}
                >
                  {rev.status.toUpperCase()}
                </span>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-labsa-charcoal sm:text-sm">
                {rev.comment}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-labsa-charcoal-muted">
                <span>
                  <MessageSquare className="me-1 inline h-3.5 w-3.5" />
                  <strong>{rev.reviewerName}</strong>
                </span>
                {rev.orderNumberReference && (
                  <span className="font-mono">
                    {isAr ? 'مرجع الطلب:' : 'Order Ref:'}{' '}
                    <strong>{rev.orderNumberReference}</strong>
                  </span>
                )}
                <span className="font-mono">
                  {new Date(rev.createdAt).toLocaleString(
                    isAr ? 'ar-EG' : 'en-EG'
                  )}
                </span>
              </div>

              {/* Private Admin Moderation Note + Approve/Reject Actions */}
              <div className="mt-4 rounded-2xl border border-dashed border-labsa-terracotta/50 bg-labsa-canvas p-4">
                <label className="flex items-center gap-1.5 text-xs font-bold text-labsa-terracotta-dark">
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {isAr
                      ? 'ملاحظة إشراف داخلية خاصة (لا تظهر للعملاء أبداً)'
                      : 'Private Admin Moderation Note (Never shown publicly)'}
                  </span>
                </label>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    value={
                      privateNotesByReview[rev.id] !== undefined
                        ? privateNotesByReview[rev.id]
                        : rev.privateModerationNote ?? ''
                    }
                    onChange={(e) =>
                      setPrivateNotesByReview((prev) => ({
                        ...prev,
                        [rev.id]: e.target.value,
                      }))
                    }
                    placeholder={
                      isAr
                        ? 'سبب القبول أو الرفض لسجل المراجعة الداخلي...'
                        : 'Internal moderation reason for audit log...'
                    }
                    className="min-h-[38px] flex-1 rounded-xl border border-labsa-cream bg-labsa-white px-3 py-1.5 text-xs text-labsa-charcoal"
                  />

                  <button
                    type="button"
                    disabled={isModerating === rev.id}
                    onClick={() => handleModeration(rev, 'approved')}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-labsa-olive-dark px-4 py-2 text-xs font-extrabold text-labsa-white transition hover:bg-labsa-charcoal disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{isAr ? 'اعتماد ونشر' : 'Approve & Publish'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isModerating === rev.id}
                    onClick={() => handleModeration(rev, 'rejected')}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-labsa-status-danger px-4 py-2 text-xs font-extrabold text-labsa-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{isAr ? 'رفض وإخفاء' : 'Reject & Hide'}</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
