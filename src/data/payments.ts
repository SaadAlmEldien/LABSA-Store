import type { LocalizedText } from '@/data/catalog';

export type PaymentMethodId = 'cod' | 'manual_wallet' | 'manual_instapay';

export type PaymentLifecycleStatus =
  | 'unpaid'
  | 'awaiting_manual_verification'
  | 'paid'
  | 'verification_failed'
  | 'refunded';

export interface DemoPaymentMethodOption {
  id: PaymentMethodId;
  title: LocalizedText;
  shortBadge: LocalizedText;
  description: LocalizedText;
  initialPaymentStatus: PaymentLifecycleStatus;
  demoPlaceholderAccount?: string;
  demoSafetyWarning: LocalizedText;
}

/**
 * Store Payment Methods
 * Never requests card details, PINs, OTPs, or wallet credentials.
 * Removes fictional wallet numbers and InstaPay handles from customer-facing views.
 */
export const DEMO_PAYMENT_METHODS: readonly DemoPaymentMethodOption[] = [
  {
    id: 'cod',
    title: {
      ar: 'الدفع نقداً عند الاستلام (COD)',
      en: 'Cash on Delivery (COD)',
    },
    shortBadge: {
      ar: 'نقداً عند الاستلام',
      en: 'Pay on Delivery',
    },
    description: {
      ar: 'ادفع قيمة طلبك بالجنيه المصري نقداً عند استلام الشحنة من مندوب التوصيل.',
      en: 'Pay in Egyptian Pounds (EGP) when your order is delivered to your address.',
    },
    initialPaymentStatus: 'unpaid',
    demoSafetyWarning: {
      ar: 'يتم سداد إجمالي الطلب نقداً عند التسليم بعد معاينة الشحنة.',
      en: 'Total order amount is paid in cash upon delivery.',
    },
  },
  {
    id: 'manual_wallet',
    title: {
      ar: 'تحويل محفظة إلكترونية (مراجعة يدوية)',
      en: 'Mobile Wallet Transfer (Manual Verification)',
    },
    shortBadge: {
      ar: 'محفظة إلكترونية',
      en: 'Mobile Wallet',
    },
    description: {
      ar: 'تظل حالة الدفع «بانتظار المراجعة اليدوية» ولا يتم تأكيد الدفع تلقائياً حتى تتم مراجعته واعتماده.',
      en: 'Payment status starts as "Awaiting Manual Verification" and is confirmed after administrative review.',
    },
    initialPaymentStatus: 'awaiting_manual_verification',
    demoSafetyWarning: {
      ar: 'تخضع التحويلات اليدوية للمراجعة والتأكيد قبل تجهيز الشحنة، ولا نطلب أبداً أي أرقام سرية أو رموز تحقق.',
      en: 'Manual transfers require verification before dispatch. We never ask for PINs, OTPs, or wallet passwords.',
    },
  },
  {
    id: 'manual_instapay',
    title: {
      ar: 'تحويل إنستا باي InstaPay (مراجعة يدوية)',
      en: 'InstaPay Transfer (Manual Verification)',
    },
    shortBadge: {
      ar: 'إنستا باي',
      en: 'InstaPay',
    },
    description: {
      ar: 'تظل حالة الدفع «بانتظار المراجعة اليدوية» حتى يتم التحقق من مرجع التحويل واعتماده.',
      en: 'Payment status starts as "Awaiting Manual Verification" until your transfer reference is reviewed.',
    },
    initialPaymentStatus: 'awaiting_manual_verification',
    demoSafetyWarning: {
      ar: 'تخضع تحويلات InstaPay للمراجعة اليدوية لتأكيد حالة الدفع قبل الشحن.',
      en: 'InstaPay transfers are manually verified before your order is marked paid.',
    },
  },
] as const;

export function getPaymentMethodOption(
  id: PaymentMethodId
): DemoPaymentMethodOption {
  return (
    DEMO_PAYMENT_METHODS.find((m) => m.id === id) ?? DEMO_PAYMENT_METHODS[0]
  );
}

/**
 * Returns the initial payment status for a newly placed order:
 * - COD -> 'unpaid'
 * - Manual Wallet / InstaPay -> 'awaiting_manual_verification' (never auto-marked paid)
 */
export function getInitialPaymentStatusForMethod(
  methodId: PaymentMethodId
): PaymentLifecycleStatus {
  const method = getPaymentMethodOption(methodId);
  return method.initialPaymentStatus;
}
