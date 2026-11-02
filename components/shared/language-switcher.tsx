'use client';

import * as React from 'react';
import { useLanguage } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
  showIcon?: boolean;
}

export function LanguageSwitcher({
  className,
  showIcon = true,
}: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Language selector / भाषा चयन"
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100/80 p-0.5 text-xs font-medium shadow-2xs transition-colors shrink-0',
        className
      )}
    >
      {showIcon && (
        <Globe
          className="ml-1.5 sm:ml-2 h-3.5 w-3.5 text-slate-500 shrink-0"
          aria-hidden="true"
        />
      )}
      <button
        type="button"
        onClick={() => setLanguage('en')}
        aria-pressed={language === 'en'}
        className={cn(
          'rounded-full px-2.5 py-1 text-xs transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-600 shrink-0',
          language === 'en'
            ? 'bg-white font-semibold text-civic-800 shadow-xs'
            : 'text-slate-600 hover:text-slate-900'
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('hi')}
        aria-pressed={language === 'hi'}
        className={cn(
          'rounded-full px-2.5 py-1 text-xs transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-600 shrink-0 font-devanagari',
          language === 'hi'
            ? 'bg-civic-700 font-semibold text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900'
        )}
      >
        हिन्दी
      </button>
    </div>
  );
}
