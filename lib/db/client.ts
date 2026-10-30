import 'server-only';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Returns the privileged Supabase administrative client.
 * Guarded with 'server-only' to protect SUPABASE_SECRET_KEY.
 */
export function getDb(): SupabaseClient {
  return getSupabaseAdminClient();
}

