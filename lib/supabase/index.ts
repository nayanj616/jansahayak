export { getSupabaseBrowserClient } from './client';
export { getSupabaseServerClient } from './server';
// Note: getSupabaseAdminClient is intentionally in './admin' (server-only)
// to prevent accidental bundling in client components.

