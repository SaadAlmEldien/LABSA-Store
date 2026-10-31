import { NextResponse } from 'next/server';
import { checkRateLimit, getVerifiedClientIp } from '@/lib/server/rate-limit';
import { lookupOrderSafeServer } from '@/lib/server/orders';
import { validateProductionStartup } from '@/lib/server/env';

export async function POST(request: Request) {
  const startupCheck = validateProductionStartup();
  if (!startupCheck.valid) {
    return NextResponse.json(
      {
        ok: false,
        error: 'server_configuration_error',
        message: 'Server security configuration is incomplete.',
      },
      { status: 503 }
    );
  }

  const ipRes = getVerifiedClientIp(request);
  if (!ipRes.ok || !ipRes.ip) {
    return NextResponse.json(
      {
        ok: false,
        error: 'untrusted_origin',
        message: ipRes.message || 'Request did not arrive through a verified proxy.',
      },
      {
        status: 403,
        headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
      }
    );
  }

  const rateLimit = await checkRateLimit('order_lookup', ipRes.ip, 15, 60); // 15 lookups per minute per IP

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: 'rate_limited',
        message: 'Too many lookup requests. Please wait before trying again.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.resetInSeconds),
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Referrer-Policy': 'no-referrer',
        },
      }
    );
  }

  let body: { orderNumber?: string; mobileNumber?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid_json', message: 'Malformed JSON payload.' },
      {
        status: 400,
        headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
      }
    );
  }

  const { orderNumber, mobileNumber } = body;
  if (!orderNumber || !mobileNumber) {
    return NextResponse.json(
      { ok: false, error: 'missing_fields', message: 'Order number and mobile number are required.' },
      {
        status: 400,
        headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
      }
    );
  }

  const order = await lookupOrderSafeServer(orderNumber, mobileNumber);

  // Return consistent 404 for non-existent order OR mismatched phone number
  // Prevents enumeration attacks
  if (!order) {
    return NextResponse.json(
      {
        ok: false,
        error: 'order_not_found',
        message: 'No order matching the provided reference and mobile number was found.',
      },
      {
        status: 404,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Referrer-Policy': 'no-referrer',
        },
      }
    );
  }

  return NextResponse.json(
    { ok: true, order },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Referrer-Policy': 'no-referrer',
      },
    }
  );
}
