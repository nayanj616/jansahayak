'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Users,
  HardHat,
  Building2,
  ArrowRight,
  ArrowLeft,
  Info,
  Loader2,
} from 'lucide-react';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { Button } from '@/components/ui/button';
import { AlertBanner } from '@/components/ui/alert-banner';
import type { DemoRole } from '@/types';

export default function DemoRoleSelectorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingRole, setLoadingRole] = React.useState<DemoRole | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const requiredRole = searchParams.get('required');

  const roles = [
    {
      id: 'citizen' as DemoRole,
      title: 'Citizen',
      tagline: 'Gwalior Resident Portal',
      description: 'Report issues, track complaints and explore government schemes.',
      icon: Users,
      cardBg: 'bg-emerald-50/50 hover:bg-emerald-50 border-emerald-200 hover:border-emerald-300',
      iconBg: 'bg-emerald-100 text-emerald-800',
      buttonBg: 'bg-emerald-700 hover:bg-emerald-800 text-white',
      badge: 'Public Grievance Redressal',
      dashboardPath: '/citizen',
    },
    {
      id: 'worker' as DemoRole,
      title: 'Sanitation Worker',
      tagline: 'Field Staff Portal',
      description: 'View assigned complaints, update status and upload cleanup photos.',
      icon: HardHat,
      cardBg: 'bg-blue-50/50 hover:bg-blue-50 border-blue-200 hover:border-blue-300',
      iconBg: 'bg-blue-100 text-blue-800',
      buttonBg: 'bg-blue-700 hover:bg-blue-800 text-white',
      badge: 'Beat Maintenance & Photos',
      dashboardPath: '/worker',
    },
    {
      id: 'officer' as DemoRole,
      title: 'Municipal Officer',
      tagline: 'Administration & Oversight',
      description: 'Monitor complaints, manage assignments and review AI verification results.',
      icon: Building2,
      cardBg: 'bg-purple-50/50 hover:bg-purple-50 border-purple-200 hover:border-purple-300',
      iconBg: 'bg-purple-100 text-purple-800',
      buttonBg: 'bg-purple-800 hover:bg-purple-900 text-white',
      badge: 'GMC Headquarters & AI Review',
      dashboardPath: '/officer',
    },
  ];

  const handleSelectRole = async (role: DemoRole, redirectPath: string) => {
    try {
      setLoadingRole(role);
      setErrorMsg(null);

      const response = await fetch('/api/demo-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, redirectUrl: redirectPath }),
      });

      if (!response.ok) {
        throw new Error('Failed to set demo session');
      }

      const data = await response.json();
      router.push(data.redirectTo || redirectPath);
      router.refresh();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to initialize demo session. Please try again.');
      setLoadingRole(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/40 text-slate-900">
      <PublicHeader />

      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Back to Home Link */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Home
            </Link>
          </div>

          {/* Heading */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Choose Your Role
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Select a role to access relevant features and dashboards. This is a demonstration
              platform for academic purposes.
            </p>
          </div>

          {/* Notice when redirected because of role requirement */}
          {requiredRole && (
            <AlertBanner type="warning" title="Role Access Required">
              You attempted to access a section that requires the <strong>{requiredRole}</strong>{' '}
              demonstration role. Please continue as <strong>{requiredRole}</strong> below to
              proceed.
            </AlertBanner>
          )}

          {errorMsg && (
            <AlertBanner type="destructive" title="Session Initialization Error">
              {errorMsg}
            </AlertBanner>
          )}

          {/* THREE ROLE CARDS matching visual reference image */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.map((item) => {
              const Icon = item.icon;
              const isLoading = loadingRole === item.id;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-7 shadow-sm transition-all duration-200 flex flex-col justify-between ${item.cardBg}`}
                >
                  <div>
                    {/* Role Icon */}
                    <div className="flex items-center justify-between mb-5">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.iconBg} shadow-2xs`}
                      >
                        <Icon className="h-7 w-7" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        {item.tagline}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900">{item.title}</h2>
                    <p className="mt-3 text-sm text-slate-600 leading-relaxed min-h-[4.5rem]">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-200/60">
                    <Button
                      onClick={() => handleSelectRole(item.id, item.dashboardPath)}
                      disabled={loadingRole !== null}
                      className={`w-full font-semibold shadow-xs transition-transform active:scale-98 ${item.buttonBg}`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          Entering Portal...
                        </>
                      ) : (
                        <>
                          Continue as {item.title}
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* INFORMATIONAL BANNER matching visual reference image */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-xs sm:text-sm text-blue-900 flex items-start gap-3 shadow-2xs">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-semibold">Demonstration Notice:</strong> This is a public
              demonstration platform for academic purposes. No real authentication is required. Do
              not share any personal or sensitive information. Each role selection generates a
              cryptographically signed short-lived session cookie for demonstration access.
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
