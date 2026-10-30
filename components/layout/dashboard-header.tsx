'use client';

import * as React from 'react';
import { Menu } from 'lucide-react';
import { RoleSwitcher } from '@/components/shared/role-switcher';
import type { DemoRole } from '@/types';

interface DashboardHeaderProps {
  role: DemoRole;
  userName?: string;
  onOpenSidebar: () => void;
}

export function DashboardHeader({
  role,
  userName,
  onOpenSidebar,
}: DashboardHeaderProps) {
  const greeting =
    role === 'citizen'
      ? 'Welcome, Citizen'
      : role === 'worker'
        ? 'Welcome, Worker'
        : 'Welcome, Officer';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {greeting}
          </h2>
          <p className="hidden sm:block text-xs text-slate-500">
            Gwalior Municipal Civic Demonstration
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <RoleSwitcher currentRole={role} userName={userName} />
      </div>
    </header>
  );
}

