/**
 * LABSA Store — Server-Side Rate Limiter & Verified Client IP Resolver
 *
 * Implements:
 * 1. Provider-Specific Trusted IP Verification: Rejects spoofable proxy headers
 *    unless explicitly configured for the deployment environment.
 * 2. Shared Multi-Instance Rate Limiting: Uses Supabase PostgreSQL atomic RPC
 *    (or Edge WAF delegation) in production to prevent per-instance bypass.
 * 3. In-memory rate limiting strictly isolated to local development.
 */

import { isIP } from 'node:net';
import { getSupabaseAdminClient } from './supabase';

if (typeof window !== 'undefined') {
  throw new Error('src/lib/server/rate-limit.ts must only be loaded on the server.');
}

export type TrustedProxyProvider =
  | 'cloudflare'
  | 'vercel'
  | 'nginx'
  | 'aws_alb'
  | 'local_development';

export type RateLimitBackend = 'database' | 'edge_delegated' | 'local_memory';

export interface VerifiedIpResult {
  ok: boolean;
  ip?: string;
  errorCode?:
    | 'missing_proxy_config'
    | 'untrusted_origin_access'
    | 'missing_ip_header'
    | 'malformed_ip_header';
  message?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
  delegated?: boolean;
  delegatedProvider?: string;
}

/**
 * Validates that an extracted IP string is a syntactically valid IPv4 or IPv6 address.
 * Never allows arbitrary header strings, path characters, or query parameters through.
 */
function sanitizeIpCandidate(candidate: string | null | undefined): string | null {
  if (!candidate) return null;
  const trimmed = candidate.trim();
  // isIP returns 4 for IPv4, 6 for IPv6, 0 for invalid
  if (isIP(trimmed) === 0) {
    return null;
  }
  return trimmed.slice(0, 45);
}

// -----------------------------------------------------------------------------
// 1. Verified Client IP Extraction
// -----------------------------------------------------------------------------

/**
 * Extracts a verified client IP according to the explicitly configured proxy provider.
 * Never treats proxy headers as trustworthy merely because they are present.
 * Direct-to-origin requests that bypass the configured proxy fail closed.
 */
