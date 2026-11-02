import * as React from 'react';
import Link from 'next/link';
import { GwaliorFortSilhouette, GwaliorMonumentLogo } from '@/components/shared/gwalior-fort-art';
import { ShieldAlert } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="relative overflow-hidden bg-slate-900 text-slate-300 border-t border-slate-800">
      {/* Decorative Gwalior Fort Silhouette in background */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none opacity-15" aria-hidden="true">
        <GwaliorFortSilhouette className="w-full h-32 text-blue-300" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 pb-8 border-b border-slate-800">
          {/* Brand Info */}
          <div className="md:col-span-6 space-y-3">
            <div className="flex items-center gap-3">
              <GwaliorMonumentLogo className="h-8 w-8 text-amber-500 shrink-0" />
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
            <div className="pt-1">
              <span className="inline-flex items-center gap-2 rounded-md bg-slate-800/80 border border-slate-700/60 px-3 py-1 text-xs text-slate-300 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                Academic Evaluation Prototype &bull; Swachh Gwalior
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
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  Swachh Gwalior Sanitation
                </Link>
              </li>
              <li>
                <Link
                  href="/scheme-exploration"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  Scheme Exploration & Guidance
                </Link>
              </li>
              <li>
                <Link
                  href="/demo-role"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  Demo Role Access Portal
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  About Platform & Architecture
                </Link>
              </li>
            </ul>
          </div>

          {/* Demonstration Roles */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Demonstration Portals
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link
                  href="/citizen"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  Citizen Grievance Portal
                </Link>
              </li>
              <li>
                <Link
                  href="/worker"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  Sanitation Worker Portal
                </Link>
              </li>
              <li>
                <Link
                  href="/officer"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  Municipal Officer Command Center
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Academic Limitation & Integrity Notice */}
        <div className="mt-8 pt-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-start gap-2.5 max-w-3xl">
            <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="leading-relaxed">
              <strong className="text-slate-300">Academic Demonstration Notice:</strong> JanSahayak
              is an independent academic project and is not an official portal of Gwalior Municipal
              Corporation or the Government of Madhya Pradesh. No official credentials, municipal employment,
              or real-world administrative authority are implied or recorded.
            </p>
          </div>
          <div className="text-slate-500 whitespace-nowrap text-right">
            &copy; 2026 JanSahayak &bull; Gwalior, MP
          </div>
        </div>
      </div>
    </footer>
  );
}
