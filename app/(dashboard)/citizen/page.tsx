import * as React from 'react';
import { requireDemoRole } from '@/lib/auth/demo-session';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { CitizenView } from '@/components/dashboards/citizen-view';

export const metadata = {
  title: 'Citizen Dashboard | JanSahayak Gwalior',
  description: 'Report sanitation issues, track complaints, and explore government schemes.',
};

export default async function CitizenDashboardPage() {
  // Server-side authorization check: verifies signed session cookie
  const session = await requireDemoRole('citizen');

  return (
    <DashboardShell role="citizen" userName={session.user.name}>
      <CitizenView session={session} />
    </DashboardShell>
  );
}

