import {
  type LocalizedText,
  type ProductColor,
  getAllCatalogProducts,
} from '@/data/catalog';
import {
  incrementCouponUsageDemo,
  validateAndCalculateCoupon,
} from '@/data/coupons';
import {
  type PaymentLifecycleStatus,
  type PaymentMethodId,
  getPaymentMethodOption,
} from '@/data/payments';
import { getGovernorateByCode } from '@/data/shipping';

export type OrderLifecycleStatus =
  | 'new'
  | 'awaiting_processing'
  | 'confirmed'
  | 'preparing'
  | 'ready_to_ship'
  | 'completed'
  | 'cancelled';

export type ShipmentLifecycleStatus =
  | 'not_yet_prepared'
  | 'packing'
  | 'dispatched'
  | 'in_transit'
  | 'delivered'
  | 'delivery_issue'
  | 'returned_to_sender';

export const ALL_ORDER_STATUSES: readonly OrderLifecycleStatus[] = [
  'new',
  'awaiting_processing',
  'confirmed',
  'preparing',
  'ready_to_ship',
  'completed',
  'cancelled',
] as const;

export const ALL_PAYMENT_STATUSES: readonly PaymentLifecycleStatus[] = [
  'unpaid',
  'awaiting_manual_verification',
  'paid',
  'verification_failed',
  'refunded',
] as const;

export const ALL_SHIPMENT_STATUSES: readonly ShipmentLifecycleStatus[] = [
  'not_yet_prepared',
  'packing',
  'dispatched',
  'in_transit',
  'delivered',
  'delivery_issue',
  'returned_to_sender',
] as const;

export interface OrderItemSnapshot {
  variantId: string;
  productId: string;
  slug: string;
  skuSnapshot: string;
  titleSnapshot: LocalizedText;
  colorKey: ProductColor['key'];
  colorNameSnapshot: LocalizedText;
  colorHexSnapshot: string;
  sizeSnapshot: string;
  unitPriceEgp: number;
  quantity: number;
  lineTotalEgp: number;
  imageUrlSnapshot: string;
}

export interface OrderCustomerDetails {
  fullName: string;
  mobileNumber: string;
  normalizedMobile: string;
  governorateCode: string;
  governorateNameSnapshot: LocalizedText;
  cityOrArea: string;
  streetAndBuilding: string;
  landmark?: string;
  deliveryNote?: string;
}

export interface OrderPricingSnapshot {
  subtotalEgp: number;
  couponCodeSnapshot?: string;
  couponTitleSnapshot?: LocalizedText;
  discountEgp?: number;
  deliveryFeeEgp: number;
  totalEgp: number;
}

export interface OrderShipmentTracking {
  carrierName: string;
  trackingNumber: string;
  updatedAt: string;
  updatedBy: string;
  latestCustomerUpdate: LocalizedText;
}

export interface OrderStatusHistoryEntry {
  id: string;
  timestamp: string;
  domain: 'order' | 'payment' | 'shipment';
  fromStatus: string | null;
  toStatus: string;
  actor: 'customer' | 'admin' | 'system';
  /** Recorded when an authorized admin performs an action; stripped from public customer lookup */
  actorIdentity?: string;
  /** Customer-visible status/tracking message */
  note: LocalizedText;
  /** Private internal admin note — NEVER exposed in customer order lookup */
  internalNote?: string;
  trackingSnapshot?: {
    carrierName?: string;
    trackingNumber?: string;
  };
}

export interface DemoOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  isSeededSample?: boolean;
  customer: OrderCustomerDetails;
  items: OrderItemSnapshot[];
  pricing: OrderPricingSnapshot;
  paymentMethod: PaymentMethodId;
  paymentTransferReference?: string;
  orderStatus: OrderLifecycleStatus;
  paymentStatus: PaymentLifecycleStatus;
  shipmentStatus: ShipmentLifecycleStatus;
  shipmentTracking?: OrderShipmentTracking;
  statusHistory: OrderStatusHistoryEntry[];
}

