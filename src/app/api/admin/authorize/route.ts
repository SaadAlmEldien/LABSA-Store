import { NextResponse } from 'next/server';
import { getVerifiedServerAdminSession } from '@/lib/admin-auth';

/**
 * Explicit allowlist of verified administrative action identifiers used across
 * AdminOrdersSection, AdminProductsSection, AdminCouponsSection, and AdminReviewsSection.
 *
 * NOTE: This endpoint confirms the presence of an authenticated administrative session
 * before the browser performs updates to local demo storage. It does NOT execute
 * server-side database mutations.
 */
const ALLOWED_ADMIN_ACTIONS = new Set<string>([
  'order_payment',
  'order_order',
  'order_shipment',
  'save_catalog_product',
  'toggle_product_archive',
  'reset_catalog_seed',
  'coupon_save',
  'coupon_status_change',
  'review_approved',
  'review_rejected',
]);

export async function POST(request: Request) {
  const session = await getVerifiedServerAdminSession();

  if (!session) {
    return NextResponse.json(
      {
        authorized: false,
        errorCode: 'unauthorized_admin_session',
      },
      { status: 401 }
    );
  }

  let body: { actionType?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        authorized: false,
        errorCode: 'invalid_payload',
      },
      { status: 400 }
    );
  }

  if (
    !body.actionType ||
    typeof body.actionType !== 'string' ||
    !ALLOWED_ADMIN_ACTIONS.has(body.actionType)
  ) {
    return NextResponse.json(
      {
        authorized: false,
        errorCode: 'invalid_action_type',
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    authorized: true,
    actorIdentity: session.actorIdentity,
    authMode: session.authMode,
    serverTimestamp: new Date().toISOString(),
  });
}
