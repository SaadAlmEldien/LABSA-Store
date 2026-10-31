import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/server/supabase';
import { getServerDatabaseConfig, validateProductionStartup } from '@/lib/server/env';
import type { CustomerOrderSafeDTO } from '@/lib/server/orders';
import type { PaymentLifecycleStatus, PaymentMethodId } from '@/data/payments';
import type { OrderLifecycleStatus, ShipmentLifecycleStatus } from '@/data/orders';

/**
 * Loads order confirmation details using a bearer customer lookup token.
 * Receives the token exclusively in the POST request body to ensure it is never
 * exposed in URL query strings, server access logs, browser history, or Referer headers.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber: orderNumberRaw } = await params;
  const orderNumber = orderNumberRaw.trim().toUpperCase().slice(0, 32);

  const startupCheck = validateProductionStartup();
  if (!startupCheck.valid) {
    return NextResponse.json(
      { ok: false, error: 'server_configuration_error', message: 'Server configuration error.' },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Referrer-Policy': 'no-referrer',
        },
      }
    );
  }

  let body: { token?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid_json', message: 'Malformed JSON payload.' },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Referrer-Policy': 'no-referrer',
        },
      }
    );
  }

  const token = (body.token ?? '').trim();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: 'unauthorized', message: 'Order lookup token required in request body.' },
      {
        status: 401,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Referrer-Policy': 'no-referrer',
        },
      }
    );
  }

  const dbConfig = getServerDatabaseConfig();
  const supabase = getSupabaseAdminClient();

  if (supabase) {
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
      .eq('order_number', orderNumber)
      .eq('customer_lookup_token', token)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json(
        { ok: false, error: 'not_found', message: 'Order not found or invalid lookup token.' },
        {
          status: 404,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Referrer-Policy': 'no-referrer',
          },
        }
      );
    }

    const dto: CustomerOrderSafeDTO = {
      orderNumber: order.order_number,
      customerLookupToken: '', // Redacted from response body to prevent re-exposure
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
      statusHistory: [],
    };

    return NextResponse.json(
      { ok: true, order: dto },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Referrer-Policy': 'no-referrer',
        },
      }
    );
  }

  // Local development fallback
  if (dbConfig.canUseLocalDemoFallback) {
    const { getDemoOrderByNumber, sanitizeOrderForCustomer } = await import('@/data/orders');
    const raw = getDemoOrderByNumber(orderNumber);
    if (!raw) {
      return NextResponse.json(
        { ok: false, error: 'not_found' },
        {
          status: 404,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Referrer-Policy': 'no-referrer',
          },
        }
      );
    }
    const sanitized = sanitizeOrderForCustomer(raw);
    return NextResponse.json(
      { ok: true, order: sanitized },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Referrer-Policy': 'no-referrer',
        },
      }
    );
  }

  return NextResponse.json(
    { ok: false, error: 'database_unavailable' },
    {
      status: 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Referrer-Policy': 'no-referrer',
      },
    }
  );
}

/**
 * Rejects GET requests to prevent bearer lookup tokens from ever appearing in URL query strings.
 */
export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: 'method_not_allowed',
      message: 'Confirmation tokens must be submitted via POST request body to prevent URL leakage.',
    },
    {
      status: 405,
      headers: {
        Allow: 'POST',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Referrer-Policy': 'no-referrer',
      },
    }
  );
}