export const ORDERS_STORAGE_KEY = 'labsa_demo_orders_v1';
export const STOCK_DEDUCTIONS_STORAGE_KEY = 'labsa_demo_stock_deductions_v1';

/**
 * Normalizes an Egyptian mobile number to digits-only standard format (e.g. 010xxxxxxxx)
 * for reliable matching during customer-safe order lookup.
 */
export function normalizeEgyptianMobile(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('201') && digits.length === 12) {
    return `0${digits.slice(2)}`;
  }
  if (digits.startsWith('00201') && digits.length === 14) {
    return `0${digits.slice(4)}`;
  }
  return digits;
}

export function isValidEgyptianMobile(raw: string): boolean {
  const normalized = normalizeEgyptianMobile(raw);
  return /^01[0125]\d{8}$/.test(normalized);
}

/**
 * Pre-seeded fictional demo orders so the Order Lookup and Admin Dashboard
 * can be tested out-of-the-box in addition to newly placed customer orders.
 */
export const SEEDED_DEMO_ORDERS: DemoOrder[] = [
  {
    id: 'ord-seed-1001',
    orderNumber: 'LAB-2026-1001',
    createdAt: '2026-10-27T11:20:00Z',
    isSeededSample: true,
    customer: {
      fullName: 'أحمد محمود (عميل تجريبي / Demo Customer)',
      mobileNumber: '01000000001',
      normalizedMobile: '01000000001',
      governorateCode: 'CAI',
      governorateNameSnapshot: { ar: 'القاهرة', en: 'Cairo' },
      cityOrArea: 'مصر الجديدة / Heliopolis',
      streetAndBuilding: '14 شارع تجريبي للعرض فقط — عمارة 3 الدور الثاني',
      landmark: 'بجوار ميدان الكوربة (عنوان خيالي للعرض)',
      deliveryNote: 'يرجى الاتصال قبل الوصول بنصف ساعة (طلب تجريبي)',
    },
    items: [
      {
        variantId: 'v-m01-olive-l',
        productId: 'prod-men-01',
        slug: 'olive-topstitched-chino-trousers',
        skuSnapshot: 'LAB-M01-OLV-L',
        titleSnapshot: {
          ar: 'بنطلون تشينو زيتوني بغرز خياطة بارزة',
          en: 'Olive Topstitched Utility Chino Trousers',
        },
        colorKey: 'olive',
        colorNameSnapshot: { ar: 'زيتوني مطفي', en: 'Muted Olive' },
        colorHexSnapshot: '#808060',
        sizeSnapshot: 'L',
        unitPriceEgp: 750,
        quantity: 1,
        lineTotalEgp: 750,
        imageUrlSnapshot: '/products/men-olive-chinos.jpg',
      },
      {
        variantId: 'v-k01-terra-6y',
        productId: 'prod-kids-01',
        slug: 'kids-terracotta-canvas-overalls',
        skuSnapshot: 'LAB-K01-TER-6Y',
        titleSnapshot: {
          ar: 'سالوبيت أطفال قماش كانفاس تيراكوتا بغرز متقنة',
          en: "Kids' Terracotta Stitched Cotton Canvas Overalls",
        },
        colorKey: 'terracotta',
        colorNameSnapshot: { ar: 'تيراكوتا دافئ', en: 'Terracotta Orange' },
        colorHexSnapshot: '#C8784C',
        sizeSnapshot: '6-7Y',
        unitPriceEgp: 580,
        quantity: 1,
        lineTotalEgp: 580,
        imageUrlSnapshot: '/products/kids-terracotta-overalls.jpg',
      },
    ],
    pricing: {
      subtotalEgp: 1330,
      deliveryFeeEgp: 50,
      totalEgp: 1380,
    },
    paymentMethod: 'manual_instapay',
    paymentTransferReference: 'INSTA-DEMO-88412 (Fictional Ref)',
    orderStatus: 'new',
    paymentStatus: 'awaiting_manual_verification',
    shipmentStatus: 'not_yet_prepared',
    statusHistory: [
      {
        id: 'hist-1001-1',
        timestamp: '2026-10-27T11:20:00Z',
        domain: 'order',
        fromStatus: null,
        toStatus: 'new',
        actor: 'customer',
        note: {
          ar: 'تم إنشاء الطلب التجريبي بنجاح.',
          en: 'Demo order created.',
        },
      },
      {
        id: 'hist-1001-2',
        timestamp: '2026-10-27T11:20:00Z',
        domain: 'payment',
        fromStatus: null,
        toStatus: 'awaiting_manual_verification',
        actor: 'system',
        note: {
          ar: 'بانتظار المراجعة اليدوية لتحويل إنستا باي التجريبي من قبل الإدارة.',
          en: 'Awaiting manual admin verification of demo InstaPay transfer.',
        },
      },
    ],
  },
  {
    id: 'ord-seed-1002',
    orderNumber: 'LAB-2026-1002',
    createdAt: '2026-10-27T15:45:00Z',
    isSeededSample: true,
    customer: {
      fullName: 'سارة علي (عميل تجريبي / Demo Customer)',
      mobileNumber: '01000000002',
      normalizedMobile: '01000000002',
      governorateCode: 'ASW',
      governorateNameSnapshot: { ar: 'أسوان', en: 'Aswan' },
      cityOrArea: 'وسط البلد / Downtown Aswan',
      streetAndBuilding: '8 شارع كورنيش النيل التجريبي — الدور الأول',
      landmark: 'عنوان تجريبي للعرض فقط',
    },
    items: [
      {
        variantId: 'v-m03-olive-m',
        productId: 'prod-men-03',
        slug: 'olive-terracotta-heavyweight-hoodie',
        skuSnapshot: 'LAB-M03-OLV-M',
        titleSnapshot: {
          ar: 'هودي قطن ثقيل زيتوني بجيب تيراكوتا',
          en: 'Olive Heavyweight Hoodie with Terracotta Pocket',
        },
        colorKey: 'olive',
        colorNameSnapshot: { ar: 'زيتوني مطفي', en: 'Muted Olive' },
        colorHexSnapshot: '#808060',
        sizeSnapshot: 'M',
        unitPriceEgp: 890,
        quantity: 1,
        lineTotalEgp: 890,
        imageUrlSnapshot: '/products/men-olive-hoodie.jpg',
      },
    ],
    pricing: {
      subtotalEgp: 890,
      deliveryFeeEgp: 90,
      totalEgp: 980,
    },
    paymentMethod: 'cod',
    orderStatus: 'preparing',
    paymentStatus: 'unpaid',
    shipmentStatus: 'in_transit',
    shipmentTracking: {
      carrierName: 'Bosta Egypt (Demo Courier)',
      trackingNumber: 'DEMO-BST-90241',
      updatedAt: '2026-10-28T04:15:00Z',
      updatedBy: 'demo-admin@labsa-store.example',
      latestCustomerUpdate: {
        ar: 'تم خروج الشحنة التجريبية من فرع القاهرة ومتجهة إلى أسوان (بيانات تتبع تجريبية تُدخل يدوياً).',
        en: 'Demo parcel departed Cairo hub en route to Aswan (manually entered demo tracking update).',
      },
    },
    statusHistory: [
      {
        id: 'hist-1002-1',
        timestamp: '2026-10-27T15:45:00Z',
        domain: 'order',
        fromStatus: null,
        toStatus: 'new',
        actor: 'customer',
        note: {
          ar: 'تم تسجيل الطلب التجريبي بنظام الدفع عند الاستلام.',
          en: 'Demo Cash on Delivery order placed.',
        },
      },
      {
        id: 'hist-1002-2',
        timestamp: '2026-10-27T18:10:00Z',
        domain: 'order',
        fromStatus: 'new',
        toStatus: 'preparing',
        actor: 'admin',
        actorIdentity: 'demo-admin@labsa-store.example',
        note: {
          ar: 'تم تأكيد الطلب وبدء تجهيز القطع في المخزن.',
          en: 'Order confirmed and garment preparation started.',
        },
        internalNote:
          'تم فحص المقاس M من الهودي الزيتوني وتغليفه — ملاحظة داخلية للإدارة فقط.',
      },
      {
        id: 'hist-1002-3',
        timestamp: '2026-10-28T04:15:00Z',
        domain: 'shipment',
        fromStatus: 'not_yet_prepared',
        toStatus: 'in_transit',
        actor: 'admin',
        actorIdentity: 'demo-admin@labsa-store.example',
        note: {
          ar: 'تم خروج الشحنة التجريبية من فرع القاهرة ومتجهة إلى أسوان (بيانات تتبع تجريبية تُدخل يدوياً).',
          en: 'Demo parcel departed Cairo hub en route to Aswan (manually entered demo tracking update).',
        },
        internalNote:
          'تم تسليم الشحنة لمندوب بوسطة التجريبي؛ الدفع عند الاستلام لم يُحصّل بعد.',
        trackingSnapshot: {
          carrierName: 'Bosta Egypt (Demo Courier)',
          trackingNumber: 'DEMO-BST-90241',
        },
      },
    ],
  },
];

