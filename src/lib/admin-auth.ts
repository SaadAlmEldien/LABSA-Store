import crypto from 'crypto';
import { cookies } from 'next/headers';

export const ADMIN_SESSION_COOKIE_NAME = 'labsa_admin_session';

export type AdminAuthConfigMode =
  | 'configured_credentials'
  | 'local_demo_enabled'
  | 'setup_required';

export interface AdminSessionPayload {
  actorIdentity: string;
  authMode: 'configured_credentials' | 'local_demo';
  issuedAt: number;
  expiresAt: number;
}

export interface AdminAuthStatusResponse {
  configMode: AdminAuthConfigMode;
  canUseStage2LocalDemoFallback: boolean;
  authenticated: boolean;
  session: AdminSessionPayload | null;
}

function getEnvTrimmed(key: string): string {
  const val = process.env[key];
  return typeof val === 'string' ? val.trim() : '';
}

/**
 * Determines the current server-side admin authentication configuration state
 * strictly from environment variables (never hardcoded credentials).
 */
export function getAdminAuthConfigMode(): {
  configMode: AdminAuthConfigMode;
  canUseStage2LocalDemoFallback: boolean;
} {
  const isProd = process.env.NODE_ENV === 'production';
  const adminEmail = getEnvTrimmed('ADMIN_EMAIL');
  const adminPassword = getEnvTrimmed('ADMIN_PASSWORD');
  const sessionSecret = getEnvTrimmed('ADMIN_SESSION_SECRET');

  if (
    adminEmail.length > 0 &&
    adminPassword.length > 0 &&
    sessionSecret.length >= 16
  ) {
    return {
      configMode: 'configured_credentials',
      canUseStage2LocalDemoFallback: false,
    };
  }

  // In production, unauthenticated demo access is strictly disabled (fails closed).
  // Production ALWAYS requires configured credentials (ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_SESSION_SECRET).
  if (isProd) {
    return {
      configMode: 'setup_required',
      canUseStage2LocalDemoFallback: false,
    };
  }

  const allowLocalDemo =
    getEnvTrimmed('ALLOW_LOCAL_DEMO_ADMIN').toLowerCase() === 'true';

  if (allowLocalDemo) {
    return {
      configMode: 'local_demo_enabled',
      canUseStage2LocalDemoFallback: true,
    };
  }

  // Local development fallback: enabled only in development when NEXT_PUBLIC_DEMO_MODE is explicitly true
  const isDemoStoreEnabled =
    getEnvTrimmed('NEXT_PUBLIC_DEMO_MODE').toLowerCase() === 'true';

  return {
    configMode: 'setup_required',
    canUseStage2LocalDemoFallback: isDemoStoreEnabled,
  };
}

/**
 * Returns a per-process ephemeral signing key when ADMIN_SESSION_SECRET is not set
 * in `.env.local` so that local demo sessions can still be cryptographically
 * signed and verified by the server without any hardcoded secret in source code.
 */
const globalForAdminKey = globalThis as unknown as {
  __labsaEphemeralSigningKey?: string;
};

function getServerSigningKey(): string {
  const configured = getEnvTrimmed('ADMIN_SESSION_SECRET');
  if (configured.length >= 16) {
    return configured;
  }
  if (!globalForAdminKey.__labsaEphemeralSigningKey) {
    globalForAdminKey.__labsaEphemeralSigningKey = crypto
      .randomBytes(32)
      .toString('hex');
  }
  return globalForAdminKey.__labsaEphemeralSigningKey;
}

/**
 * Timing-safe string comparison on the server.
 */
export function timingSafeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    // Compare against itself to keep constant-time characteristics before returning false
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export function signAdminSessionToken(payload: AdminSessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload), 'utf8').toString(
    'base64url'
  );
  const signature = crypto
    .createHmac('sha256', getServerSigningKey())
    .update(data)
    .digest('base64url');
  return `${data}.${signature}`;
}

export function verifyAdminSessionToken(
  token: string | undefined
): AdminSessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const [data, signature] = token.split('.');
  if (!data || !signature) return null;

  const expectedSig = crypto
    .createHmac('sha256', getServerSigningKey())
    .update(data)
    .digest('base64url');

  if (!timingSafeEqualStrings(signature, expectedSig)) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(data, 'base64url').toString('utf8')
    ) as AdminSessionPayload;
    if (
      !decoded ||
      typeof decoded.actorIdentity !== 'string' ||
      typeof decoded.expiresAt !== 'number'
    ) {
      return null;
    }
    if (Date.now() > decoded.expiresAt) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export async function getVerifiedServerAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  return verifyAdminSessionToken(rawToken);
}

// -----------------------------------------------------------------------------
// In-Memory Authentication Rate Limiter (Brute-Force & Credential Stuffing Defense)
// -----------------------------------------------------------------------------

interface RateLimitRecord {
  attempts: number;
  resetAt: number;
}

const MAX_RATE_LIMIT_ENTRIES = 1000;
const authRateLimits = new Map<string, RateLimitRecord>();

function pruneExpiredRateLimits(now: number): void {
  for (const [key, record] of authRateLimits.entries()) {
    if (now > record.resetAt) {
      authRateLimits.delete(key);
    }
  }
  // Evict oldest entries if map exceeds maximum capacity
  if (authRateLimits.size > MAX_RATE_LIMIT_ENTRIES) {
    const excess = authRateLimits.size - MAX_RATE_LIMIT_ENTRIES;
    const keys = Array.from(authRateLimits.keys()).slice(0, excess);
    for (const k of keys) {
      authRateLimits.delete(k);
    }
  }
}

/**
 * Checks sliding-window rate limit for authentication attempts.
 * Enforces a maximum of 5 failed attempts per client identifier in a 60-second window.
 */
export function checkAuthRateLimit(clientIp: string): {
  allowed: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxAttempts = 5;

  const record = authRateLimits.get(clientIp);
  if (!record || now > record.resetAt) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (record.attempts >= maxAttempts) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(1, retryAfter) };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function recordAuthFailure(clientIp: string): void {
  const now = Date.now();
  const windowMs = 60 * 1000;

  pruneExpiredRateLimits(now);

  const record = authRateLimits.get(clientIp);
  if (!record || now > record.resetAt) {
    authRateLimits.set(clientIp, { attempts: 1, resetAt: now + windowMs });
  } else {
    record.attempts += 1;
  }
}

export function resetAuthRateLimit(clientIp: string): void {
  authRateLimits.delete(clientIp);
}
