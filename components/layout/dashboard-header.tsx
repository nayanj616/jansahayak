'use client';

import * as React from 'react';
import { Menu } from 'lucide-react';
import { RoleSwitcher } from '@/components/shared/role-switcher';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { NotificationBell } from '@/components/shared/notification-bell';
import { useLanguage } from '@/lib/i18n';
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
  const { t } = useLanguage();

  const greeting =
    role === 'citizen'
      ? t('nav.welcomeCitizen')
      : role === 'worker'
        ? t('nav.welcomeWorker')
        : t('nav.welcomeOfficer');

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-3 sm:px-6 lg:px-8 backdrop-blur-md">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-600 lg:hidden shrink-0"
          aria-label="Open sidebar navigation"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="min-w-0">
          <h2 className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight truncate">
            {greeting}
          </h2>
          <p className="hidden sm:block text-xs text-slate-500 truncate">
            Gwalior Municipal Civic Demonstration
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* LanguageSwitcher visible on both mobile and desktop viewports */}
        <div className="hidden sm:block">
          <LanguageSwitcher />
        </div>
        <div className="sm:hidden">
          <LanguageSwitcher showIcon={false} />
        </div>

        {/* In-App Notification Center */}
        <NotificationBell />

        {/* Active Demo Role Switcher */}
        <RoleSwitcher currentRole={role} userName={userName} />
      </div>
    </header>
  );
}
