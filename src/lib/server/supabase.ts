/**
 * LABSA Store — Server-Side Supabase Client
 * Restricted exclusively to server-side APIs and server actions.
 * Employs the service role key strictly for privileged server operations (atomic order creation,
 * admin mutations, and rate-limited lookups).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServerDatabaseConfig } from './env';

if (typeof window !== 'undefined') {
  throw new Error('src/lib/server/supabase.ts must only be loaded on the server.');
}

let cachedAdminClient: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient | null {
  const config = getServerDatabaseConfig();
  if (!config.isConfigured) {
    return null;
  }

  if (!cachedAdminClient) {
    cachedAdminClient = createClient(config.supabaseUrl, config.serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return cachedAdminClient;
}
