'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  Search,
  Bot,
  HelpCircle,
  Building,
  Sparkles,
  FileText,
  BookOpen,
  MapPin,
  X,
  LucideIcon,
  ShieldAlert,
} from 'lucide-react';
import { GwaliorMonumentLogo, GwaliorFortSilhouette } from '@/components/shared/gwalior-fort-art';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import type { DemoRole } from '@/types';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
}

const CITIZEN_NAV: NavItem[] = [
  { label: 'Citizen Dashboard', href: '/citizen', icon: LayoutDashboard },
  { label: 'Swachh Gwalior Portal', href: '/swachh-gwalior', icon: Sparkles },
  { label: 'Welfare Schemes', href: '/scheme-exploration#finder', icon: Search },
  { label: 'Civic AI Assistant', href: '/scheme-exploration#assistant', icon: Bot },
  { label: 'Grievance Guidance', href: '/scheme-exploration#grievances', icon: HelpCircle },
  { label: 'Civic Services Portal', href: '/scheme-exploration#services', icon: Building },
];

const WORKER_NAV: NavItem[] = [
  { label: 'Field Tasks Queue', href: '/worker', icon: ClipboardList },
  { label: 'Swachh Gwalior Guidelines', href: '/swachh-gwalior', icon: FileText },
  { label: 'Worker Welfare Schemes', href: '/scheme-exploration#finder', icon: Search },
  { label: 'Civic AI Assistant', href: '/scheme-exploration#assistant', icon: Bot },
  { label: 'Grievance Guidance', href: '/scheme-exploration#grievances', icon: HelpCircle },
];

const OFFICER_NAV: NavItem[] = [
  { label: 'Command Center', href: '/officer', icon: LayoutDashboard },
  { label: 'Swachh Gwalior Data', href: '/swachh-gwalior', icon: MapPin },
  { label: 'Welfare Schemes', href: '/scheme-exploration#finder', icon: Search },
  { label: 'Grievance Architecture', href: '/scheme-exploration#grievances', icon: FileText },
  { label: 'Civic Services Portal', href: '/scheme-exploration#services', icon: Building },
  { label: 'Platform Architecture', href: '/about', icon: BookOpen },
];

interface DashboardSidebarProps {
  role: DemoRole;
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardSidebar({ role, isOpen, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();

  // Escape key handler to close mobile drawer
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const navItems =
    role === 'citizen'
      ? CITIZEN_NAV
      : role === 'worker'
        ? WORKER_NAV
        : OFFICER_NAV;

  const roleConfig = {
    citizen: {
      portalTitle: 'Citizen Portal',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    worker: {
      portalTitle: 'Field Worker Portal',
      badgeClass: 'bg-civic-50 text-civic-800 border-civic-200',
    },
    officer: {
      portalTitle: 'Officer Command',
      badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    },
  }[role];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="dashboard-sidebar"
        aria-label="Dashboard Navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white shadow-xl lg:shadow-none transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <Link
            href="/"
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-600 rounded-lg p-0.5"
          >
            <GwaliorMonumentLogo className="h-8 w-8 text-amber-700 shrink-0" />
            <div className="min-w-0">
              <div className="font-bold text-slate-900 tracking-tight leading-tight truncate">
                JanSahayak
              </div>
              <span
                className={cn(
                  'inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold border mt-0.5 truncate',
                  roleConfig.badgeClass
                )}
              >
                {roleConfig.portalTitle}
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-600 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Portal Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const targetBase = item.href.split('#')[0];
            const isBaseDashboard = item.href === `/${role}`;

            const isActive = isBaseDashboard
              ? pathname === `/${role}`
              : pathname === targetBase;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-600',
                  isActive
                    ? 'bg-civic-50 text-civic-900 font-semibold shadow-2xs border-l-3 border-civic-700 pl-3'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    isActive ? 'text-civic-700' : 'text-slate-400 group-hover:text-slate-600'
                  )}
                  aria-hidden="true"
                />
                <span className="flex-1 truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile Language Switcher inside Sidebar for small devices */}
        <div className="lg:hidden px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Language / भाषा:</span>
          <LanguageSwitcher />
        </div>

        {/* Sidebar Footer with Gwalior Fort Silhouette & Demonstration Notice */}
        <div className="relative border-t border-slate-100 p-4 bg-slate-50/70 overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 pointer-events-none opacity-10" aria-hidden="true">
            <GwaliorFortSilhouette className="w-full h-16 text-civic-900" />
          </div>
          <div className="relative z-10 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-600 shrink-0" aria-hidden="true" />
              <span>Demo Persona Active</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Demonstration session for {role}. No real-world employment or municipal authority recorded.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
