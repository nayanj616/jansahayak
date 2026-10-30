import * as React from 'react';
import Link from 'next/link';
import {
  Trash2,
  Users,
  HardHat,
  Building2,
  Camera,
  Bot,
} from 'lucide-react';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GwaliorWardMap } from '@/components/shared/gwalior-ward-map';
import { COMPLAINT_CATEGORIES } from '@/features/swachh/constants';

export default function SwachhGwaliorPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/40 text-slate-900">
      <PublicHeader />

      <main className="flex-1">
        {/* Module Hero */}
        <section className="bg-gradient-to-b from-emerald-50/70 to-white py-12 sm:py-16 border-b border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
              <Trash2 className="h-3.5 w-3.5 text-emerald-700" />
              <span>Module A: Municipal Waste Management &bull; Gwalior, MP</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              Swachh <span className="text-emerald-700">Gwalior</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
              A comprehensive civic sanitation system connecting residents, sanitation teams, and
              the Gwalior Municipal Corporation for faster grievance turnaround and transparent
              accountability.
            </p>
          </div>
        </section>

        {/* THREE DEMO ROLE ENTRY POINTS */}
        <section className="py-12 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Demonstration Access
              </span>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                Enter by Demonstration Role
              </h2>
              <p className="text-sm text-slate-600">
                Test the specific workflows and dashboards designed for each user persona.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Citizen Card */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 mb-4">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Citizen Persona</h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    Capture photo of garbage or drainage issue, submit geo-tagged complaint, and
                    track remediation progress in your ward.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-emerald-100">
                  <Link href="/demo-role?required=citizen">
                    <Button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs">
                      Enter as Citizen &rarr;
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Sanitation Worker Card */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-800 mb-4">
                    <HardHat className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Sanitation Worker Persona</h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    View assigned tasks in your sector beat, mark status updates, and upload
                    after-cleanup photos for verification.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-blue-100">
                  <Link href="/demo-role?required=worker">
                    <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white text-xs">
                      Enter as Worker &rarr;
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Municipal Officer Card */}
              <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-800 mb-4">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Municipal Officer Persona</h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    Monitor 66 municipal wards, reallocate field staff, and evaluate Gemini AI
                    before-and-after cleanliness comparison scores.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-purple-100">
                  <Link href="/demo-role?required=officer">
                    <Button className="w-full bg-purple-800 hover:bg-purple-900 text-white text-xs">
                      Enter as Officer &rarr;
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SWACHH GWALIOR WORKFLOW PILLARS */}
        <section className="py-12 bg-slate-50/70 border-t border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                End-to-End Capabilities
              </span>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                Sanitation Grievance Redressal Architecture
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 mb-2">
                    <Camera className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-sm font-bold">1. Geo-Tagged Reporting</CardTitle>
                  <CardDescription className="text-xs">
                    Citizens submit photo evidence, category, and automatic GPS location within
                    Gwalior Municipal Corporation boundaries.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 mb-2">
                    <HardHat className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-sm font-bold">2. Field Worker Dispatch</CardTitle>
                  <CardDescription className="text-xs">
                    Sanitation supervisory staff dispatch field workers with precise location,
                    severity level, and turnaround timers.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 mb-2">
                    <Bot className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-sm font-bold">3. Gemini Cleanliness AI</CardTitle>
                  <CardDescription className="text-xs">
                    Before and after cleanup photographs are evaluated with multimodal AI to detect
                    residual waste and generate confidence scores.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-700 mb-2">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-sm font-bold">4. Officer Approval</CardTitle>
                  <CardDescription className="text-xs">
                    Municipal health officers review the AI assessment and field evidence before
                    officially closing the civic ticket.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* SUPPORTED GRIEVANCE CATEGORIES */}
        <section className="py-12 bg-white border-t border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Grievance Taxonomies
              </span>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                Monitored Waste &amp; Sanitation Categories
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {COMPLAINT_CATEGORIES.map((cat) => (
                <div
                  key={cat.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                    <h4 className="text-xs font-bold text-slate-900">{cat.label}</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{cat.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MAP SECTION */}
        <section className="py-12 bg-slate-50/60 border-t border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
            <GwaliorWardMap />
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
