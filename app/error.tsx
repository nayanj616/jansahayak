'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('JanSahayak App Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-4 shadow-xs">
        <AlertTriangle className="h-8 w-8" />
      </div>

      <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
        Something went wrong
      </h2>

      <p className="max-w-md text-sm text-slate-600 mb-6 leading-relaxed">
        An unexpected error occurred while processing this civic portal view. You may try again or
        return to the home screen.
      </p>

      {error.message && (
        <pre className="max-w-lg overflow-x-auto rounded-lg bg-slate-100 p-3 text-xs text-red-800 mb-6 text-left border border-slate-200">
          {error.message}
        </pre>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => reset()} variant="default" size="sm" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Try Again
        </Button>
        <Link href="/">
          <Button variant="outline" size="sm" className="gap-2">
            <Home className="h-4 w-4" />
            JanSahayak Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

