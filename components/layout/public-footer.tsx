import * as React from 'react';
import Link from 'next/link';
import { GwaliorFortSilhouette, GwaliorMonumentLogo } from '@/components/shared/gwalior-fort-art';
import { ShieldAlert } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="relative overflow-hidden bg-slate-900 text-slate-300">
      {/* Decorative Gwalior Fort Silhouette in background */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none opacity-15">
        <GwaliorFortSilhouette className="w-full h-32 text-blue-300" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 pb-8 border-b border-slate-800">
          {/* Brand Info */}
          <div className="md:col-span-6 space-y-3">
            <div className="flex items-center gap-3">
              <GwaliorMonumentLogo className="h-8 w-8 text-amber-500" />
              <div>
                <h3 className="text-xl font-bold tracking-tight text-white">JanSahayak</h3>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  Gwalior, Madhya Pradesh
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              An academic demonstration project for an integrated civic assistance platform.
              Bridging citizen sanitation grievance resolution, field worker empowerment, and
              welfare scheme discoverability for Gwalior.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-2 rounded-md bg-blue-950/70 border border-blue-800/60 px-3 py-1 text-xs text-blue-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Phase 3: Operational Grievance Workflows (Demo)
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Core Modules
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/swachh-gwalior"
                  className="hover:text-white transition-colors"
                >
                  Swachh Gwalior Sanitation
                </Link>
              </li>
              <li>
                <Link
                  href="/scheme-exploration"
                  className="hover:text-white transition-colors"
                >
                  Scheme Exploration & Guidance
                </Link>
              </li>
              <li>
                <Link
                  href="/demo-role"
                  className="hover:text-white transition-colors"
                >
                  Demo Role Access Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Demonstration Roles */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Demonstration Roles
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/citizen" className="hover:text-white transition-colors">
                  Citizen Dashboard
                </Link>
              </li>
              <li>
                <Link href="/worker" className="hover:text-white transition-colors">
                  Sanitation Worker Dashboard
                </Link>
              </li>
              <li>
                <Link href="/officer" className="hover:text-white transition-colors">
                  Municipal Officer Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Academic Limitation & Integrity Notice */}
        <div className="mt-8 pt-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-start gap-2 max-w-2xl">
            <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-slate-300">Academic Demonstration Notice:</strong> JanSahayak
              is an independent academic project and is not an official portal of Gwalior Municipal
              Corporation or the Government of Madhya Pradesh. No official credentials, employment,
              or verified real-world authority are implied.
            </p>
          </div>
          <div className="text-slate-500 whitespace-nowrap">
            &copy; 2026 JanSahayak &bull; Gwalior, MP
          </div>
        </div>
      </div>
    </footer>
  );
}

