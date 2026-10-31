import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkRateLimit, getVerifiedClientIp } from '@/lib/server/rate-limit';
import {
  ADMIN_SESSION_COOKIE_NAME,
  type AdminAuthStatusResponse,
  type AdminSessionPayload,
  getAdminAuthConfigMode,
  getVerifiedServerAdminSession,
  recordAuthFailure,
  resetAuthRateLimit,
  signAdminSessionToken,
  timingSafeEqualStrings,
} from '@/lib/admin-auth';

export async function GET() {
  const { configMode, canUseStage2LocalDemoFallback } =
    getAdminAuthConfigMode();
  const session = await getVerifiedServerAdminSession();

  const body: AdminAuthStatusResponse = {
    configMode,
    canUseStage2LocalDemoFallback,
    authenticated: Boolean(session),
    session,
  };

  return NextResponse.json(body, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

export async function POST(request: Request) {
  const { configMode, canUseStage2LocalDemoFallback } =
    getAdminAuthConfigMode();

  let body: {
    mode?: 'credentials' | 'local_demo';
    email?: string;
    password?: string;
    demoOperatorLabel?: string;
  } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, errorCode: 'invalid_request' },
      { status: 400 }
    );
  }

  const now = Date.now();
  const expiresAt = now + 1000 * 60 * 60 * 8; // 8 hours

  if (body.mode === 'credentials') {
    if (configMode !== 'configured_credentials') {
      return NextResponse.json(
        { ok: false, errorCode: 'setup_required' },
        { status: 503 }
      );
    }

    // Extract verified client IP from trusted edge proxy headers
    const ipRes = getVerifiedClientIp(request);
    if (!ipRes.ok || !ipRes.ip) {
      return NextResponse.json(
        { ok: false, errorCode: 'untrusted_origin', message: ipRes.message },
        {
          status: 403,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }
    const clientIp = ipRes.ip;

    const rateCheck = await checkRateLimit('admin_auth', clientIp, 5, 60);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { ok: false, errorCode: 'too_many_attempts' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateCheck.resetInSeconds),
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    const configuredEmail = (process.env.ADMIN_EMAIL ?? '').trim();
    const configuredPassword = (process.env.ADMIN_PASSWORD ?? '').trim();
    const submittedEmail = (body.email ?? '').trim();
    const submittedPassword = body.password ?? '';

    if (!submittedEmail || !submittedPassword) {
      return NextResponse.json(
        { ok: false, errorCode: 'missing_credentials' },
        { status: 400 }
      );
    }

    const emailMatches = timingSafeEqualStrings(
      submittedEmail.toLowerCase(),
      configuredEmail.toLowerCase()
    );
    const passwordMatches = timingSafeEqualStrings(
      submittedPassword,
      configuredPassword
    );

    if (!emailMatches || !passwordMatches) {
      recordAuthFailure(clientIp);
      return NextResponse.json(
        { ok: false, errorCode: 'invalid_credentials' },
        { status: 401 }
      );
    }

    resetAuthRateLimit(clientIp);

    const payload: AdminSessionPayload = {
      actorIdentity: configuredEmail,
      authMode: 'configured_credentials',
      issuedAt: now,
      expiresAt,
    };

    const token = signAdminSessionToken(payload);
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    return NextResponse.json({
      ok: true,
      session: payload,
    });
  }

  if (body.mode === 'local_demo') {
    if (
      configMode !== 'local_demo_enabled' &&
      !canUseStage2LocalDemoFallback
    ) {
      return NextResponse.json(
        { ok: false, errorCode: 'local_demo_disabled' },
        { status: 403 }
      );
    }

    const sanitizedOperator = (body.demoOperatorLabel ?? '')
      .trim()
      .replace(/[^a-zA-Z0-9@._-\u0600-\u06FF\s]/g, '')
      .slice(0, 48);

    const payload: AdminSessionPayload = {
      actorIdentity: sanitizedOperator || 'demo-admin@labsa-store.example',
      authMode: 'local_demo',
      issuedAt: now,
      expiresAt,
    };

    const token = signAdminSessionToken(payload);
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    return NextResponse.json({
      ok: true,
      session: payload,
    });
  }

  return NextResponse.json(
    { ok: false, errorCode: 'unsupported_mode' },
    { status: 400 }
  );
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
