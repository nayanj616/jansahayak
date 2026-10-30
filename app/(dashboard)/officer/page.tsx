import * as React from 'react';
import { requireDemoRole } from '@/lib/auth/demo-session';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { OfficerView } from '@/components/dashboards/officer-view';

export const metadata = {
  title: 'Municipal Officer Dashboard | JanSahayak Gwalior',
  description: 'Monitor complaints, manage assignments, and review AI verification results.',
};

export default async function OfficerDashboardPage() {
  // Server-side authorization check: verifies signed session cookie
  const session = await requireDemoRole('officer');

  return (
    <DashboardShell role="officer" userName={session.user.name}>
      <OfficerView session={session} />
    </DashboardShell>
  );
}

