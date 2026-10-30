import * as React from 'react';
import { User, HardHat, Building2 } from 'lucide-react';
import type { DemoRole } from '@/types';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  role: DemoRole;
  showIcon?: boolean;
  className?: string;
  size?: 'sm' | 'default';
}

export function RoleBadge({
  role,
  showIcon = true,
  className,
  size = 'default',
}: RoleBadgeProps) {
  const config = {
    citizen: {
      label: 'Citizen',
      icon: User,
      classes: 'bg-emerald-50 text-emerald-800 border-emerald-200 ring-emerald-500/20',
      avatarBg: 'bg-emerald-600',
    },
    worker: {
      label: 'Sanitation Worker',
      icon: HardHat,
      classes: 'bg-blue-50 text-blue-800 border-blue-200 ring-blue-500/20',
      avatarBg: 'bg-blue-600',
    },
    officer: {
      label: 'Municipal Officer',
      icon: Building2,
      classes: 'bg-purple-50 text-purple-800 border-purple-200 ring-purple-500/20',
      avatarBg: 'bg-purple-700',
    },
  }[role];

  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        config.classes,
        className
      )}
    >
      {showIcon && <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />}
      <span>{config.label}</span>
    </span>
  );
}

