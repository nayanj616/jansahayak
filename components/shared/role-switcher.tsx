'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  User,
  HardHat,
  Building2,
  LogOut,
  ExternalLink,
  Check,
} from 'lucide-react';
import type { DemoRole } from '@/types';
import { cn } from '@/lib/utils';

interface RoleSwitcherProps {
  currentRole: DemoRole;
  userName?: string;
}

export function RoleSwitcher({ currentRole, userName }: RoleSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const rolesList: {
    role: DemoRole;
    label: string;
    description: string;
    icon: typeof User;
    path: string;
    color: string;
  }[] = [
    {
      role: 'citizen',
      label: 'Citizen',
      description: 'Report issues & explore schemes',
      icon: User,
      path: '/citizen',
      color: 'text-emerald-700 bg-emerald-100',
    },
    {
      role: 'worker',
      label: 'Sanitation Worker',
      description: 'View assignments & update progress',
      icon: HardHat,
      path: '/worker',
      color: 'text-blue-700 bg-blue-100',
    },
    {
      role: 'officer',
      label: 'Municipal Officer',
      description: 'Manage complaints & AI verification',
      icon: Building2,
      path: '/officer',
      color: 'text-purple-700 bg-purple-100',
    },
  ];

  const currentRoleConfig = rolesList.find((r) => r.role === currentRole) || rolesList[0];

  const handleSwitchRole = async (targetRole: DemoRole, targetPath: string) => {
    if (targetRole === currentRole) {
      setIsOpen(false);
      return;
    }

    try {
      setIsPending(true);
      const res = await fetch('/api/demo-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole, redirectUrl: targetPath }),
      });

      if (res.ok) {
        setIsOpen(false);
        router.push(targetPath);
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to switch demo role:', err);
    } finally {
      setIsPending(false);
    }
  };

  const handleClearSession = async () => {
    try {
      setIsPending(true);
      await fetch('/api/demo-session', { method: 'DELETE' });
      setIsOpen(false);
      router.push('/demo-role');
      router.refresh();
    } catch (err) {
      console.error('Failed to clear session:', err);
    } finally {
      setIsPending(false);
    }
  };

  const avatarColor =
    currentRole === 'citizen'
      ? 'bg-emerald-600 text-white'
      : currentRole === 'worker'
        ? 'bg-blue-600 text-white'
        : 'bg-purple-700 text-white';

  const avatarInitial = currentRole === 'citizen' ? 'C' : currentRole === 'worker' ? 'W' : 'O';

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-2xs hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all cursor-pointer"
        aria-expanded={isOpen}
      >
        <span
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow-xs',
            avatarColor
          )}
        >
          {avatarInitial}
        </span>
        <span className="capitalize text-slate-800 font-semibold">{currentRoleConfig.label}</span>
        <ChevronDown
          className={cn('h-4 w-4 text-slate-400 transition-transform duration-200', {
            'rotate-180': isOpen,
          })}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-72 origin-top-right rounded-xl border border-slate-200 bg-white p-2 shadow-lg ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95">
          <div className="px-3 py-2 border-b border-slate-100 mb-1">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Active Demonstration Role
            </p>
            <p className="text-sm font-semibold text-slate-900 truncate">
              {userName || currentRoleConfig.label}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Switch role to preview other dashboards:</p>
          </div>

          <div className="space-y-1">
            {rolesList.map((item) => {
              const Icon = item.icon;
              const isCurrent = item.role === currentRole;
              return (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => handleSwitchRole(item.role, item.path)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors cursor-pointer',
                    isCurrent
                      ? 'bg-blue-50 text-blue-900 font-semibold'
                      : 'hover:bg-slate-100 text-slate-700'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full text-xs',
                        item.color
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <div className="font-medium text-xs sm:text-sm">{item.label}</div>
                      <div className="text-[11px] text-slate-400 font-normal">
                        {item.description}
                      </div>
                    </div>
                  </div>
                  {isCurrent && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="mt-2 border-t border-slate-100 pt-1 space-y-0.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push('/demo-role');
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              Role Selection Hub
            </button>
            <button
              type="button"
              onClick={handleClearSession}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-600 hover:bg-red-50 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 text-red-500" />
              Exit Demonstration Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

