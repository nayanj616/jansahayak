import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean | string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, disabled, ...props }, ref) => {
    const isInvalid = Boolean(
      error || props['aria-invalid'] === true || props['aria-invalid'] === 'true'
    );

    return (
      <textarea
        ref={ref}
        disabled={disabled}
        aria-invalid={isInvalid ? true : undefined}
        className={cn(
          'flex min-h-[80px] w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 transition-colors',
          'placeholder:text-slate-400',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50',
          isInvalid
            ? 'border-red-500 focus-visible:ring-red-500 text-red-900'
            : 'border-slate-300 focus-visible:ring-civic-600',
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

