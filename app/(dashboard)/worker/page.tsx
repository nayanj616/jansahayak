import * as React from 'react';
import { requireDemoRole } from '@/lib/auth/demo-session';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { WorkerView } from '@/components/dashboards/worker-view';
import { getWorkerAssignments } from '@/lib/db/assignments';
import { attachSignedUrlsToAssignments } from '@/lib/storage';
import { resolveDemoUserId } from '@/lib/db/users';
import type { AssignmentWithDetails } from '@/types';

export const metadata = {
  title: 'Sanitation Worker Dashboard | JanSahayak Gwalior',
  description: 'View assigned complaints, update status, and upload cleanup photos.',
};

export default async function WorkerDashboardPage() {
  // Server-side authorization check: verifies signed session cookie & worker role
  const session = await requireDemoRole('worker');

  let initialTasks: AssignmentWithDetails[] = [];
  try {
    const workerId =
      session.user.dbUserId || (await resolveDemoUserId('worker'));
    const rawAssignments = await getWorkerAssignments(workerId);
    initialTasks = await attachSignedUrlsToAssignments(rawAssignments);
  } catch (error) {
    console.error('[Worker Dashboard Page] Failed to fetch initial worker tasks:', error);
  }

  return (
    <DashboardShell role="worker" userName={session.user.name}>
      <WorkerView session={session} initialTasks={initialTasks} />
    </DashboardShell>
  );
}
