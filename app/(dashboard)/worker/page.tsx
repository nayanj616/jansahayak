import * as React from 'react';
import { requireDemoRole } from '@/lib/auth/demo-session';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { WorkerView } from '@/components/dashboards/worker-view';

export const metadata = {
  title: 'Sanitation Worker Dashboard | JanSahayak Gwalior',
  description: 'View assigned complaints, update status, and upload cleanup photos.',
};

export default async function WorkerDashboardPage() {
  // Server-side authorization check: verifies signed session cookie
  const session = await requireDemoRole('worker');

  return (
    <DashboardShell role="worker" userName={session.user.name}>
      <WorkerView session={session} />
    </DashboardShell>
  );
}