export function getVerifiedClientIp(request: Request): VerifiedIpResult {
  const isProduction = process.env.NODE_ENV === 'production';
  const provider = (process.env.TRUSTED_PROXY_PROVIDER ?? '').trim().toLowerCase() as TrustedProxyProvider;

  // In local development, allow fallback to local loopback or client headers
  if (!isProduction && (!provider || provider === 'local_development')) {
    const rawIp =
      request.headers.get('x-real-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      '127.0.0.1';
    return { ok: true, ip: rawIp.slice(0, 45) };
  }

  // In production, TRUSTED_PROXY_PROVIDER is mandatory
  if (!provider) {
    return {
      ok: false,
      errorCode: 'missing_proxy_config',
      message: 'TRUSTED_PROXY_PROVIDER is not configured on the server.',
    };
  }

  switch (provider) {
    case 'cloudflare': {
      // Cloudflare overwrites CF-Connecting-IP at edge network.
      // Origin must reject requests lacking this header (requires Authenticated Origin Pulls).
      const cfIp = sanitizeIpCandidate(request.headers.get('cf-connecting-ip'));
      if (!cfIp) {
        return {
          ok: false,
          errorCode: 'untrusted_origin_access',
          message: 'Direct origin access detected; CF-Connecting-IP header is missing or malformed.',
        };
      }
      return { ok: true, ip: cfIp };
    }

    case 'vercel': {
      // Vercel documents x-real-ip as the client IP and overwrites X-Forwarded-For.
      // Do not trust an undocumented x-vercel-ip request header that may be spoofed.
      const rawVercel = request.headers.get('x-real-ip');
      const vercelIp = sanitizeIpCandidate(rawVercel);
      if (!vercelIp) {
        return {
          ok: false,
          errorCode: 'missing_ip_header',
          message: 'Vercel edge IP header is missing or malformed.',
        };
      }
      return { ok: true, ip: vercelIp };
    }

    case 'nginx': {
      // Nginx reverse proxy MUST set: proxy_set_header X-Real-IP $remote_addr;
      const realIp = sanitizeIpCandidate(request.headers.get('x-real-ip'));
      if (!realIp) {
        return {
          ok: false,
          errorCode: 'missing_ip_header',
          message: 'Nginx X-Real-IP header is missing or malformed.',
        };
      }
      return { ok: true, ip: realIp };
    }

    case 'aws_alb': {
      // AWS ALB Proxy Chain & Header Behavior:
      // In a standard single-hop deployment (Client -> AWS ALB -> Origin),
      // the ALB automatically appends the connecting client's IP to the end of the X-Forwarded-For list.
      // If an untrusted client supplied X-Forwarded-For: 1.2.3.4, ALB produces: "1.2.3.4, <actual_client_ip>".
      // Blindly reading parts[0] permits clients to spoof their address.
      // The trusted connecting address is therefore at depth 1 from the right: parts[parts.length - depth].
      //
      // Origin Access Protection:
      // Merely checking for X-Forwarded-For does not prove the request traversed the ALB.
      // In production, the origin must enforce origin authentication via:
      // a) AWS_ALB_SHARED_SECRET: Verified against X-Alb-Secret or X-Custom-Secret header injected by ALB listener rule.
      // b) AWS_ALB_PRIVATE_VPC_ENFORCED=true: Explicit certification that origin is network-isolated in a private VPC.
      if (isProduction) {
        const requiredSecret = process.env.AWS_ALB_SHARED_SECRET?.trim();
        const vpcEnforced = process.env.AWS_ALB_PRIVATE_VPC_ENFORCED?.trim().toLowerCase() === 'true';

        if (requiredSecret) {
          const incomingSecret =
            request.headers.get('x-alb-secret')?.trim() ||
            request.headers.get('x-custom-secret')?.trim();
          if (!incomingSecret || incomingSecret !== requiredSecret) {
            return {
              ok: false,
              errorCode: 'untrusted_origin_access',
              message: 'Direct origin access detected; invalid or missing ALB origin secret.',
            };
          }
        } else if (!vpcEnforced) {
          return {
            ok: false,
            errorCode: 'missing_proxy_config',
            message:
              'AWS ALB origin protection unconfigured. Set AWS_ALB_SHARED_SECRET or confirm AWS_ALB_PRIVATE_VPC_ENFORCED=true.',
          };
        }
      }

      const xff = request.headers.get('x-forwarded-for')?.trim();
      if (!xff) {
        return {
          ok: false,
          errorCode: 'missing_ip_header',
          message: 'AWS ALB X-Forwarded-For header missing.',
        };
      }

      const parts = xff.split(',').map((p) => p.trim()).filter(Boolean);
      // Configurable proxy depth from the right (default: 1, i.e. rightmost IP appended by ALB)
      const rawDepth = Number(process.env.TRUSTED_PROXY_DEPTH);
      const depth = Number.isInteger(rawDepth) && rawDepth >= 1 ? rawDepth : 1;

      if (parts.length < depth) {
        return {
          ok: false,
          errorCode: 'malformed_ip_header',
          message: `X-Forwarded-For contains fewer hops (${parts.length}) than configured TRUSTED_PROXY_DEPTH (${depth}).`,
        };
      }

      const rawClientIp = parts[parts.length - depth];
      const validIp = sanitizeIpCandidate(rawClientIp);
      if (!validIp) {
        return {
          ok: false,
          errorCode: 'malformed_ip_header',
          message: 'Extracted ALB client IP is not a valid IPv4 or IPv6 address.',
        };
      }

      return { ok: true, ip: validIp };
    }

    default:
      return {
        ok: false,
        errorCode: 'missing_proxy_config',
        message: `Unsupported TRUSTED_PROXY_PROVIDER: "${provider}".`,
      };
  }
}

// -----------------------------------------------------------------------------
// 2. In-Memory Limiter (Local Development Only)
// -----------------------------------------------------------------------------

interface LocalBucket {
  count: number;
  resetAt: number;
}

const MAX_LOCAL_BUCKETS = 1000;
const localBuckets = new Map<string, LocalBucket>();

function pruneExpiredLocalBuckets(now: number) {
  for (const [key, record] of localBuckets.entries()) {
    if (record.resetAt <= now) {
      localBuckets.delete(key);
    }
  }
  if (localBuckets.size > MAX_LOCAL_BUCKETS) {
    const oldestKey = localBuckets.keys().next().value;
    if (oldestKey) localBuckets.delete(oldestKey);
  }
}

function checkLocalRateLimit(
  namespace: string,
  identifier: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  pruneExpiredLocalBuckets(now);

  const key = `${namespace}:${identifier}`;
  const existing = localBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    localBuckets.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetInSeconds: windowSeconds,
    };
  }

  if (existing.count >= limit) {
    const resetInSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
    };
  }

  existing.count += 1;
  const resetInSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetInSeconds,
  };
}

