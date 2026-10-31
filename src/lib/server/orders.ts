/**
 * LABSA Store — Server-Side Authoritative Order Service
 * Enforces server-side pricing, inventory validation, idempotency, and customer-safe DTOs.
 * Direct database transactions via Supabase with production fail-closed boundaries.
 */

import crypto from 'crypto';
import {
  type CatalogProduct,
  type LocalizedText,
  getAllCatalogProducts,
} from '@/data/catalog';
import {
  type PaymentMethodId,
  type PaymentLifecycleStatus,
} from '@/data/payments';
import {
  type OrderLifecycleStatus,
  type ShipmentLifecycleStatus,
  type OrderItemSnapshot,
  isValidEgyptianMobile,
  normalizeEgyptianMobile,
} from '@/data/orders';
import { getGovernorateByCode } from '@/data/shipping';
import { getSupabaseAdminClient } from './supabase';
import { getServerDatabaseConfig, getServerLookupSecret } from './env';

if (typeof window !== 'undefined') {
  throw new Error('src/lib/server/orders.ts must only be loaded on the server.');
}

export interface ServerCreateOrderItemRequest {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface ServerCreateOrderInput {
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
  items: ServerCreateOrderItemRequest[];
  idempotencyKey?: string | null;
}

export interface CustomerOrderSafeDTO {
  orderNumber: string;
  customerLookupToken: string;
  createdAt: string;
  subtotalEgp: number;
  deliveryFeeEgp: number;
  discountEgp: number;
  totalEgp: number;
  paymentMethod: PaymentMethodId;
  paymentStatus: PaymentLifecycleStatus;
  orderStatus: OrderLifecycleStatus;
  shipmentStatus: ShipmentLifecycleStatus;
  carrierName?: string;
  trackingNumber?: string;
  latestCustomerTrackingUpdate?: LocalizedText;
  governorateNameSnapshot: LocalizedText;
  customerName: string;
  items: Array<{
    productId: string;
    variantId: string;
    slug: string;
    titleSnapshot: LocalizedText;
    colorNameSnapshot: LocalizedText;
    sizeSnapshot: string;
    unitPriceEgp: number;
    quantity: number;
    lineTotalEgp: number;
    imageUrlSnapshot: string;
  }>;
  statusHistory: Array<{
    id: string;
    timestamp: string;
    domain: 'order' | 'payment' | 'shipment';
    toStatus: string;
    note: LocalizedText;
  }>;
}

export type ServerCreateOrderResult =
  | { ok: true; order: CustomerOrderSafeDTO; isIdempotentReplay?: boolean }
  | {
      ok: false;
      status: number;
      errorCode:
        | 'missing_fields'
        | 'invalid_mobile'
        | 'invalid_governorate'
        | 'empty_cart'
        | 'invalid_quantity'
        | 'variant_unavailable'
        | 'insufficient_stock'
        | 'invalid_coupon'
        | 'coupon_min_subtotal'
        | 'coupon_expired'
        | 'coupon_exhausted'
        | 'invalid_payment_method'
        | 'idempotency_conflict'
        | 'pricing_mismatch'
        | 'database_unavailable'
        | 'server_error';
      message: string;
      itemTitle?: LocalizedText;
      availableStock?: number;
    };

/**
 * Computes an HMAC-SHA256 lookup hash for an order number + mobile combination.
 * Resists timing attacks and prevents sequential database index enumeration.
 * Uses dedicated, high-entropy ORDER_LOOKUP_SECRET; fails closed in production.
 */
export function computeOrderLookupHash(orderNumber: string, normalizedMobile: string): string {
  const secret = getServerLookupSecret();
  return crypto
    .createHmac('sha256', secret)
    .update(`${orderNumber.toUpperCase().trim()}:${normalizedMobile.trim()}`)
    .digest('hex');
}

export interface RequestFingerprintInput {
  customerName: string;
  normalizedMobile: string;
  governorateCode: string;
  cityOrArea: string;
  streetAndBuilding: string;
  landmark?: string | null;
  deliveryNote?: string | null;
  paymentMethod: string;
  paymentTransferReference?: string | null;
  couponCode?: string | null;
  items: Array<{ variantId: string; quantity: number }>;
}

/**
 * Computes a server-side keyed HMAC-SHA256 fingerprint over all order-affecting parameters.
 * Binds the idempotency key strictly to the entire canonical payload.
 * Using a server-side secret prevents offline-guessing or rainbow-table enumeration of PII
 * if database records are inspected, and raw customer data is never stored in the fingerprint.
 */
export function computeRequestFingerprint(input: RequestFingerprintInput): string {
  const secret = getServerLookupSecret();
  const hmacKey = crypto
    .createHmac('sha256', secret)
    .update('labsa_canonical_idempotency_fingerprint_v3')
    .digest();

  const cleanName = (input.customerName || '').trim().toLowerCase();
  const cleanMobile = (input.normalizedMobile || '').trim();
  const cleanGov = (input.governorateCode || '').trim().toLowerCase();
  const cleanCity = (input.cityOrArea || '').trim().toLowerCase();
  const cleanStreet = (input.streetAndBuilding || '').trim().toLowerCase();
  const cleanLandmark = (input.landmark || '').trim().toLowerCase();
  const cleanNote = (input.deliveryNote || '').trim().toLowerCase();
  const cleanPaymentMethod = (input.paymentMethod || '').trim().toLowerCase();
  const cleanPaymentRef = (input.paymentTransferReference || '').trim();
  const cleanCoupon = (input.couponCode || '').trim().toUpperCase();

  // Deterministically sort items by variantId and structure as [variantId, quantity] tuples
  const sortedItems = [...input.items]
    .sort((a, b) => a.variantId.localeCompare(b.variantId))
    .map((i) => [i.variantId.trim(), Math.floor(Number(i.quantity))]);

  // Structured canonical representation: JSON array with fixed primitive and tuple ordering.
  // Escapes all special characters and prevents field delimiter collision vulnerabilities.
  const canonicalStructure = [
    'v3_structured_order_fingerprint',
    cleanName,
    cleanMobile,
    cleanGov,
    cleanCity,
    cleanStreet,
    cleanLandmark,
    cleanNote,
    cleanPaymentMethod,
    cleanPaymentRef,
    cleanCoupon,
    sortedItems,
  ];

  const canonicalJson = JSON.stringify(canonicalStructure);

  return crypto.createHmac('sha256', hmacKey).update(canonicalJson).digest('hex');
}

/**
 * Generates an unpredictable order number (e.g. LAB-2026-XXXXXX)
 */
export function generateOrderNumber(): string {
  const randomSuffix = crypto.randomInt(100000, 999999);
  return `LAB-2026-${randomSuffix}`;
}

/**
 * Generates a high-entropy cryptographically secure customer lookup token.
 */
export function generateCustomerLookupToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}

