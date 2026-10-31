import * as React from 'react';
import { requireDemoRole } from '@/lib/auth/demo-session';
import { getAllWards } from '@/lib/db/wards';
import { getSanitationWorkers } from '@/lib/db/users';
import { getComplaintsWithDetails } from '@/lib/db/complaints';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { OfficerView } from '@/components/dashboards/officer-view';
import type { ComplaintWithDetails, DemoUserRecord, WardRecord } from '@/types';

export const metadata = {
  title: 'Municipal Officer Dashboard | JanSahayak Gwalior',
  description: 'Monitor complaints, manage worker assignments, and execute cleanup verification reviews.',
};

export default async function OfficerDashboardPage() {
  // 1. Server-side authorization check: verifies signed session cookie and officer role
  const session = await requireDemoRole('officer');

  // 2. Concurrently fetch wards, available sanitation workers, and initial complaints
  // Note: Mass signed URL generation is avoided here to optimize page load across all city complaints (Requirement D).
  // Fresh signed URLs are generated on-demand when complaint details are inspected.
  let wards: WardRecord[] = [];
  let workers: DemoUserRecord[] = [];
  let initialComplaints: ComplaintWithDetails[] = [];

  try {
    const [fetchedWards, fetchedWorkers, fetchedComplaints] = await Promise.all([
      getAllWards(),
      getSanitationWorkers(),
      getComplaintsWithDetails(),
    ]);

    wards = fetchedWards;
    workers = fetchedWorkers;
    initialComplaints = fetchedComplaints;
  } catch (error) {
    console.error('[OfficerDashboardPage] Data prefetching error:', error);
  }

  return (
    <DashboardShell role="officer" userName={session.user.name}>
      <OfficerView
        session={session}
        initialComplaints={initialComplaints}
        wards={wards}
        workers={workers}
      />
    </DashboardShell>
  );
}
