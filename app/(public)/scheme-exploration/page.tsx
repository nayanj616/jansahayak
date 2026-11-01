'use client';

import * as React from 'react';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { SchemeSupportShell } from '@/components/scheme-exploration/scheme-support-shell';

export default function SchemeExplorationPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50 text-slate-900 w-full overflow-x-hidden">
      <PublicHeader />

      <main className="flex-1 py-6 sm:py-12 w-full max-w-full">
        <div className="mx-auto max-w-6xl px-3 sm:px-6 lg:px-8 w-full max-w-full">
          <SchemeSupportShell />
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
