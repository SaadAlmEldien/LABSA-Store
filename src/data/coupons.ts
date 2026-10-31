import type { LocalizedText } from '@/data/catalog';

export type CouponDiscountType = 'fixed_egp' | 'percentage';

export type CouponStatus = 'active' | 'inactive' | 'archived';

export interface DemoCoupon {
  id: string;
  /** Uppercase normalized code (e.g., LABSA10, CRAFT100) */
  code: string;
  title: LocalizedText;
  description: LocalizedText;
  discountType: CouponDiscountType;
  /** Either fixed EGP amount or percentage (1..100) */
  discountValue: number;
  /** Minimum eligible product subtotal in EGP */
  minSubtotalEgp: number;
  /** Optional maximum EGP discount cap for percentage coupons */
  maxDiscountEgp?: number;
  /** Optional ISO start date */
  startsAt?: string;
  /** Optional ISO expiry date */
  expiresAt?: string;
  /**
   * Optional demo usage limit (enforced in current browser session in local demo mode,
   * and relationally in PostgreSQL when connected to Supabase).
   */
  maxTotalUsesDemo?: number;
  usedCountDemo: number;
  status: CouponStatus;
  createdAt: string;
}

export const COUPONS_STORAGE_KEY = 'labsa_demo_coupons_v1';

/**
 * Visible, non-secret sample coupons for portfolio demonstration.
 */
export const SEEDED_DEMO_COUPONS: DemoCoupon[] = [
  {
    id: 'cpn-labsa10',
    code: 'LABSA10',
    title: {
      ar: 'خصم 10% ترحيبي على المنتجات',
      en: '10% Welcome Product Discount',
    },
    description: {
      ar: 'خصم 10% على إجمالي المنتجات للطلبات بقيمة 600 ج.م أو أكثر (بحد أقصى 200 ج.م خصم — لا يشمل رسوم الشحن).',
      en: '10% off eligible product subtotal on orders of EGP 600+ (capped at EGP 200; delivery fees excluded).',
    },
    discountType: 'percentage',
    discountValue: 10,
    minSubtotalEgp: 600,
    maxDiscountEgp: 200,
    startsAt: '2026-01-01T00:00:00Z',
    expiresAt: '2027-12-31T23:59:59Z',
    maxTotalUsesDemo: 50,
    usedCountDemo: 2,
    status: 'active',
    createdAt: '2026-10-01T10:00:00Z',
  },
  {
    id: 'cpn-craft100',
    code: 'CRAFT100',
    title: {
      ar: 'خصم ثابت 100 ج.م للطلبات فوق 1,000 ج.م',
      en: 'EGP 100 Fixed Discount on Orders Over EGP 1,000',
    },
    description: {
      ar: 'خصم مباشر 100 ج.م على إجمالي المنتجات عند التسوق بقيمة 1,000 ج.م أو أكثر.',
      en: 'Flat EGP 100 off product subtotal when your cart subtotal reaches EGP 1,000 or more.',
    },
    discountType: 'fixed_egp',
    discountValue: 100,
    minSubtotalEgp: 1000,
    startsAt: '2026-01-01T00:00:00Z',
    expiresAt: '2027-12-31T23:59:59Z',
    maxTotalUsesDemo: 25,
    usedCountDemo: 1,
    status: 'active',
    createdAt: '2026-10-05T12:00:00Z',
  },
  {
    id: 'cpn-expired-demo',
    code: 'WINTER2025',
    title: {
      ar: 'كوبون موسم شتاء 2025 (منتهي الصلاحية للاختبار)',
      en: 'Winter 2025 Seasonal Coupon (Expired Demo Sample)',
    },
    description: {
      ar: 'مثال لكوبون منتهي الصلاحية لاختبار رسائل التحقق في سلة التسوق.',
      en: 'Sample expired coupon to demonstrate localized expiry validation in cart and checkout.',
    },
    discountType: 'percentage',
    discountValue: 15,
    minSubtotalEgp: 500,
    maxDiscountEgp: 150,
    startsAt: '2025-01-01T00:00:00Z',
    expiresAt: '2025-03-31T23:59:59Z',
    usedCountDemo: 10,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
  },
];

export function normalizeCouponCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

export function readAllDemoCoupons(): DemoCoupon[] {
  if (typeof window === 'undefined') return SEEDED_DEMO_COUPONS;
  try {
    const raw = window.localStorage.getItem(COUPONS_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(
        COUPONS_STORAGE_KEY,
        JSON.stringify(SEEDED_DEMO_COUPONS)
      );
      return SEEDED_DEMO_COUPONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as DemoCoupon[];
    }
    return SEEDED_DEMO_COUPONS;
  } catch {
    return SEEDED_DEMO_COUPONS;
  }
}

