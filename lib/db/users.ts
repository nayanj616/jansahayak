import 'server-only';
import { getDb } from './client';
import { DEMO_PROFILES, DEMO_USER_IDS } from '@/lib/auth/tokens';
import type { DemoRole, DemoUserRecord, DemoUserRole } from '@/types';

/**
 * Idempotently ensures that the 3 canonical demonstration personas exist
 * in the live `demo_users` table with their assigned UUIDs and ward mappings.
 */
export async function ensureDemoUsers(): Promise<DemoUserRecord[]> {
  const db = getDb();

  const personas = [
    {
      id: DEMO_USER_IDS.citizen,
      display_name: DEMO_PROFILES.citizen.name,
      role: 'citizen',
      ward_id: 'GWL-W-024', // Maharaj Bada / Lashkar area
      is_active: true,
    },
    {
      id: DEMO_USER_IDS.worker,
      display_name: DEMO_PROFILES.worker.name,
      role: 'worker',
      ward_id: 'GWL-W-012', // Morar area
      is_active: true,
    },
    {
      id: DEMO_USER_IDS.officer,
      display_name: DEMO_PROFILES.officer.name,
      role: 'officer',
      ward_id: null, // City-wide administration
      is_active: true,
    },
  ];

  const { data, error } = await db
    .from('demo_users')
    .upsert(personas, { onConflict: 'id' })
    .select('*');

  if (error) {
    throw new Error(`[JanSahayak DB] Failed to ensure demo users: ${error.message}`);
  }

  return (data || []) as DemoUserRecord[];
}

/**
 * Retrieves a demo user by UUID.
 */
export async function getDemoUserById(id: string): Promise<DemoUserRecord | null> {
  const db = getDb();
  const { data, error } = await db
    .from('demo_users')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as DemoUserRecord;
}

/**
 * Retrieves demo users by role.
 */
export async function getDemoUsersByRole(role: DemoUserRole): Promise<DemoUserRecord[]> {
  const db = getDb();
  const { data, error } = await db
    .from('demo_users')
    .select('*')
    .eq('role', role)
    .eq('is_active', true)
    .order('display_name', { ascending: true });

  if (error) {
    throw new Error(`[JanSahayak DB] Failed to fetch users for role ${role}: ${error.message}`);
  }

  return (data || []) as DemoUserRecord[];
}

/**
 * Retrieves all active sanitation field workers available for task allocation.
 */
export async function getSanitationWorkers(): Promise<DemoUserRecord[]> {
  return getDemoUsersByRole('worker');
}

/**
 * Resolves the database UUID for a given demo role, ensuring the record exists.
 */
export async function resolveDemoUserId(role: DemoRole): Promise<string> {
  const expectedId = DEMO_USER_IDS[role];
  const existing = await getDemoUserById(expectedId);
  if (existing) {
    return existing.id;
  }

  // If not yet present, run idempotent initialization
  await ensureDemoUsers();
  return expectedId;
}

