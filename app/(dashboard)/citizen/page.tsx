import * as React from 'react';
import { requireDemoRole } from '@/lib/auth/demo-session';
import { resolveDemoUserId } from '@/lib/db/users';
import { getAllWards } from '@/lib/db/wards';
import { getComplaintsWithDetails } from '@/lib/db/complaints';
import { attachSignedUrlsToComplaints } from '@/lib/storage';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { CitizenView } from '@/components/dashboards/citizen-view';
import type { ComplaintWithDetails, WardRecord } from '@/types';

export const metadata = {
  title: 'Citizen Dashboard | JanSahayak Gwalior',
  description: 'Report sanitation issues, track complaints, and explore government schemes.',
};

export default async function CitizenDashboardPage() {
  // 1. Server-side authorization check: verifies signed session cookie and citizen role
  const session = await requireDemoRole('citizen');

  // 2. Resolve database UUID for citizen persona
  const reporterId = session.user.dbUserId || (await resolveDemoUserId('citizen'));

  // 3. Fetch verified Gwalior wards from database for the complaint form
  let wards: WardRecord[] = [];
  try {
    wards = await getAllWards();
  } catch (error) {
    console.error('[CitizenDashboardPage] Error fetching wards:', error);
  }

  // 4. Fetch initial complaints with joined details and private signed URLs
  let initialComplaints: ComplaintWithDetails[] = [];
  try {
    const rawComplaints = await getComplaintsWithDetails({ reporterId });
    initialComplaints = await attachSignedUrlsToComplaints(rawComplaints);
  } catch (error) {
    console.error('[CitizenDashboardPage] Error fetching complaints:', error);
  }

  return (
    <DashboardShell role="citizen" userName={session.user.name}>
      <CitizenView
        session={session}
        initialComplaints={initialComplaints}
        wards={wards}
      />
    </DashboardShell>
  );
}
