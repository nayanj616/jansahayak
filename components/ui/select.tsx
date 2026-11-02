import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean | string;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, disabled, placeholder, children, defaultValue, ...props }, ref) => {
    const isInvalid = Boolean(
      error || props['aria-invalid'] === true || props['aria-invalid'] === 'true'
    );

    return (
      <div className="relative w-full">
        <select
          ref={ref}
          disabled={disabled}
          defaultValue={placeholder && defaultValue === undefined ? '' : defaultValue}
          aria-invalid={isInvalid ? true : undefined}
          className={cn(
            'flex h-10 w-full rounded-lg border bg-white pl-3 pr-9 py-2 text-sm text-slate-900 transition-colors appearance-none cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50',
            isInvalid
              ? 'border-red-500 focus-visible:ring-red-500 text-red-900'
              : 'border-slate-300 focus-visible:ring-civic-600',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="text-slate-400">
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500"
          aria-hidden="true"
        />
      </div>
    );
  }
);
Select.displayName = 'Select';

