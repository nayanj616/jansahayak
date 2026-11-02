import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        // Lifecycle Complaint Status Variants
        submitted: 'border-transparent bg-sky-50 text-sky-800 border border-sky-200',
        assigned: 'border-transparent bg-indigo-50 text-indigo-800 border border-indigo-200',
        in_progress: 'border-transparent bg-amber-50 text-amber-800 border border-amber-200',
        under_review: 'border-transparent bg-purple-50 text-purple-800 border border-purple-200',
        resolved: 'border-transparent bg-emerald-50 text-emerald-800 border border-emerald-200',
        rework_required: 'border-transparent bg-rose-50 text-rose-800 border border-rose-200',
        rejected: 'border-transparent bg-slate-100 text-slate-700 border border-slate-300',
        neutral: 'border-transparent bg-slate-100 text-slate-800 border border-slate-200',

        // General Design System & Legacy Variants
        default: 'border-transparent bg-civic-100 text-civic-800 border border-civic-200',
        secondary: 'border-transparent bg-slate-100 text-slate-800 border border-slate-200',
        outline: 'text-slate-800 border border-slate-300 bg-white',
        success: 'border-transparent bg-emerald-100 text-emerald-800 border border-emerald-200',
        warning: 'border-transparent bg-amber-100 text-amber-800 border border-amber-200',
        destructive: 'border-transparent bg-red-100 text-red-800 border border-red-200',
        purple: 'border-transparent bg-purple-100 text-purple-800 border border-purple-200',
        civic: 'border-transparent bg-civic-900 text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const STATUS_VARIANTS = new Set([
  'submitted',
  'assigned',
  'in_progress',
  'under_review',
  'resolved',
  'rework_required',
  'rejected',
]);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({
  className,
  variant = 'default',
  dot,
  children,
  role,
  ...props
}: BadgeProps) {
  const isStatus = variant ? STATUS_VARIANTS.has(variant) : false;
  const showDot = dot !== undefined ? dot : isStatus;

  return (
    <div
      role={role ?? (isStatus ? 'status' : undefined)}
      data-status={isStatus ? variant : undefined}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {showDot && (
        <span
          className="inline-block h-1.5 w-1.5 rounded-full shrink-0 bg-current opacity-85"
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}
