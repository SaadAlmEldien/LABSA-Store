import { lookupDemoOrderSafe } from '@/data/orders';

export type ReviewModerationStatus = 'pending' | 'approved' | 'rejected';

export interface ProductReview {
  id: string;
  productId: string;
  productSlug: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  comment: string;
  reviewerName: string;
  /** Optional order reference provided at submission for verified-purchase check & duplicate prevention */
  orderNumberReference?: string;
  /**
   * True ONLY when the data layer confirms that the matching order (verified via Order Ref + Mobile)
   * contains this product AND is delivered/completed. Never set on demo sample reviews.
   */
  isVerifiedDeliveredPurchase: boolean;
  /**
   * True for pre-seeded sample reviews; visibly badged as "Demo Sample Review" and never "Verified Purchase".
   */
  isDemoSample: boolean;
  status: ReviewModerationStatus;
  createdAt: string;
  moderatedAt?: string;
  /** Admin-only field; stripped before public display */
  moderatedBy?: string;
  /** Private internal moderation note; NEVER exposed publicly */
  privateModerationNote?: string;
}

export interface PublicProductReview {
  id: string;
  productId: string;
  productSlug: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  comment: string;
  reviewerName: string;
  isVerifiedDeliveredPurchase: boolean;
  isDemoSample: boolean;
  createdAt: string;
}

export interface ProductRatingSummary {
  averageRating: number;
  totalApprovedCount: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export const REVIEWS_STORAGE_KEY = 'labsa_demo_reviews_v1';

/**
 * Seeded reviews are explicitly flagged with `isDemoSample: true` and `isVerifiedDeliveredPurchase: false`
 * so they are visibly labeled as "[تقييم تجريبي للعرض / Demo Sample Review]" and never pretend to be real verified customers.
 */
export const SEEDED_DEMO_REVIEWS: ProductReview[] = [
  {
    id: 'rev-demo-01',
    productId: 'prod-men-01',
    productSlug: 'olive-topstitched-chino-trousers',
    rating: 5,
    title: 'قماش تويل متين وتفاصيل خياطة واضحة (مثال تقييم تجريبي)',
    comment:
      'نموذج تقييم تجريبي لعرض واجهة التقييمات: القصة المريحة والغرز البارزة على الجيوب تعكس هوية لَبسة الحرفية.',
    reviewerName: 'مراجع تجريبي (Demo Sample Reviewer)',
    isVerifiedDeliveredPurchase: false,
    isDemoSample: true,
    status: 'approved',
    createdAt: '2026-10-20T14:00:00Z',
  },
  {
    id: 'rev-demo-02',
    productId: 'prod-men-01',
    productSlug: 'olive-topstitched-chino-trousers',
    rating: 4,
    title: 'Comfortable everyday fit (Demo Sample Review)',
    comment:
      'Fictional portfolio sample review: Great olive shade and sturdy cotton twill weight for Cairo autumn weather.',
    reviewerName: 'Portfolio Demo Sample',
    isVerifiedDeliveredPurchase: false,
    isDemoSample: true,
    status: 'approved',
    createdAt: '2026-10-22T09:30:00Z',
  },
  {
    id: 'rev-demo-03',
    productId: 'prod-kids-01',
    productSlug: 'kids-terracotta-canvas-overalls',
    rating: 5,
    title: 'سالوبيت عملي جداً للأطفال (مثال تقييم تجريبي)',
    comment:
      'نموذج تقييم تجريبي: الحمالات القابلة للتعديل ولون التيراكوتا الدافئ مطابقان تماماً لتصميم شعار لَبسة.',
    reviewerName: 'مراجع تجريبي (Demo Sample Reviewer)',
    isVerifiedDeliveredPurchase: false,
    isDemoSample: true,
    status: 'approved',
    createdAt: '2026-10-23T16:15:00Z',
  },
  {
    id: 'rev-demo-04',
    productId: 'prod-men-03',
    productSlug: 'olive-terracotta-heavyweight-hoodie',
    rating: 5,
    title: 'خامة قطنية ثقيلة وغرز متقنة (مثال تقييم تجريبي)',
    comment:
      'نموذج تقييم تجريبي: الهودي مريح ودافي جداً وتفاصيل الخياطة المزدوجة بالتيراكوتا تعكس الحرفية العالية.',
    reviewerName: 'مراجع تجريبي (Demo Sample Reviewer)',
    isVerifiedDeliveredPurchase: false,
    isDemoSample: true,
    status: 'approved',
    createdAt: '2026-10-24T11:20:00Z',
  },
  {
    id: 'rev-demo-05',
    productId: 'prod-kids-02',
    productSlug: 'kids-cordless-fleece-hoodie',
    rating: 5,
    title: 'Safe cordless design for kids (Demo Sample Review)',
    comment:
      'Portfolio demo review: The cordless neck design is safe for active children, and the combed fleece holds shape wash after wash.',
    reviewerName: 'Portfolio Demo Sample',
    isVerifiedDeliveredPurchase: false,
    isDemoSample: true,
    status: 'approved',
    createdAt: '2026-10-25T15:45:00Z',
  },
  {
    id: 'rev-demo-pending-06',
    productId: 'prod-men-02',
    productSlug: 'charcoal-tailored-casual-blazer',
    rating: 5,
    title: 'بليزر كاجوال أنيق ومريح (بانتظار مراجعة الإدارة)',
    comment:
      'تقييم تجريبي في حالة «بانتظار المراجعة» لتجربة طابور الموافقة أو الرفض في لوحة تحكم المشرف.',
    reviewerName: 'عميل تجريبي (Demo Pending Sample)',
    isVerifiedDeliveredPurchase: false,
    isDemoSample: true,
    status: 'pending',
    createdAt: '2026-10-27T19:00:00Z',
  },
];

export function readAllDemoReviews(): ProductReview[] {
  if (typeof window === 'undefined') return SEEDED_DEMO_REVIEWS;
  try {
    const raw = window.localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(
        REVIEWS_STORAGE_KEY,
        JSON.stringify(SEEDED_DEMO_REVIEWS)
      );
      return SEEDED_DEMO_REVIEWS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as ProductReview[];
    }
    return SEEDED_DEMO_REVIEWS;
  } catch {
    return SEEDED_DEMO_REVIEWS;
  }
}

