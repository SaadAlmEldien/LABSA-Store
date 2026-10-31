import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getVerifiedServerAdminSession } from '@/lib/admin-auth';
import { getSupabaseAdminClient } from '@/lib/server/supabase';
import { getServerDatabaseConfig } from '@/lib/server/env';
import type { OrderLifecycleStatus, ShipmentLifecycleStatus } from '@/data/orders';
import type { PaymentLifecycleStatus } from '@/data/payments';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getVerifiedServerAdminSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: 'unauthorized', message: 'Admin authentication required.' },
      { status: 401 }
    );
  }

  const { orderId } = await params;
  let body: {
    domain: 'order' | 'payment' | 'shipment';
    toStatus: string;
    customerNoteAr?: string;
    customerNoteEn?: string;
    internalNote?: string;
    carrierName?: string;
    trackingNumber?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid_json', message: 'Malformed JSON payload.' },
      { status: 400 }
    );
  }

  const { domain, toStatus, customerNoteAr, customerNoteEn, internalNote, carrierName, trackingNumber } = body;
  if (!domain || !toStatus) {
    return NextResponse.json(
      { ok: false, error: 'missing_fields', message: 'domain and toStatus are required.' },
      { status: 400 }
    );
  }

  const dbConfig = getServerDatabaseConfig();
  const supabase = getSupabaseAdminClient();
  const nowIso = new Date().toISOString();

  if (supabase) {
    // 1. Fetch current order
    const { data: currentOrder, error: fetchErr } = await supabase
      .from('orders')
      .select('id, order_status, payment_status, shipment_status')
      .eq('id', orderId)
      .single();

    if (fetchErr || !currentOrder) {
      return NextResponse.json(
        { ok: false, error: 'not_found', message: 'Order not found.' },
        { status: 404 }
      );
    }

    const fromStatus =
      domain === 'order'
        ? currentOrder.order_status
        : domain === 'payment'
          ? currentOrder.payment_status
          : currentOrder.shipment_status;

    // 2. Prepare order update payload
    const updatePayload: Record<string, any> = {
      updated_at: nowIso,
    };

    if (domain === 'order') {
      updatePayload.order_status = toStatus as OrderLifecycleStatus;
    } else if (domain === 'payment') {
      updatePayload.payment_status = toStatus as PaymentLifecycleStatus;
    } else if (domain === 'shipment') {
      updatePayload.shipment_status = toStatus as ShipmentLifecycleStatus;
      if (carrierName) updatePayload.carrier_name = carrierName.trim().slice(0, 80);
      if (trackingNumber) updatePayload.tracking_number = trackingNumber.trim().slice(0, 100);
      if (customerNoteAr || customerNoteEn) {
        updatePayload.latest_customer_tracking_update = {
          ar: customerNoteAr || 'تم تحديث حالة الشحن',
          en: customerNoteEn || 'Shipment status updated',
        };
      }
    }

    const { error: updateErr } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId);

    if (updateErr) {
      return NextResponse.json(
        { ok: false, error: 'update_failed', message: updateErr.message },
        { status: 500 }
      );
    }

    // 3. Insert audit history record with authenticated admin identity
    const histId = `hist-${crypto.randomUUID().slice(0, 12)}`;
    await supabase.from('order_status_history').insert({
      id: histId,
      order_id: orderId,
      created_at: nowIso,
      domain,
      from_status: fromStatus,
      to_status: toStatus,
      actor: 'admin',
      actor_identity: session.actorIdentity,
      customer_visible_note: {
        ar: customerNoteAr || 'تم تحديث حالة الطلب من قبل الإدارة.',
        en: customerNoteEn || 'Order status updated by administration.',
      },
      internal_admin_note: internalNote ? internalNote.trim().slice(0, 500) : null,
    });

    return NextResponse.json({
      ok: true,
      updatedAt: nowIso,
      actorIdentity: session.actorIdentity,
    });
  }

  // Local development fallback
  if (dbConfig.canUseLocalDemoFallback) {
    const {
      adminUpdateOrderStatus,
      adminUpdatePaymentStatus,
      adminUpdateShipmentAndTracking,
    } = await import('@/data/orders');

    let result: { ok: boolean; errorCode?: string } = { ok: false };
    if (domain === 'order') {
      result = adminUpdateOrderStatus({
        orderId,
        newOrderStatus: toStatus as OrderLifecycleStatus,
        customerNote: {
          ar: customerNoteAr || 'تم تحديث الحالة',
          en: customerNoteEn || 'Status updated',
        },
        internalNote,
        actorIdentity: session.actorIdentity,
        timestamp: nowIso,
      });
    } else if (domain === 'payment') {
      result = adminUpdatePaymentStatus({
        orderId,
        newPaymentStatus: toStatus as PaymentLifecycleStatus,
        customerNote: {
          ar: customerNoteAr || 'تم تحديث حالة الدفع',
          en: customerNoteEn || 'Payment status updated',
        },
        internalNote,
        actorIdentity: session.actorIdentity,
        timestamp: nowIso,
      });
    } else if (domain === 'shipment') {
      result = adminUpdateShipmentAndTracking({
        orderId,
        newShipmentStatus: toStatus as ShipmentLifecycleStatus,
        carrierName: carrierName || 'Aramex Egypt',
        trackingNumber: trackingNumber || 'ARX-DEMO',
        customerTrackingUpdate: {
          ar: customerNoteAr || 'تم تحديث الشحن',
          en: customerNoteEn || 'Shipment updated',
        },
        internalNote,
        actorIdentity: session.actorIdentity,
        timestamp: nowIso,
      });
    }

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.errorCode || 'not_found' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      updatedAt: nowIso,
      actorIdentity: session.actorIdentity,
    });
  }

  return NextResponse.json(
    { ok: false, error: 'database_unavailable' },
    { status: 503 }
  );
}
