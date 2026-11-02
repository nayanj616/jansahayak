import * as React from 'react';
import { cn } from '@/lib/utils';

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading content"
      className={cn(
        'rounded-md bg-slate-200/80 animate-pulse motion-reduce:animate-none',
        className
      )}
      {...props}
    />
  );
}
