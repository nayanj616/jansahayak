/**
 * Supabase Browser Client Placeholder
 * Phase 1: Foundation preparation for client-side Supabase interactions.
 */

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // In Phase 1 foundation, environment variables may be placeholders
    console.info(
      '[JanSahayak Supabase] Client initialized with placeholder configuration. Full database connection active in Phase 2.'
    );
  }

  browserClient = createBrowserClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder-publishable-key'
  );

  return browserClient;
}