export function writeAllDemoCoupons(coupons: DemoCoupon[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(coupons));
    return true;
  } catch {
    return false;
  }
}

export type CouponFailureReason =
  | 'empty_code'
  | 'not_found'
  | 'inactive'
  | 'not_started'
  | 'expired'
  | 'usage_limit_reached'
  | 'min_subtotal_not_met';

export type CouponValidationResult =
  | {
      valid: true;
      coupon: {
        id: string;
        code: string;
        title: LocalizedText;
        description: LocalizedText;
        discountType: CouponDiscountType;
        discountValue: number;
        minSubtotalEgp: number;
        maxDiscountEgp?: number;
      };
      discountEgp: number;
      discountedSubtotalEgp: number;
    }
  | {
      valid: false;
      reason: CouponFailureReason;
      requiredMinSubtotalEgp?: number;
    };

/**
 * Authoritative coupon validation & calculation rule:
 * - Applies at most 1 coupon per order.
 * - Never discounts delivery fees.
 * - Never allows discountEgp to exceed eligible product subtotalEgp.
 * - Strips private admin status/archive internals from public return payload.
 */
export function validateAndCalculateCoupon(
  rawCode: string,
  subtotalEgp: number,
  nowDate: Date = new Date()
): CouponValidationResult {
  const code = normalizeCouponCode(rawCode);
  if (!code) {
    return { valid: false, reason: 'empty_code' };
  }

  const allCoupons = readAllDemoCoupons();
  const matched = allCoupons.find((c) => normalizeCouponCode(c.code) === code);

  if (!matched || matched.status === 'archived') {
    return { valid: false, reason: 'not_found' };
  }

  if (matched.status !== 'active') {
    return { valid: false, reason: 'inactive' };
  }

  const nowMs = nowDate.getTime();
  if (matched.startsAt) {
    const startMs = new Date(matched.startsAt).getTime();
    if (Number.isFinite(startMs) && nowMs < startMs) {
      return { valid: false, reason: 'not_started' };
    }
  }

  if (matched.expiresAt) {
    const expMs = new Date(matched.expiresAt).getTime();
    if (Number.isFinite(expMs) && nowMs > expMs) {
      return { valid: false, reason: 'expired' };
    }
  }

  if (
    typeof matched.maxTotalUsesDemo === 'number' &&
    matched.maxTotalUsesDemo > 0 &&
    matched.usedCountDemo >= matched.maxTotalUsesDemo
  ) {
    return { valid: false, reason: 'usage_limit_reached' };
  }

  const safeSubtotal = Math.max(0, Math.round(subtotalEgp));
  if (safeSubtotal < matched.minSubtotalEgp) {
    return {
      valid: false,
      reason: 'min_subtotal_not_met',
      requiredMinSubtotalEgp: matched.minSubtotalEgp,
    };
  }

  let rawDiscount = 0;
  if (matched.discountType === 'fixed_egp') {
    rawDiscount = Math.round(matched.discountValue);
  } else {
    rawDiscount = Math.round((safeSubtotal * matched.discountValue) / 100);
    if (
      typeof matched.maxDiscountEgp === 'number' &&
      matched.maxDiscountEgp > 0
    ) {
      rawDiscount = Math.min(rawDiscount, Math.round(matched.maxDiscountEgp));
    }
  }

  // Never allow discount to exceed eligible product subtotal
  const discountEgp = Math.max(0, Math.min(rawDiscount, safeSubtotal));
  const discountedSubtotalEgp = Math.max(0, safeSubtotal - discountEgp);

  return {
    valid: true,
    coupon: {
      id: matched.id,
      code: matched.code,
      title: matched.title,
      description: matched.description,
      discountType: matched.discountType,
      discountValue: matched.discountValue,
      minSubtotalEgp: matched.minSubtotalEgp,
      maxDiscountEgp: matched.maxDiscountEgp,
    },
    discountEgp,
    discountedSubtotalEgp,
  };
}

export function incrementCouponUsageDemo(couponCode: string): void {
  const normalized = normalizeCouponCode(couponCode);
  const all = readAllDemoCoupons();
  const next = all.map((c) =>
    normalizeCouponCode(c.code) === normalized
      ? { ...c, usedCountDemo: c.usedCountDemo + 1 }
      : c
  );
  writeAllDemoCoupons(next);
}
