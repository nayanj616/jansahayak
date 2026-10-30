import 'server-only';
import { getDb } from './client';
import type { WardRecord } from '@/types';

/**
 * Retrieves all active administrative wards from the verified `wards` master table.
 */
export async function getAllWards(): Promise<WardRecord[]> {
  const db = getDb();
  const { data, error } = await db
    .from('wards')
    .select('*')
    .eq('is_active', true)
    .order('ward_no', { ascending: true });

  if (error) {
    throw new Error(`[JanSahayak DB] Failed to fetch wards: ${error.message}`);
  }

  return (data || []) as WardRecord[];
}

/**
 * Retrieves a specific ward by its primary key ID (e.g. 'GWL-W-001').
 */
export async function getWardById(wardId: string): Promise<WardRecord | null> {
  const db = getDb();
  const { data, error } = await db
    .from('wards')
    .select('*')
    .eq('ward_id', wardId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as WardRecord;
}

/**
 * Retrieves a specific ward by its numeric number (1-66).
 */
export async function getWardByNumber(wardNo: number): Promise<WardRecord | null> {
  const db = getDb();
  const { data, error } = await db
    .from('wards')
    .select('*')
    .eq('ward_no', wardNo)
    .single();

  if (error || !data) {
    return null;
  }

  return data as WardRecord;
}