export function writeAllDemoReviews(reviews: ProductReview[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
    window.dispatchEvent(new CustomEvent('labsa:reviews-updated'));
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns ONLY approved reviews for a product, stripping private admin moderation notes.
 */
export function getApprovedReviewsForProduct(
  productId: string
): PublicProductReview[] {
  return readAllDemoReviews()
    .filter((r) => r.productId === productId && r.status === 'approved')
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .map(
      ({
        moderatedBy: _modBy,
        privateModerationNote: _privNote,
        orderNumberReference: _ordRef,
        status: _status,
        moderatedAt: _modAt,
        ...pub
      }) => pub
    );
}

/**
 * Computes average rating and star distribution strictly from approved reviews.
 * Returns null if no approved reviews exist for the product.
 */
export function getProductRatingSummary(
  productId: string
): ProductRatingSummary | null {
  const approved = getApprovedReviewsForProduct(productId);
  if (approved.length === 0) {
    return null;
  }

  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  let sum = 0;
  for (const rev of approved) {
    sum += rev.rating;
    distribution[rev.rating] = (distribution[rev.rating] ?? 0) + 1;
  }

  return {
    averageRating: Number((sum / approved.length).toFixed(1)),
    totalApprovedCount: approved.length,
    distribution,
  };
}

/**
 * Stable server/initial-hydration rating summary computed strictly from SEEDED_DEMO_REVIEWS.
 * Guarantees 100% identical data snapshot between SSR and initial client hydration,
 * avoiding hydration mismatches from client-only localStorage reviews.
 */
export function getStaticProductRatingSummary(
  productId: string
): ProductRatingSummary | null {
  const approved = SEEDED_DEMO_REVIEWS.filter(
    (r) => r.productId === productId && r.status === 'approved'
  );
  if (approved.length === 0) {
    return null;
  }

  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  let sum = 0;
  for (const rev of approved) {
    sum += rev.rating;
    distribution[rev.rating] = (distribution[rev.rating] ?? 0) + 1;
  }

  return {
    averageRating: Number((sum / approved.length).toFixed(1)),
    totalApprovedCount: approved.length,
    distribution,
  };
}

export interface SubmitReviewInput {
  productId: string;
  productSlug: string;
  rating: number;
  title: string;
  comment: string;
  reviewerName: string;
  /** Optional Order Reference + Mobile to verify delivered purchase */
  orderNumber?: string;
  customerMobile?: string;
}

export type SubmitReviewResult =
  | {
      ok: true;
      review: ProductReview;
      verifiedPurchaseGranted: boolean;
    }
  | {
      ok: false;
      errorCode:
        | 'invalid_rating'
        | 'missing_fields'
        | 'comment_too_short'
        | 'duplicate_submission'
        | 'storage_error';
    };

/**
 * Saves a newly submitted review strictly as `pending` moderation.
 * Grants `isVerifiedDeliveredPurchase` ONLY when `lookupDemoOrderSafe` confirms
 * a matching delivered/completed order containing this `productId`.
 */
export function submitCustomerReview(
  input: SubmitReviewInput
): SubmitReviewResult {
  const roundedRating = Math.round(input.rating);
  if (roundedRating < 1 || roundedRating > 5) {
    return { ok: false, errorCode: 'invalid_rating' };
  }

  const cleanName = input.reviewerName.trim();
  const cleanTitle = input.title.trim();
  const cleanComment = input.comment.trim();

  if (!cleanName || !cleanTitle || !cleanComment) {
    return { ok: false, errorCode: 'missing_fields' };
  }

  if (cleanComment.length < 12) {
    return { ok: false, errorCode: 'comment_too_short' };
  }

  const allReviews = readAllDemoReviews();
  const cleanOrderRef = input.orderNumber?.trim().toUpperCase() || undefined;

  // Prevent duplicate submission for the same (productId, orderNumberReference) or same (productId, reviewerName)
  const isDuplicate = allReviews.some((existing) => {
    if (existing.productId !== input.productId) return false;
    if (
      cleanOrderRef &&
      existing.orderNumberReference &&
      existing.orderNumberReference.toUpperCase() === cleanOrderRef
    ) {
      return true;
    }
    return (
      existing.reviewerName.toLowerCase() === cleanName.toLowerCase() &&
      existing.title.toLowerCase() === cleanTitle.toLowerCase()
    );
  });

  if (isDuplicate) {
    return { ok: false, errorCode: 'duplicate_submission' };
  }

  // Verify delivered purchase ONLY via authoritative order + phone lookup
  let isVerifiedDeliveredPurchase = false;
  if (cleanOrderRef && input.customerMobile?.trim()) {
    const matchedOrder = lookupDemoOrderSafe(
      cleanOrderRef,
      input.customerMobile.trim()
    );
    if (matchedOrder) {
      const hasProduct = matchedOrder.items.some(
        (item) => item.productId === input.productId
      );
      const isDelivered =
        matchedOrder.shipmentStatus === 'delivered' ||
        matchedOrder.orderStatus === 'completed';
      if (hasProduct && isDelivered) {
        isVerifiedDeliveredPurchase = true;
      }
    }
  }

  const newReview: ProductReview = {
    id: `rev-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
    productId: input.productId,
    productSlug: input.productSlug,
    rating: roundedRating as 1 | 2 | 3 | 4 | 5,
    title: cleanTitle.slice(0, 120),
    comment: cleanComment.slice(0, 1000),
    reviewerName: cleanName.slice(0, 60),
    orderNumberReference: cleanOrderRef,
    isVerifiedDeliveredPurchase,
    isDemoSample: false,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  if (!writeAllDemoReviews([newReview, ...allReviews])) {
    return { ok: false, errorCode: 'storage_error' };
  }

  return {
    ok: true,
    review: newReview,
    verifiedPurchaseGranted: isVerifiedDeliveredPurchase,
  };
}

export function adminModerateReview(params: {
  reviewId: string;
  newStatus: 'approved' | 'rejected';
  privateModerationNote?: string;
  actorIdentity: string;
  timestamp: string;
}): boolean {
  const all = readAllDemoReviews();
  const idx = all.findIndex((r) => r.id === params.reviewId);
  if (idx === -1) return false;

  const next = [...all];
  next[idx] = {
    ...next[idx],
    status: params.newStatus,
    moderatedAt: params.timestamp,
    moderatedBy: params.actorIdentity,
    privateModerationNote: params.privateModerationNote?.trim() || undefined,
  };

  return writeAllDemoReviews(next);
}
