import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-blue-100 text-blue-800 border border-blue-200',
        secondary: 'border-transparent bg-slate-100 text-slate-800 border border-slate-200',
        outline: 'text-slate-800 border border-slate-300',
        success: 'border-transparent bg-emerald-100 text-emerald-800 border border-emerald-200',
        warning: 'border-transparent bg-amber-100 text-amber-800 border border-amber-200',
        destructive: 'border-transparent bg-red-100 text-red-800 border border-red-200',
        purple: 'border-transparent bg-purple-100 text-purple-800 border border-purple-200',
        civic: 'border-transparent bg-blue-900 text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

