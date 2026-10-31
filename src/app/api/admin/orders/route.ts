import { NextResponse } from 'next/server';
import { getVerifiedServerAdminSession } from '@/lib/admin-auth';
import { getSupabaseAdminClient } from '@/lib/server/supabase';
import { getServerDatabaseConfig } from '@/lib/server/env';
import type { DemoOrder } from '@/data/orders';

export async function GET() {
  const session = await getVerifiedServerAdminSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: 'unauthorized', message: 'Admin authentication required.' },
      { status: 401 }
    );
  }

  const dbConfig = getServerDatabaseConfig();
  const supabase = getSupabaseAdminClient();

  if (supabase) {
    const { data: dbOrders, error: ordersErr } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersErr) {
      return NextResponse.json(
        { ok: false, error: 'database_error', message: ordersErr.message },
        { status: 500 }
      );
    }

    const { data: dbHistory, error: histErr } = await supabase
      .from('order_status_history')
      .select('*')
      .order('created_at', { ascending: true });

    if (histErr) {
      return NextResponse.json(
        { ok: false, error: 'database_error', message: histErr.message },
        { status: 500 }
      );
    }

    const historyByOrderId = new Map<string, any[]>();
    for (const h of dbHistory || []) {
      const arr = historyByOrderId.get(h.order_id) || [];
      arr.push({
        id: h.id,
        timestamp: h.created_at,
        domain: h.domain,
        fromStatus: h.from_status,
        toStatus: h.to_status,
        actor: h.actor,
        actorIdentity: h.actor_identity,
        note: h.customer_visible_note,
        internalNote: h.internal_admin_note,
      });
      historyByOrderId.set(h.order_id, arr);
    }

    const orders: DemoOrder[] = (dbOrders || []).map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      createdAt: o.created_at,
      isSeededSample: false,
      customer: {
        fullName: o.customer_full_name,
        mobileNumber: o.customer_mobile,
        normalizedMobile: o.customer_normalized_mobile,
        governorateCode: o.governorate_code,
        governorateNameSnapshot: o.governorate_name_snapshot,
        cityOrArea: o.city_or_area,
        streetAndBuilding: o.street_and_building,
        landmark: o.landmark || undefined,
        deliveryNote: o.delivery_note || undefined,
      },
      items: o.items_snapshot,
      pricing: {
        subtotalEgp: o.subtotal_egp,
        couponCodeSnapshot: o.coupon_code || undefined,
        couponTitleSnapshot: o.coupon_title_snapshot || undefined,
        discountEgp: o.discount_egp || 0,
        deliveryFeeEgp: o.delivery_fee_egp,
        totalEgp: o.total_egp,
      },
      paymentMethod: o.payment_method,
      paymentTransferReference: o.payment_transfer_reference || undefined,
      orderStatus: o.order_status,
      paymentStatus: o.payment_status,
      shipmentStatus: o.shipment_status,
      shipmentTracking: o.carrier_name
        ? {
            carrierName: o.carrier_name,
            trackingNumber: o.tracking_number || '',
            updatedAt: o.updated_at,
            updatedBy: session.actorIdentity,
            latestCustomerUpdate: o.latest_customer_tracking_update || {
              ar: 'جارٍ تجهيز الشحنة',
              en: 'Preparing shipment',
            },
          }
        : undefined,
      statusHistory: historyByOrderId.get(o.id) || [],
    }));

    return NextResponse.json({ ok: true, orders });
  }

  // Local development fallback
  if (dbConfig.canUseLocalDemoFallback) {
    const { readAllDemoOrders } = await import('@/data/orders');
    return NextResponse.json({ ok: true, orders: readAllDemoOrders() });
  }

  return NextResponse.json(
    { ok: false, error: 'database_unavailable' },
    { status: 503 }
  );
}
