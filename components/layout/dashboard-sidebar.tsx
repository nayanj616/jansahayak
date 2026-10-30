'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FilePlus2,
  ClipboardList,
  Search,
  Bot,
  HelpCircle,
  Building,
  CheckCircle2,
  Camera,
  UserCheck,
  MapPin,
  BarChart3,
  BookOpen,
  FileText,
  X,
  LucideIcon,
  ShieldAlert,
} from 'lucide-react';
import { GwaliorMonumentLogo, GwaliorFortSilhouette } from '@/components/shared/gwalior-fort-art';
import type { DemoRole } from '@/types';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  isPhase2?: boolean;
}

const CITIZEN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/citizen', icon: LayoutDashboard },
  { label: 'Report Complaint', href: '/citizen#report', icon: FilePlus2 },
  { label: 'My Complaints', href: '/citizen#complaints', icon: ClipboardList },
  { label: 'Scheme Finder', href: '/scheme-exploration#finder', icon: Search },
  { label: 'AI Assistant', href: '/scheme-exploration#assistant', icon: Bot },
  { label: 'Grievance Help', href: '/scheme-exploration#grievances', icon: HelpCircle },
  { label: 'Civic Services', href: '/scheme-exploration#services', icon: Building },
];

const WORKER_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/worker', icon: LayoutDashboard },
  { label: 'My Assignments', href: '/worker#assignments', icon: ClipboardList },
  { label: 'Update Status', href: '/worker#status', icon: CheckCircle2 },
  { label: 'Upload Photos', href: '/worker#photos', icon: Camera },
  { label: 'My Profile', href: '/worker#profile', icon: UserCheck },
];

const OFFICER_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/officer', icon: LayoutDashboard },
  { label: 'All Complaints', href: '/officer#complaints', icon: ClipboardList },
  { label: 'Assignments', href: '/officer#assignments', icon: UserCheck },
  { label: 'AI Verification', href: '/officer#ai-verification', icon: Bot },
  { label: 'Ward-wise View', href: '/officer#ward-view', icon: MapPin },
  { label: 'Analytics', href: '/officer#analytics', icon: BarChart3 },
  { label: 'Schemes', href: '/scheme-exploration', icon: BookOpen },
  { label: 'Grievances', href: '/scheme-exploration#grievances', icon: FileText },
  { label: 'Civic Services', href: '/scheme-exploration#services', icon: Building },
];

interface DashboardSidebarProps {
  role: DemoRole;
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardSidebar({ role, isOpen, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();

  const navItems =
    role === 'citizen'
      ? CITIZEN_NAV
      : role === 'worker'
        ? WORKER_NAV
        : OFFICER_NAV;

  const portalSubtitle =
    role === 'citizen'
      ? 'Citizen Portal'
      : role === 'worker'
        ? 'Worker Portal'
        : 'Officer Portal';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <Link href="/" className="flex items-center gap-3">
            <GwaliorMonumentLogo className="h-8 w-8 text-amber-700" />
            <div>
              <div className="font-bold text-slate-900 tracking-tight leading-tight">JanSahayak</div>
              <div className="text-xs font-semibold text-blue-700">{portalSubtitle}</div>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isBaseDashboard = item.href === `/${role}`;
            const isActive = isBaseDashboard
              ? pathname === `/${role}`
              : pathname === item.href.split('#')[0];

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-blue-50 text-blue-800 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    isActive ? 'text-blue-700' : 'text-slate-400 group-hover:text-slate-600'
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {item.isPhase2 && (
                  <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    P2
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer with Gwalior Fort Silhouette & Academic Notice */}
        <div className="relative border-t border-slate-100 p-4 bg-slate-50/70 overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 pointer-events-none opacity-10">
            <GwaliorFortSilhouette className="w-full h-16 text-blue-900" />
          </div>
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Demo Mode Active</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Demonstration role session. No verified real employment or identity.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

