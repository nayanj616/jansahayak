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
import { useLanguage } from '@/lib/i18n';

interface RoleSwitcherProps {
  currentRole: DemoRole;
  userName?: string;
}

export function RoleSwitcher({ currentRole, userName }: RoleSwitcherProps) {
  const { t, language } = useLanguage();
  const isHi = language === 'hi';
  let router: ReturnType<typeof useRouter> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    router = useRouter();
  } catch {
    // Safe fallback when rendered in isolated test environments
    router = null;
  }
  const [isOpen, setIsOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const rolesList: {
    role: DemoRole;
    label: string;
    description: string;
    icon: typeof User;
    path: string;
    badgeStyle: string;
  }[] = [
    {
      role: 'citizen',
      label: t('common.roles.citizen') || 'Citizen',
      description: isHi ? 'समस्याएं दर्ज करें और योजनाएं खोजें' : 'Report issues & explore schemes',
      icon: User,
      path: '/citizen',
      badgeStyle: 'text-emerald-800 bg-emerald-100',
    },
    {
      role: 'worker',
      label: t('common.roles.worker') || 'Sanitation Worker',
      description: isHi ? 'आवंटित कार्य देखें और प्रगति अपडेट करें' : 'View assignments & update progress',
      icon: HardHat,
      path: '/worker',
      badgeStyle: 'text-civic-800 bg-civic-100',
    },
    {
      role: 'officer',
      label: t('common.roles.officer') || 'Municipal Officer',
      description: isHi ? 'शिकायतें प्रबंधित करें और सत्यापन करें' : 'Manage complaints & AI verification',
      icon: Building2,
      path: '/officer',
      badgeStyle: 'text-purple-800 bg-purple-100',
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
        router?.push(targetPath);
        router?.refresh();
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
      router?.push('/demo-role');
      router?.refresh();
    } catch (err) {
      console.error('Failed to clear session:', err);
    } finally {
      setIsPending(false);
    }
  };

  const avatarColor =
    currentRole === 'citizen'
      ? 'bg-emerald-700 text-white'
      : currentRole === 'worker'
        ? 'bg-civic-700 text-white'
        : 'bg-purple-700 text-white';

  const avatarInitial = currentRole === 'citizen' ? 'C' : currentRole === 'worker' ? 'W' : 'O';

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 shadow-2xs hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-600 transition-all cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Current demo role: ${currentRoleConfig.label}. Click to switch role.`}
      >
        <span
          className={cn(
            'flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-xs font-bold shadow-xs shrink-0',
            avatarColor
          )}
          aria-hidden="true"
        >
          {avatarInitial}
        </span>
        <span className="capitalize text-slate-800 font-semibold truncate max-w-[90px] sm:max-w-none">
          {currentRoleConfig.label}
        </span>
        <ChevronDown
          className={cn('h-3.5 w-3.5 text-slate-400 transition-transform duration-200 shrink-0', {
            'rotate-180': isOpen,
          })}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] origin-top-right rounded-xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95">
          <div className="px-3 py-2 border-b border-slate-100 mb-1">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              {isHi ? 'सक्रिय प्रदर्शन भूमिका' : 'Active Demonstration Role'}
            </p>
            <p className="text-sm font-semibold text-slate-900 truncate">
              {userName || currentRoleConfig.label}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {isHi ? 'अन्य डैशबोर्ड देखने हेतु भूमिका बदलें:' : 'Switch role to preview other dashboards:'}
            </p>
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
                    'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-600',
                    isCurrent
                      ? 'bg-civic-50 text-civic-950 font-semibold'
                      : 'hover:bg-slate-100 text-slate-700'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full text-xs shrink-0',
                        item.badgeStyle
                      )}
                      aria-hidden="true"
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium text-xs sm:text-sm text-slate-900 truncate">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal truncate">
                        {item.description}
                      </div>
                    </div>
                  </div>
                  {isCurrent && <Check className="h-4 w-4 text-civic-700 shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          <div className="mt-2 border-t border-slate-100 pt-1 space-y-0.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router?.push('/demo-role');
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-600"
            >
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              {isHi ? 'भूमिका चयन केंद्र' : 'Role Selection Hub'}
            </button>
            <button
              type="button"
              onClick={handleClearSession}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-600 hover:bg-red-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            >
              <LogOut className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
              {isHi ? 'प्रदर्शन सत्र से बाहर निकलें' : 'Exit Demonstration Session'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
