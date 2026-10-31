import { NextResponse } from 'next/server';
import { checkRateLimit, getVerifiedClientIp } from '@/lib/server/rate-limit';
import { createOrderServer, type ServerCreateOrderInput } from '@/lib/server/orders';
import { validateProductionStartup } from '@/lib/server/env';

export async function POST(request: Request) {
  // Enforce mandatory production security startup boundaries
  const startupCheck = validateProductionStartup();
  if (!startupCheck.valid) {
    return NextResponse.json(
      {
        ok: false,
        errorCode: 'server_configuration_error',
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
        errorCode: 'untrusted_origin',
        message: ipRes.message || 'Request did not arrive through a verified proxy.',
      },
      {
        status: 403,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }

  const rateLimit = await checkRateLimit('order_create', ipRes.ip, 10, 60); // 10 orders per minute per IP

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        errorCode: 'rate_limited',
        message: 'Too many order requests. Please try again shortly.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.resetInSeconds),
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  let body: ServerCreateOrderInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, errorCode: 'invalid_json', message: 'Malformed JSON payload.' },
      { status: 400 }
    );
  }

  // Idempotency Key from header or body
  const headerIdempotencyKey = request.headers.get('Idempotency-Key');
  if (headerIdempotencyKey && !body.idempotencyKey) {
    body.idempotencyKey = headerIdempotencyKey;
  }

  const result = await createOrderServer(body);

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        errorCode: result.errorCode,
        message: result.message,
        itemTitle: result.itemTitle,
        availableStock: result.availableStock,
      },
      { status: result.status }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      order: result.order,
      isIdempotentReplay: result.isIdempotentReplay,
    },
    { status: 201 }
  );
}