/**
 * Authoritatively creates an order on the server.
 * Loads catalog data, validates stock and inputs, recalculates pricing, and executes
 * the atomic database transaction via Supabase (or fallback in local development).
 */
export async function createOrderServer(
  input: ServerCreateOrderInput
): Promise<ServerCreateOrderResult> {
  const dbConfig = getServerDatabaseConfig();
  const supabase = getSupabaseAdminClient();

  if (dbConfig.isProduction && !dbConfig.isConfigured) {
    return {
      ok: false,
      status: 503,
      errorCode: 'database_unavailable',
      message: 'Production database configuration is missing or incomplete.',
    };
  }

  // 1. Validate customer details
  if (!input.customer) {
    return { ok: false, status: 400, errorCode: 'missing_fields', message: 'Customer details are required.' };
  }

  const cleanFullName = input.customer.fullName?.trim().slice(0, 100);
  if (!cleanFullName || cleanFullName.length < 2) {
    return { ok: false, status: 400, errorCode: 'missing_fields', message: 'Valid customer name is required.' };
  }

  if (!isValidEgyptianMobile(input.customer.mobileNumber)) {
    return { ok: false, status: 400, errorCode: 'invalid_mobile', message: 'Invalid Egyptian mobile number format.' };
  }
  const normalizedMobile = normalizeEgyptianMobile(input.customer.mobileNumber);

  const govRule = getGovernorateByCode(input.customer.governorateCode);
  if (!govRule) {
    return { ok: false, status: 400, errorCode: 'invalid_governorate', message: 'Invalid Egyptian governorate code.' };
  }

  const cleanCity = input.customer.cityOrArea?.trim().slice(0, 100);
  const cleanStreet = input.customer.streetAndBuilding?.trim().slice(0, 200);
  if (!cleanCity || !cleanStreet) {
    return { ok: false, status: 400, errorCode: 'missing_fields', message: 'City and street address are required.' };
  }

  const cleanLandmark = input.customer.landmark?.trim().slice(0, 150) || null;
  const cleanDeliveryNote = input.customer.deliveryNote?.trim().slice(0, 300) || null;

  // 2. Validate Payment Method
  const validPaymentMethods: PaymentMethodId[] = ['cod', 'manual_wallet', 'manual_instapay'];
  if (!validPaymentMethods.includes(input.paymentMethod)) {
    return { ok: false, status: 400, errorCode: 'invalid_payment_method', message: 'Invalid payment method.' };
  }

  const cleanPaymentRef = input.paymentTransferReference?.trim().slice(0, 100) || null;
  const initialPaymentStatus: PaymentLifecycleStatus =
    input.paymentMethod === 'cod' ? 'unpaid' : 'awaiting_manual_verification';

  // 3. Validate Cart Items & Recalculate Subtotal Server-Side
  if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
    return { ok: false, status: 400, errorCode: 'empty_cart', message: 'Cart items cannot be empty.' };
  }
  if (input.items.length > 50) {
    return { ok: false, status: 400, errorCode: 'invalid_quantity', message: 'Cart exceeds maximum allowed items.' };
  }

  // Load authoritative catalog directly from database (or local demo fallback when permitted)
  let catalogProducts: CatalogProduct[] = [];
  const orderItemsSnapshots: OrderItemSnapshot[] = [];
  const reqItemsForAtomic: Array<{ variantId: string; quantity: number }> = [];

  if (supabase) {
    const productIds = Array.from(new Set(input.items.map((i) => i.productId)));
    const { data: dbProducts, error: prodErr } = await supabase
      .from('products')
      .select('*, product_variants(*)')
      .in('id', productIds);

    if (prodErr || !dbProducts) {
      return {
        ok: false,
        status: 500,
        errorCode: 'database_unavailable',
        message: 'Failed to load catalog records from database.',
      };
    }

    catalogProducts = dbProducts.map((p: any) => ({
      id: p.id,
      slug: p.slug,
      audience: p.audience,
      category: p.category,
      title: { ar: p.title_ar, en: p.title_en },
      shortDescription: { ar: p.short_description_ar, en: p.short_description_en },
      description: { ar: p.description_ar, en: p.description_en },
      priceEgp: p.price_egp,
      previousPriceEgp: p.previous_price_egp || undefined,
      status: p.status,
      isNew: p.is_new,
      isFeatured: p.is_featured,
      featuredRank: p.featured_rank,
      colors: p.colors || [],
      sizes: p.sizes || [],
      images: p.images || [],
      details: p.details || {},
      createdAt: p.created_at || new Date().toISOString(),
      variants: (p.product_variants || []).map((v: any) => ({
        id: v.id,
        sku: v.sku,
        colorKey: v.color_key,
        size: v.size,
        stock: v.stock,
      })),
    }));
  } else if (dbConfig.canUseLocalDemoFallback) {
    catalogProducts = getAllCatalogProducts();
  } else {
    return {
      ok: false,
      status: 503,
      errorCode: 'database_unavailable',
      message: 'Server database is not configured.',
    };
  }

  for (const itemReq of input.items) {
    if (!Number.isSafeInteger(itemReq.quantity) || itemReq.quantity <= 0 || itemReq.quantity > 50) {
      return {
        ok: false,
        status: 400,
        errorCode: 'invalid_quantity',
        message: 'Item quantity must be a positive integer between 1 and 50.',
      };
    }

    const product = catalogProducts.find((p) => p.id === itemReq.productId && p.status !== 'draft');
    if (!product || product.status === 'out_of_stock') {
      return {
        ok: false,
        status: 400,
        errorCode: 'variant_unavailable',
        message: `Product is currently unavailable.`,
        itemTitle: product?.title,
      };
    }

    const variant = product.variants.find((v) => v.id === itemReq.variantId);
    if (!variant) {
      return {
        ok: false,
        status: 400,
        errorCode: 'variant_unavailable',
        message: `Selected variant is unavailable.`,
        itemTitle: product.title,
      };
    }

    const colorObj = product.colors.find((c) => c.key === variant.colorKey) ?? product.colors[0];
    const primaryImg =
      product.images.find((img) => img.colorKey === variant.colorKey) ??
      product.images.find((img) => img.isPrimary) ??
      product.images[0];

    const lineTotalEgp = product.priceEgp * itemReq.quantity;

    orderItemsSnapshots.push({
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
      quantity: itemReq.quantity,
      lineTotalEgp,
      imageUrlSnapshot: primaryImg.url,
    });

    reqItemsForAtomic.push({
      variantId: variant.id,
      quantity: itemReq.quantity,
    });
  }

  const subtotalEgp = orderItemsSnapshots.reduce((sum, item) => sum + item.lineTotalEgp, 0);
  const deliveryFeeEgp = govRule.feeEgp;

  // 4. Server-Side Coupon Recalculation
  let discountEgp = 0;
  let couponCodeClean: string | null = null;
  let couponTitleSnapshot: LocalizedText | null = null;

  if (input.couponCode && input.couponCode.trim().length > 0) {
    couponCodeClean = input.couponCode.trim().toUpperCase().slice(0, 32);

    // If Supabase is connected, we check coupon table; otherwise fallback to seeded coupon validation
    if (supabase) {
      const { data: dbCoupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCodeClean)
        .single();

      if (!dbCoupon || dbCoupon.status !== 'active') {
        return { ok: false, status: 400, errorCode: 'invalid_coupon', message: 'Coupon code is invalid or inactive.' };
      }
      const nowIso = new Date().toISOString();
      if (dbCoupon.starts_at && nowIso < dbCoupon.starts_at) {
        return { ok: false, status: 400, errorCode: 'invalid_coupon', message: 'Coupon has not started yet.' };
      }
      if (dbCoupon.expires_at && nowIso > dbCoupon.expires_at) {
        return { ok: false, status: 400, errorCode: 'coupon_expired', message: 'Coupon has expired.' };
      }
      if (dbCoupon.max_total_uses && dbCoupon.used_count >= dbCoupon.max_total_uses) {
        return { ok: false, status: 400, errorCode: 'coupon_exhausted', message: 'Coupon usage limit has been reached.' };
      }
      if (subtotalEgp < dbCoupon.min_subtotal_egp) {
        return {
          ok: false,
          status: 400,
          errorCode: 'coupon_min_subtotal',
          message: `Cart subtotal must be at least EGP ${dbCoupon.min_subtotal_egp} to use this coupon.`,
        };
      }

      if (dbCoupon.discount_type === 'percentage') {
        const rawDiscount = Math.round((subtotalEgp * dbCoupon.discount_value) / 100);
        discountEgp = dbCoupon.max_discount_egp ? Math.min(rawDiscount, dbCoupon.max_discount_egp) : rawDiscount;
      } else {
        discountEgp = Math.min(dbCoupon.discount_value, subtotalEgp);
      }
      couponTitleSnapshot = { ar: dbCoupon.title_ar, en: dbCoupon.title_en };
    } else {
      // In local dev without live Supabase
      const { validateAndCalculateCoupon } = await import('@/data/coupons');
      const cCheck = validateAndCalculateCoupon(couponCodeClean, subtotalEgp);
      if (!cCheck.valid) {
        return { ok: false, status: 400, errorCode: 'invalid_coupon', message: 'Coupon is not valid.' };
      }
      discountEgp = cCheck.discountEgp;
      couponTitleSnapshot = { ...cCheck.coupon.title };
    }
  }

  const totalEgp = Math.max(0, subtotalEgp - discountEgp + deliveryFeeEgp);
  const orderId = `ord-${crypto.randomUUID().slice(0, 12)}`;
  const orderNumber = generateOrderNumber();
  const customerLookupToken = generateCustomerLookupToken();
  const lookupHash = computeOrderLookupHash(orderNumber, normalizedMobile);
  const cleanIdempotencyKey = input.idempotencyKey?.trim().slice(0, 100) || null;
  const requestFingerprint = computeRequestFingerprint({
    customerName: cleanFullName,
    normalizedMobile,
    governorateCode: govRule.code,
    cityOrArea: cleanCity,
    streetAndBuilding: cleanStreet,
    landmark: cleanLandmark,
    deliveryNote: cleanDeliveryNote,
    paymentMethod: input.paymentMethod,
    paymentTransferReference: cleanPaymentRef,
    couponCode: couponCodeClean,
    items: reqItemsForAtomic,
  });

  // 5. Execute Atomic Database Creation via Supabase
  if (supabase) {
    const { data, error } = await supabase.rpc('create_order_atomic', {
      p_order_id: orderId,
      p_order_number: orderNumber,
      p_idempotency_key: cleanIdempotencyKey,
      p_customer_full_name: cleanFullName,
      p_customer_mobile: input.customer.mobileNumber.trim(),
      p_customer_normalized_mobile: normalizedMobile,
      p_governorate_code: govRule.code,
      p_governorate_name_snapshot: govRule.name,
      p_city_or_area: cleanCity,
      p_street_and_building: cleanStreet,
      p_landmark: cleanLandmark,
      p_delivery_note: cleanDeliveryNote,
      p_items_snapshot: orderItemsSnapshots,
      p_subtotal_egp: subtotalEgp,
      p_delivery_fee_egp: deliveryFeeEgp,
      p_discount_egp: discountEgp,
      p_total_egp: totalEgp,
      p_payment_method: input.paymentMethod,
      p_payment_status: initialPaymentStatus,
      p_payment_transfer_reference: cleanPaymentRef,
      p_coupon_code: couponCodeClean,
      p_coupon_title_snapshot: couponTitleSnapshot,
      p_customer_lookup_token: customerLookupToken,
      p_lookup_hash: lookupHash,
      p_req_items: reqItemsForAtomic,
      p_request_fingerprint: requestFingerprint,
    });

    if (error) {
      const msg = error.message || '';
      if (msg.includes('idempotency_conflict')) {
        return {
          ok: false,
          status: 409,
          errorCode: 'idempotency_conflict',
          message:
            'This idempotency key has already been used with different checkout details. Please try again with a new key.',
        };
      }
      if (msg.includes('pricing_mismatch')) {
        return {
          ok: false,
          status: 409,
          errorCode: 'pricing_mismatch',
          message:
            'Catalog prices or coupon rules have updated. Please review your cart total.',
        };
      }
      if (msg.includes('insufficient_stock')) {
        return {
          ok: false,
          status: 409,
          errorCode: 'insufficient_stock',
          message: 'One or more items are out of stock.',
        };
      }
      if (msg.includes('coupon_exhausted')) {
        return {
          ok: false,
          status: 400,
          errorCode: 'coupon_exhausted',
          message: 'Coupon limit reached.',
        };
      }
      return {
        ok: false,
        status: 500,
        errorCode: 'server_error',
        message: 'Failed to place order in database.',
      };
    }

    const isIdempotentReplay = Boolean(data?.is_idempotent_replay);

    return {
      ok: true,
      isIdempotentReplay,
      order: {
        orderNumber: data.order_number || orderNumber,
        customerLookupToken: data.customer_lookup_token || customerLookupToken,
        createdAt: data.created_at || new Date().toISOString(),
        subtotalEgp: data.subtotal_egp ?? subtotalEgp,
        deliveryFeeEgp: data.delivery_fee_egp ?? deliveryFeeEgp,
        discountEgp: data.discount_egp ?? discountEgp,
        totalEgp: data.total_egp ?? totalEgp,
        paymentMethod: input.paymentMethod,
        paymentStatus: data.payment_status || initialPaymentStatus,
        orderStatus: data.order_status || 'new',
        shipmentStatus: 'not_yet_prepared',
        governorateNameSnapshot: govRule.name,
        customerName: cleanFullName,
        items: orderItemsSnapshots,
        statusHistory: [
          {
            id: 'init',
            timestamp: new Date().toISOString(),
            domain: 'order',
            toStatus: 'new',
            note: {
              ar: 'تم استلام طلبك بنجاح وجارٍ مراجعته.',
              en: 'Your order was received successfully and is awaiting review.',
            },
          },
        ],
      },
    };
  }

  // 6. Local Development Fallback ONLY (When Supabase is not configured locally)
  if (dbConfig.canUseLocalDemoFallback) {
    const { placeDemoOrder } = await import('@/data/orders');
    const demoRes = placeDemoOrder({
      customer: {
        fullName: cleanFullName,
        mobileNumber: input.customer.mobileNumber,
        governorateCode: govRule.code,
        cityOrArea: cleanCity,
        streetAndBuilding: cleanStreet,
        landmark: cleanLandmark || undefined,
        deliveryNote: cleanDeliveryNote || undefined,
      },
      paymentMethod: input.paymentMethod,
      paymentTransferReference: cleanPaymentRef || undefined,
      couponCode: couponCodeClean,
      items: input.items.map((i) => ({
        variantId: i.variantId,
        productId: i.productId,
        quantity: i.quantity,
      })),
    });

    if (!demoRes.ok) {
      return {
        ok: false,
        status: 400,
        errorCode: demoRes.errorCode as any,
        message: 'Order creation failed in local demo storage.',
        itemTitle: demoRes.itemTitle,
        availableStock: demoRes.availableStock,
      };
    }

    return {
      ok: true,
      order: {
        orderNumber: demoRes.order.orderNumber,
        customerLookupToken,
        createdAt: demoRes.order.createdAt,
        subtotalEgp: demoRes.order.pricing.subtotalEgp,
        deliveryFeeEgp: demoRes.order.pricing.deliveryFeeEgp,
        discountEgp: demoRes.order.pricing.discountEgp || 0,
        totalEgp: demoRes.order.pricing.totalEgp,
        paymentMethod: demoRes.order.paymentMethod,
        paymentStatus: demoRes.order.paymentStatus,
        orderStatus: demoRes.order.orderStatus,
        shipmentStatus: demoRes.order.shipmentStatus,
        governorateNameSnapshot: demoRes.order.customer.governorateNameSnapshot,
        customerName: demoRes.order.customer.fullName,
        items: demoRes.order.items,
        statusHistory: demoRes.order.statusHistory.map((h) => ({
          id: h.id,
          timestamp: h.timestamp,
          domain: h.domain,
          toStatus: h.toStatus,
          note: h.note,
        })),
      },
    };
  }

  return {
    ok: false,
    status: 503,
    errorCode: 'database_unavailable',
    message: 'Server database is not configured.',
  };
}

