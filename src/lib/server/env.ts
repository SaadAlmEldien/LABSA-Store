/**
 * LABSA Store — Server Environment Configuration & Startup Validator
 * Enforces strict production fail-closed boundaries.
 * NEVER prints or leaks secret values in error messages or logs.
 */

if (typeof window !== 'undefined') {
  throw new Error('src/lib/server/env.ts must only be loaded on the server.');
}

export interface ServerDatabaseConfig {
  isConfigured: boolean;
  supabaseUrl: string;
  serviceRoleKey: string;
  missingVariables: string[];
  isProduction: boolean;
  canUseLocalDemoFallback: boolean;
}

function getEnvTrimmed(key: string): string {
  const val = process.env[key];
  return typeof val === 'string' ? val.trim() : '';
}

/**
 * Returns database configuration and checks whether production is ready.
 * In production (`NODE_ENV === 'production'`), demo fallback is strictly forbidden.
 */
export function getServerDatabaseConfig(): ServerDatabaseConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  const supabaseUrl = getEnvTrimmed('SUPABASE_URL') || getEnvTrimmed('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = getEnvTrimmed('SUPABASE_SERVICE_ROLE_KEY');

  const missingVariables: string[] = [];
  if (!supabaseUrl) missingVariables.push('SUPABASE_URL');
  if (!serviceRoleKey) missingVariables.push('SUPABASE_SERVICE_ROLE_KEY');

  const isConfigured = missingVariables.length === 0;

  // In production, fallback to local storage or fake DB is strictly forbidden (fails closed)
  const canUseLocalDemoFallback =
    !isProduction &&
    (process.env.ALLOW_LOCAL_DEMO_STORE === 'true' ||
      process.env.NEXT_PUBLIC_DEMO_MODE === 'true');

  return {
    isConfigured,
    supabaseUrl,
    serviceRoleKey,
    missingVariables,
    isProduction,
    canUseLocalDemoFallback,
  };
}

/**
 * Validates mandatory production settings and secret entropy.
 * Returns { valid: true } or { valid: false, missing: string[] } without disclosing secret values.
 */
export function validateProductionStartup(): {
  valid: boolean;
  missing: string[];
} {
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    return { valid: true, missing: [] };
  }

  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD',
    'ADMIN_SESSION_SECRET',
    'ORDER_LOOKUP_SECRET',
    'TRUSTED_PROXY_PROVIDER',
  ];

  const missing: string[] = [];
  for (const key of required) {
    if (key === 'SUPABASE_URL') {
      const url = getEnvTrimmed('SUPABASE_URL') || getEnvTrimmed('NEXT_PUBLIC_SUPABASE_URL');
      if (!url) missing.push('SUPABASE_URL');
    } else {
      const val = getEnvTrimmed(key);
      if (!val) {
        missing.push(key);
      }
    }
  }

  const trustedProxy = getEnvTrimmed('TRUSTED_PROXY_PROVIDER').toLowerCase();
  const validProxies = ['cloudflare', 'vercel', 'nginx', 'aws_alb'];
  if (trustedProxy && !validProxies.includes(trustedProxy)) {
    missing.push('TRUSTED_PROXY_PROVIDER_INVALID (must be one of: cloudflare, vercel, nginx, aws_alb)');
  }

  const rateBackend = getEnvTrimmed('RATE_LIMIT_BACKEND').toLowerCase();
  if (rateBackend && !['database', 'edge_delegated'].includes(rateBackend)) {
    missing.push('RATE_LIMIT_BACKEND_INVALID (must be "database" or "edge_delegated" in production)');
  }

  const adminSecret = getEnvTrimmed('ADMIN_SESSION_SECRET');
  if (adminSecret && adminSecret.length < 32) {
    missing.push('ADMIN_SESSION_SECRET_INSUFFICIENT_ENTROPY');
  }

  const lookupSecret = getEnvTrimmed('ORDER_LOOKUP_SECRET');
  if (lookupSecret && lookupSecret.length < 32) {
    missing.push('ORDER_LOOKUP_SECRET_INSUFFICIENT_ENTROPY');
  }

  if (adminSecret && lookupSecret && adminSecret === lookupSecret) {
    missing.push('ORDER_LOOKUP_SECRET_MUST_BE_DISTINCT_FROM_ADMIN_SECRET');
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Returns the dedicated, high-entropy secret for order lookup hashes.
 * Fails closed in production if missing or insufficient.
 * Never silently substitutes ADMIN_SESSION_SECRET or a hard-coded fallback.
 */
export function getServerLookupSecret(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const secret = getEnvTrimmed('ORDER_LOOKUP_SECRET');

  if (!secret) {
    if (isProduction) {
      throw new Error('CRITICAL_SECURITY_ERROR: ORDER_LOOKUP_SECRET is not configured.');
    }
    const devFallbackAllowed =
      process.env.ALLOW_LOCAL_DEMO_STORE === 'true' ||
      process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    if (!devFallbackAllowed) {
      throw new Error(
        'CRITICAL_SECURITY_ERROR: ORDER_LOOKUP_SECRET is missing and local demo mode is not enabled.'
      );
    }
    return 'dev_ephemeral_order_lookup_salt_local_dev_only_never_in_production';
  }

  if (isProduction && secret.length < 32) {
    throw new Error(
      'CRITICAL_SECURITY_ERROR: ORDER_LOOKUP_SECRET must have at least 32 characters of entropy.'
    );
  }

  return secret;
}
