import * as React from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertBannerProps {
  type?: 'info' | 'warning' | 'success' | 'destructive';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function AlertBanner({
  type = 'info',
  title,
  children,
  className,
}: AlertBannerProps) {
  const config = {
    info: {
      bg: 'bg-blue-50/80 border-blue-200 text-blue-900',
      icon: <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />,
    },
    warning: {
      bg: 'bg-amber-50/80 border-amber-200 text-amber-900',
      icon: <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />,
    },
    success: {
      bg: 'bg-emerald-50/80 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />,
    },
    destructive: {
      bg: 'bg-red-50/80 border-red-200 text-red-900',
      icon: <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />,
    },
  }[type];

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border p-4 text-sm leading-relaxed shadow-xs',
        config.bg,
        className
      )}
    >
      {config.icon}
      <div className="flex-1">
        {title && <h5 className="font-semibold mb-0.5">{title}</h5>}
        <div className="text-slate-700 text-xs sm:text-sm">{children}</div>
      </div>
    </div>
  );
}