// -----------------------------------------------------------------------------
// 3. Shared & Multi-Instance Rate Limiter
// -----------------------------------------------------------------------------

/**
 * Checks and increments rate limit for an action and client identifier.
 * - In production: uses shared atomic Supabase RPC `check_rate_limit` (or verifies Edge WAF delegation).
 * - In local development: uses bounded in-memory Map.
 */
export async function checkRateLimit(
  namespace: string,
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const isProduction = process.env.NODE_ENV === 'production';
  const backend = (process.env.RATE_LIMIT_BACKEND ?? '').trim().toLowerCase() as RateLimitBackend;

  // 1. Edge-delegated mode (Cloudflare WAF Rate Limiting or Vercel Edge Firewall)
  // DEPLOYMENT CONTRACT:
  // Edge delegation may ONLY be enabled after external platform firewall rules have been
  // created, verified in provider telemetry, and explicitly attested via:
  // - EDGE_RATE_LIMIT_ATTESTED="true"
  // - EDGE_RATE_LIMIT_PROVIDER="cloudflare_waf" | "vercel_firewall" | "aws_waf"
  //
  // Evidence operator must verify before setting EDGE_RATE_LIMIT_ATTESTED="true":
  // 1. Rule configuration in provider dashboard (e.g. Cloudflare Security > WAF > Rate Limiting).
  // 2. Rule scope: matching URI paths /api/orders and /api/orders/lookup.
  // 3. Threshold: configured to allowable limit (e.g. 10 requests / 60 seconds).
  // 4. Verification test: send curl burst and confirm edge firewall blocks with HTTP 429.
  //
  // If unattested, this code refuses to silently bypass limits and falls back to the database backend.
  if (backend === 'edge_delegated') {
    const isAttested = process.env.EDGE_RATE_LIMIT_ATTESTED?.trim().toLowerCase() === 'true';
    const delegatedProvider = process.env.EDGE_RATE_LIMIT_PROVIDER?.trim().toLowerCase();

    if (isAttested && delegatedProvider) {
      // Return explicit delegation metadata: the application did not count this locally,
      // relying on the verified edge firewall.
      return {
        allowed: true,
        remaining: limit,
        resetInSeconds: windowSeconds,
        delegated: true,
        delegatedProvider,
      };
    }

    // Unverified edge delegation cannot be trusted to enforce limits.
    // Fall back to shared database rate limiter if available; otherwise fail closed in production.
    if (!isProduction) {
      return checkLocalRateLimit(namespace, identifier, limit, windowSeconds);
    }

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const key = `${namespace}:${identifier}`;
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_key: key,
        p_limit: limit,
        p_window_seconds: windowSeconds,
      });

      if (!error && data && typeof data.allowed === 'boolean') {
        return {
          allowed: Boolean(data.allowed),
          remaining: typeof data.remaining === 'number' ? data.remaining : 0,
          resetInSeconds:
            typeof data.reset_in_seconds === 'number' ? data.reset_in_seconds : windowSeconds,
        };
      }
    }

    // Fail closed in production when edge delegation is unverified and database backend is unavailable
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: windowSeconds,
    };
  }

  // 2. Shared database limiter (Supabase PostgreSQL atomic RPC)
  if (backend === 'database' || (isProduction && !backend)) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const key = `${namespace}:${identifier}`;
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_key: key,
        p_limit: limit,
        p_window_seconds: windowSeconds,
      });

      if (!error && data && typeof data.allowed === 'boolean') {
        return {
          allowed: Boolean(data.allowed),
          remaining: typeof data.remaining === 'number' ? data.remaining : 0,
          resetInSeconds: typeof data.reset_in_seconds === 'number' ? data.reset_in_seconds : windowSeconds,
        };
      }
    }

    // In production, fail closed if shared database limiter is unavailable
    if (isProduction) {
      return {
        allowed: false,
        remaining: 0,
        resetInSeconds: windowSeconds,
      };
    }
  }

  // 3. In-memory limiter strictly for local development
  if (!isProduction) {
    return checkLocalRateLimit(namespace, identifier, limit, windowSeconds);
  }

  // If in production and no valid backend was configured, fail closed
  return {
    allowed: false,
    remaining: 0,
    resetInSeconds: windowSeconds,
  };
}

/**
 * Backward-compatible helper.
 */
export const getClientIp = (req: Request) => {
  const res = getVerifiedClientIp(req);
  return res.ok && res.ip ? res.ip : 'unknown_client';
};
