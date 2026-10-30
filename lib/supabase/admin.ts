/**
 * Supabase Server-Only Administrative Client Placeholder
 * Phase 1: High-privilege administrative client (service role).
 *
 * IMPORTANT SECURITY RULE:
 * This module is guarded with 'server-only'. It must NEVER be imported
 * into client components or exposed to the browser.
 */

import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient {
  if (adminClient) return adminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!secretKey) {
    console.info(
      '[JanSahayak Supabase Admin] SUPABASE_SECRET_KEY is not defined. Using placeholder for Phase 1 foundation.'
    );
  }

  adminClient = createClient(supabaseUrl, secretKey || 'placeholder-service-role-secret', {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}

