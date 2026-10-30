'use client';

import * as React from 'react';
import { DashboardSidebar } from './dashboard-sidebar';
import { DashboardHeader } from './dashboard-header';
import { AlertBanner } from '@/components/ui/alert-banner';
import type { DemoRole } from '@/types';

interface DashboardShellProps {
  role: DemoRole;
  userName?: string;
  children: React.ReactNode;
}

export function DashboardShell({ role, userName, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50/70 text-slate-900">
      <DashboardSidebar
        role={role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-x-hidden min-w-0">
        <DashboardHeader
          role={role}
          userName={userName}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Demonstration Notice Banner */}
          <AlertBanner
            type="info"
            title="Demonstration Mode — Academic Platform"
            className="mb-2"
          >
            This portal is operating in demonstration role access mode for <strong>{role}</strong>.
            This is an academic evaluation prototype. No real municipal employment, identity
            verification, or official government authority is implied or recorded.
          </AlertBanner>

          {children}
        </main>
      </div>
    </div>
  );
}