export function readStockDeductions(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STOCK_DEDUCTIONS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function getLiveVariantStock(
  variantId: string,
  baseStock: number
): number {
  const deductions = readStockDeductions();
  const deducted = deductions[variantId] ?? 0;
  return Math.max(0, baseStock - deducted);
}

export function readAllDemoOrders(): DemoOrder[] {
  if (typeof window === 'undefined') return SEEDED_DEMO_ORDERS;
  try {
    const raw = window.localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(
        ORDERS_STORAGE_KEY,
        JSON.stringify(SEEDED_DEMO_ORDERS)
      );
      return SEEDED_DEMO_ORDERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return SEEDED_DEMO_ORDERS;
  } catch {
    return SEEDED_DEMO_ORDERS;
  }
}

export function writeAllDemoOrders(orders: DemoOrder[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    return true;
  } catch {
    return false;
  }
}

export function getDemoOrderByNumber(orderNumber: string): DemoOrder | null {
  const normalizedTarget = orderNumber.trim().toUpperCase();
  const all = readAllDemoOrders();
  return (
    all.find((o) => o.orderNumber.toUpperCase() === normalizedTarget) ?? null
  );
}

/**
 * Strips internal admin notes and admin operator emails before returning
 * an order to a customer-facing view.
 */
export function sanitizeOrderForCustomer(order: DemoOrder): DemoOrder {
  return {
    ...order,
    shipmentTracking: order.shipmentTracking
      ? {
          ...order.shipmentTracking,
          updatedBy: 'LABSA Store',
        }
      : undefined,
    statusHistory: order.statusHistory.map(
      ({ internalNote: _internal, actorIdentity: _actorId, ...publicEntry }) =>
        publicEntry
    ),
  };
}

/**
 * Customer-safe demo lookup: requires BOTH the order reference AND the matching
 * customer mobile number so an order is never exposed by order number alone.
 * Also strips internal admin notes before returning.
 */
export function lookupDemoOrderSafe(
  orderNumber: string,
  mobileInput: string
): DemoOrder | null {
  const order = getDemoOrderByNumber(orderNumber);
  if (!order) return null;

  const normalizedInput = normalizeEgyptianMobile(mobileInput);
  if (!normalizedInput) return null;

  if (order.customer.normalizedMobile !== normalizedInput) {
    return null;
  }

  return sanitizeOrderForCustomer(order);
}

/**
 * Checks whether a product ID is referenced in any stored historical order snapshot.
 * Products in historical orders must be archived/deactivated rather than deleted.
 */
export function isProductReferencedInOrders(productId: string): boolean {
  const orders = readAllDemoOrders();
  return orders.some((order) =>
    order.items.some((item) => item.productId === productId)
  );
}

export interface PlaceOrderItemRequest {
  variantId: string;
  productId: string;
  quantity: number;
}

export interface PlaceOrderInput {
  customer: {
    fullName: string;
    mobileNumber: string;
    governorateCode: string;
    cityOrArea: string;
    streetAndBuilding: string;
    landmark?: string;
    deliveryNote?: string;
  };
  paymentMethod: PaymentMethodId;
  paymentTransferReference?: string;
  couponCode?: string | null;
  items: PlaceOrderItemRequest[];
}

export type PlaceOrderResult =
  | { ok: true; order: DemoOrder }
  | {
      ok: false;
      errorCode:
        | 'empty_cart'
        | 'invalid_governorate'
        | 'invalid_mobile'
        | 'missing_customer_name'
        | 'missing_address'
        | 'variant_unavailable'
        | 'insufficient_stock'
        | 'invalid_coupon'
        | 'storage_error';
      itemTitle?: LocalizedText;
      availableStock?: number;
    };

/**
 * Validates cart items, variant availability, and live stock, then creates and
 * persists an immutable DemoOrder snapshot with separate Order, Payment, and Shipment statuses.
 */
export function placeDemoOrder(input: PlaceOrderInput): PlaceOrderResult {
  if (!input.items || input.items.length === 0) {
    return { ok: false, errorCode: 'empty_cart' };
  }

  const govRule = getGovernorateByCode(input.customer.governorateCode);
  if (!govRule) {
    return { ok: false, errorCode: 'invalid_governorate' };
  }

  // Strict Egyptian telecom prefix (010, 011, 012, 015) and 11-digit validation
  if (!isValidEgyptianMobile(input.customer.mobileNumber)) {
    return { ok: false, errorCode: 'invalid_mobile' };
  }
  const normalizedMobile = normalizeEgyptianMobile(input.customer.mobileNumber);

  const cleanFullName = input.customer.fullName?.trim().slice(0, 100);
  if (!cleanFullName) {
    return { ok: false, errorCode: 'missing_customer_name' };
  }

  const cleanCity = input.customer.cityOrArea?.trim().slice(0, 100);
  const cleanStreet = input.customer.streetAndBuilding?.trim().slice(0, 200);
  if (!cleanCity || !cleanStreet) {
    return { ok: false, errorCode: 'missing_address' };
  }

  const allProducts = getAllCatalogProducts();
  const orderItems: OrderItemSnapshot[] = [];
  const deductionsToAdd: Record<string, number> = {};

  for (const reqItem of input.items) {
    const product = allProducts.find(
      (p) => p.id === reqItem.productId && p.status !== 'draft'
    );
    if (!product || product.status === 'out_of_stock') {
      return {
        ok: false,
        errorCode: 'variant_unavailable',
        itemTitle: product?.title,
      };
    }

    const variant = product.variants.find((v) => v.id === reqItem.variantId);
    if (!variant) {
      return {
        ok: false,
        errorCode: 'variant_unavailable',
        itemTitle: product.title,
      };
    }

    const liveStock = getLiveVariantStock(variant.id, variant.stock);
    if (liveStock <= 0) {
      return {
        ok: false,
        errorCode: 'variant_unavailable',
        itemTitle: product.title,
      };
    }

    // Strictly validate quantity as a positive safe integer within live available stock
    if (
      !Number.isSafeInteger(reqItem.quantity) ||
      reqItem.quantity <= 0 ||
      reqItem.quantity > liveStock
    ) {
      return {
        ok: false,
        errorCode: 'insufficient_stock',
        itemTitle: product.title,
        availableStock: liveStock,
      };
    }

    const colorObj =
      product.colors.find((c) => c.key === variant.colorKey) ??
      product.colors[0];
    const primaryImg =
      product.images.find((img) => img.colorKey === variant.colorKey) ??
      product.images.find((img) => img.isPrimary) ??
      product.images[0];

    orderItems.push({
      variantId: variant.id,
      productId: product.id,
      slug: product.slug,
      skuSnapshot: variant.sku,
      titleSnapshot: { ...product.title },
      colorKey: variant.colorKey,
      colorNameSnapshot: { ...colorObj.name },
      colorHexSnapshot: colorObj.hex,
      sizeSnapshot: variant.size,
      unitPriceEgp: product.priceEgp,
      quantity: reqItem.quantity,
      lineTotalEgp: product.priceEgp * reqItem.quantity,
      imageUrlSnapshot: primaryImg.url,
    });

    deductionsToAdd[variant.id] =
      (deductionsToAdd[variant.id] ?? 0) + reqItem.quantity;
  }

  const subtotalEgp = orderItems.reduce((sum, i) => sum + i.lineTotalEgp, 0);

  let couponCodeSnapshot: string | undefined;
  let couponTitleSnapshot: LocalizedText | undefined;
  let discountEgp = 0;

  if (input.couponCode && input.couponCode.trim().length > 0) {
    const couponCheck = validateAndCalculateCoupon(
      input.couponCode,
      subtotalEgp
    );
    if (!couponCheck.valid) {
      return { ok: false, errorCode: 'invalid_coupon' };
    }
    couponCodeSnapshot = couponCheck.coupon.code;
    couponTitleSnapshot = { ...couponCheck.coupon.title };
    discountEgp = couponCheck.discountEgp;
  }

  const discountedSubtotalEgp = Math.max(0, subtotalEgp - discountEgp);
  const deliveryFeeEgp = govRule.feeEgp;
  const totalEgp = discountedSubtotalEgp + deliveryFeeEgp;

  const paymentOption = getPaymentMethodOption(input.paymentMethod);
  const initialPaymentStatus: PaymentLifecycleStatus =
    paymentOption.initialPaymentStatus;
  const initialOrderStatus: OrderLifecycleStatus = 'new';
  const initialShipmentStatus: ShipmentLifecycleStatus = 'not_yet_prepared';

  const existingOrders = readAllDemoOrders();
  const nextSeq = 1001 + existingOrders.length;
  const randomSuffix = Math.floor(10 + Math.random() * 89);
  const orderNumber = `LAB-2026-${nextSeq}${randomSuffix}`;
  const nowIso = new Date().toISOString();

  const newOrder: DemoOrder = {
    id: `ord-${Date.now()}-${randomSuffix}`,
    orderNumber,
    createdAt: nowIso,
    customer: {
      fullName: cleanFullName,
      mobileNumber: input.customer.mobileNumber.trim().slice(0, 20),
      normalizedMobile,
      governorateCode: govRule.code,
      governorateNameSnapshot: { ...govRule.name },
      cityOrArea: cleanCity,
      streetAndBuilding: cleanStreet,
      landmark: input.customer.landmark?.trim().slice(0, 150) || undefined,
      deliveryNote: input.customer.deliveryNote?.trim().slice(0, 300) || undefined,
    },
    items: orderItems,
    pricing: {
      subtotalEgp,
      couponCodeSnapshot,
      couponTitleSnapshot,
      discountEgp: discountEgp > 0 ? discountEgp : undefined,
      deliveryFeeEgp,
      totalEgp,
    },
    paymentMethod: input.paymentMethod,
    paymentTransferReference:
      input.paymentTransferReference?.trim().slice(0, 100) || undefined,
    orderStatus: initialOrderStatus,
    paymentStatus: initialPaymentStatus,
    shipmentStatus: initialShipmentStatus,
    statusHistory: [
      {
        id: `hist-${Date.now()}-1`,
        timestamp: nowIso,
        domain: 'order',
        fromStatus: null,
        toStatus: initialOrderStatus,
        actor: 'customer',
        note: {
          ar: 'تم استلام الطلب التجريبي وحفظ نسخة ثابتة من الأسعار ورسوم الشحن.',
          en: 'Demo order placed with immutable item and delivery fee snapshots.',
        },
      },
      {
        id: `hist-${Date.now()}-2`,
        timestamp: nowIso,
        domain: 'payment',
        fromStatus: null,
        toStatus: initialPaymentStatus,
        actor: 'system',
        note:
          initialPaymentStatus === 'unpaid'
            ? {
                ar: 'الدفع نقداً عند الاستلام — غير مدفوع حتى التسليم.',
                en: 'Cash on Delivery — Unpaid until delivery collection.',
              }
            : {
                ar: 'تحويل يدوي تجريبي — بانتظار المراجعة والتأكيد اليدوي من الإدارة.',
                en: 'Manual transfer — Awaiting manual verification by store admin.',
              },
      },
      {
        id: `hist-${Date.now()}-3`,
        timestamp: nowIso,
        domain: 'shipment',
        fromStatus: null,
        toStatus: initialShipmentStatus,
        actor: 'system',
        note: {
          ar: 'لم يبدأ تجهيز الشحنة بعد.',
          en: 'Shipment not yet prepared.',
        },
      },
    ],
  };

  try {
    const updatedOrders = [newOrder, ...existingOrders];
    window.localStorage.setItem(
      ORDERS_STORAGE_KEY,
      JSON.stringify(updatedOrders)
    );

    const currentDeductions = readStockDeductions();
    for (const [vId, qty] of Object.entries(deductionsToAdd)) {
      currentDeductions[vId] = (currentDeductions[vId] ?? 0) + qty;
    }
    window.localStorage.setItem(
      STOCK_DEDUCTIONS_STORAGE_KEY,
      JSON.stringify(currentDeductions)
    );

    if (couponCodeSnapshot) {
      incrementCouponUsageDemo(couponCodeSnapshot);
    }
  } catch {
    return { ok: false, errorCode: 'storage_error' };
  }

  return { ok: true, order: newOrder };
}

// =============================================================================
// ADMIN ORDER, PAYMENT & SHIPMENT MUTATION HELPERS (STAGE 7)
// Never recalculate pricing or alter historical item/delivery snapshots.
// =============================================================================

export function adminUpdatePaymentStatus(params: {
  orderId: string;
  newPaymentStatus: PaymentLifecycleStatus;
  customerNote: LocalizedText;
  internalNote?: string;
  actorIdentity: string;
  timestamp: string;
}): { ok: true; order: DemoOrder } | { ok: false; errorCode: string } {
  const orders = readAllDemoOrders();
  const idx = orders.findIndex((o) => o.id === params.orderId);
  if (idx === -1) {
    return { ok: false, errorCode: 'order_not_found' };
  }

  const target = orders[idx];
  const prevStatus = target.paymentStatus;

  const historyEntry: OrderStatusHistoryEntry = {
    id: `hist-pay-${Date.now()}`,
    timestamp: params.timestamp,
    domain: 'payment',
    fromStatus: prevStatus,
    toStatus: params.newPaymentStatus,
    actor: 'admin',
    actorIdentity: params.actorIdentity,
    note: params.customerNote,
    internalNote: params.internalNote?.trim() || undefined,
  };

  const updatedOrder: DemoOrder = {
    ...target,
    paymentStatus: params.newPaymentStatus,
    statusHistory: [...target.statusHistory, historyEntry],
  };

  const nextOrders = [...orders];
  nextOrders[idx] = updatedOrder;

  if (!writeAllDemoOrders(nextOrders)) {
    return { ok: false, errorCode: 'storage_error' };
  }

  return { ok: true, order: updatedOrder };
}

export function adminUpdateOrderStatus(params: {
  orderId: string;
  newOrderStatus: OrderLifecycleStatus;
  customerNote: LocalizedText;
  internalNote?: string;
  actorIdentity: string;
  timestamp: string;
}): { ok: true; order: DemoOrder } | { ok: false; errorCode: string } {
  const orders = readAllDemoOrders();
  const idx = orders.findIndex((o) => o.id === params.orderId);
  if (idx === -1) {
    return { ok: false, errorCode: 'order_not_found' };
  }

  const target = orders[idx];
  const prevStatus = target.orderStatus;

  const historyEntry: OrderStatusHistoryEntry = {
    id: `hist-ord-${Date.now()}`,
    timestamp: params.timestamp,
    domain: 'order',
    fromStatus: prevStatus,
    toStatus: params.newOrderStatus,
    actor: 'admin',
    actorIdentity: params.actorIdentity,
    note: params.customerNote,
    internalNote: params.internalNote?.trim() || undefined,
  };

  const updatedOrder: DemoOrder = {
    ...target,
    orderStatus: params.newOrderStatus,
    statusHistory: [...target.statusHistory, historyEntry],
  };

  // If transitioning to 'cancelled' from a non-cancelled state, restore session stock deductions
  if (prevStatus !== 'cancelled' && params.newOrderStatus === 'cancelled') {
    try {
      const currentDeductions = readStockDeductions();
      for (const item of target.items) {
        const currentDed = currentDeductions[item.variantId] ?? 0;
        currentDeductions[item.variantId] = Math.max(
          0,
          currentDed - item.quantity
        );
      }
      window.localStorage.setItem(
        STOCK_DEDUCTIONS_STORAGE_KEY,
        JSON.stringify(currentDeductions)
      );
    } catch {
      // Ignore storage error on stock restoration
    }
  }

  const nextOrders = [...orders];
  nextOrders[idx] = updatedOrder;

  if (!writeAllDemoOrders(nextOrders)) {
    return { ok: false, errorCode: 'storage_error' };
  }

  return { ok: true, order: updatedOrder };
}

export function adminUpdateShipmentAndTracking(params: {
  orderId: string;
  newShipmentStatus: ShipmentLifecycleStatus;
  carrierName: string;
  trackingNumber: string;
  customerTrackingUpdate: LocalizedText;
  internalNote?: string;
  actorIdentity: string;
  timestamp: string;
}): { ok: true; order: DemoOrder } | { ok: false; errorCode: string } {
  const orders = readAllDemoOrders();
  const idx = orders.findIndex((o) => o.id === params.orderId);
  if (idx === -1) {
    return { ok: false, errorCode: 'order_not_found' };
  }

  const target = orders[idx];
  const prevStatus = target.shipmentStatus;
  const cleanCarrier = params.carrierName.trim();
  const cleanTracking = params.trackingNumber.trim();

  const historyEntry: OrderStatusHistoryEntry = {
    id: `hist-shp-${Date.now()}`,
    timestamp: params.timestamp,
    domain: 'shipment',
    fromStatus: prevStatus,
    toStatus: params.newShipmentStatus,
    actor: 'admin',
    actorIdentity: params.actorIdentity,
    note: params.customerTrackingUpdate,
    internalNote: params.internalNote?.trim() || undefined,
    trackingSnapshot:
      cleanCarrier || cleanTracking
        ? {
            carrierName: cleanCarrier || undefined,
            trackingNumber: cleanTracking || undefined,
          }
        : undefined,
  };

  const updatedOrder: DemoOrder = {
    ...target,
    shipmentStatus: params.newShipmentStatus,
    shipmentTracking: {
      carrierName: cleanCarrier,
      trackingNumber: cleanTracking,
      updatedAt: params.timestamp,
      updatedBy: params.actorIdentity,
      latestCustomerUpdate: params.customerTrackingUpdate,
    },
    statusHistory: [...target.statusHistory, historyEntry],
  };

  const nextOrders = [...orders];
  nextOrders[idx] = updatedOrder;

  if (!writeAllDemoOrders(nextOrders)) {
    return { ok: false, errorCode: 'storage_error' };
  }

  return { ok: true, order: updatedOrder };
}