/**
 * Looks up an order safely on the server using Order Number + Mobile verification.
 * Returns only the minimal customer tracking DTO.
 * Protects against enumeration and timing attacks.
 */
export async function lookupOrderSafeServer(
  orderNumberRaw: string,
  mobileRaw: string
): Promise<CustomerOrderSafeDTO | null> {
  const orderNumber = orderNumberRaw.trim().toUpperCase().slice(0, 32);
  const normalizedMobile = normalizeEgyptianMobile(mobileRaw);
  if (!orderNumber || !normalizedMobile) {
    return null;
  }

  const dbConfig = getServerDatabaseConfig();
  const supabase = getSupabaseAdminClient();

  if (supabase) {
    const lookupHash = computeOrderLookupHash(orderNumber, normalizedMobile);

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        customer_lookup_token,
        created_at,
        customer_full_name,
        governorate_name_snapshot,
        items_snapshot,
        subtotal_egp,
        delivery_fee_egp,
        discount_egp,
        total_egp,
        payment_method,
        payment_status,
        order_status,
        shipment_status,
        carrier_name,
        tracking_number,
        latest_customer_tracking_update
      `)
      .eq('lookup_hash', lookupHash)
      .maybeSingle();

    if (error || !order) {
      return null;
    }

    // Load status history (customer-visible only)
    const { data: history } = await supabase
      .from('order_status_history')
      .select('id, created_at, domain, to_status, customer_visible_note')
      .eq('order_id', order.id)
      .order('created_at', { ascending: true });

    return {
      orderNumber: order.order_number,
      customerLookupToken: order.customer_lookup_token || '',
      createdAt: order.created_at,
      subtotalEgp: order.subtotal_egp,
      deliveryFeeEgp: order.delivery_fee_egp,
      discountEgp: order.discount_egp || 0,
      totalEgp: order.total_egp,
      paymentMethod: order.payment_method as PaymentMethodId,
      paymentStatus: order.payment_status as PaymentLifecycleStatus,
      orderStatus: order.order_status as OrderLifecycleStatus,
      shipmentStatus: order.shipment_status as ShipmentLifecycleStatus,
      carrierName: order.carrier_name || undefined,
      trackingNumber: order.tracking_number || undefined,
      latestCustomerTrackingUpdate: order.latest_customer_tracking_update || undefined,
      governorateNameSnapshot: order.governorate_name_snapshot,
      customerName: order.customer_full_name,
      items: order.items_snapshot || [],
      statusHistory: (history || []).map((h) => ({
        id: h.id,
        timestamp: h.created_at,
        domain: h.domain,
        toStatus: h.to_status,
        note: h.customer_visible_note,
      })),
    };
  }

  // Local development fallback
  if (dbConfig.canUseLocalDemoFallback) {
    const { lookupDemoOrderSafe } = await import('@/data/orders');
    const demoFound = lookupDemoOrderSafe(orderNumber, mobileRaw);
    if (!demoFound) return null;

    return {
      orderNumber: demoFound.orderNumber,
      customerLookupToken: '',
      createdAt: demoFound.createdAt,
      subtotalEgp: demoFound.pricing.subtotalEgp,
      deliveryFeeEgp: demoFound.pricing.deliveryFeeEgp,
      discountEgp: demoFound.pricing.discountEgp || 0,
      totalEgp: demoFound.pricing.totalEgp,
      paymentMethod: demoFound.paymentMethod,
      paymentStatus: demoFound.paymentStatus,
      orderStatus: demoFound.orderStatus,
      shipmentStatus: demoFound.shipmentStatus,
      carrierName: demoFound.shipmentTracking?.carrierName,
      trackingNumber: demoFound.shipmentTracking?.trackingNumber,
      latestCustomerTrackingUpdate: demoFound.shipmentTracking?.latestCustomerUpdate,
      governorateNameSnapshot: demoFound.customer.governorateNameSnapshot,
      customerName: demoFound.customer.fullName,
      items: demoFound.items,
      statusHistory: demoFound.statusHistory.map((h) => ({
        id: h.id,
        timestamp: h.timestamp,
        domain: h.domain,
        toStatus: h.toStatus,
        note: h.note,
      })),
    };
  }

  return null;
}
