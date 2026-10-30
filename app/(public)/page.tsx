import * as React from 'react';
import Link from 'next/link';
import {
  Trash2,
  FileText,
  ArrowRight,
  MapPin,
  Sparkles,
  Users2,
  CheckCircle2,
  Camera,
  Bot,
  Building,
} from 'lucide-react';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { Button } from '@/components/ui/button';
import { GwaliorFortSilhouette } from '@/components/shared/gwalior-fort-art';
import { GwaliorWardMap } from '@/components/shared/gwalior-ward-map';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <PublicHeader />

      <main className="flex-1">
        {/* HERO SECTION matching visual reference image */}
        <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-slate-50/40 to-white pt-12 pb-16 lg:pt-16 lg:pb-24 border-b border-slate-100">
          {/* Subtle Gwalior Fort Silhouette in background */}
          <div className="absolute inset-x-0 bottom-0 pointer-events-none opacity-20">
            <GwaliorFortSilhouette className="w-full h-36 text-blue-900" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-100/80 px-3 py-1 text-xs font-semibold text-blue-800 border border-blue-200/70">
                <MapPin className="h-3.5 w-3.5 text-blue-700" />
                <span>Gwalior, Madhya Pradesh &bull; Academic Civic Demonstration</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900">
                Jan<span className="text-blue-700">Sahayak</span>
              </h1>

              <div className="space-y-1">
                <p className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                  Integrated Civic Assistance Platform
                </p>
                <p className="text-base sm:text-lg font-medium text-blue-800">
                  Gwalior, Madhya Pradesh
                </p>
              </div>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                Cleaner cities. Informed citizens. Stronger communities. Empowering Gwalior with
                streamlined sanitation grievance redressal, field worker coordination, and
                accessible government scheme navigation.
              </p>
            </div>

            {/* TWO PROMINENT MODULE CARDS matching visual reference image */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
              {/* Swachh Gwalior Card */}
              <Link href="/swachh-gwalior" className="group">
                <div className="h-full rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-xs group-hover:scale-105 transition-transform">
                        <Trash2 className="h-7 w-7" />
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                      Swachh Gwalior
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      Report issues, track progress, and build a cleaner, healthier city. Automated
                      sanitation dispatch and AI cleanliness verification.
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
                    <span>Citizen, Worker &amp; Officer Portals</span>
                    <span className="inline-flex items-center gap-1 group-hover:underline">
                      Explore Module &rarr;
                    </span>
                  </div>
                </div>
              </Link>

              {/* Scheme Exploration Card */}
              <Link href="/scheme-exploration" className="group">
                <div className="h-full rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-xs group-hover:scale-105 transition-transform">
                        <FileText className="h-7 w-7" />
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 group-hover:bg-blue-700 group-hover:text-white transition-colors">
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 group-hover:text-blue-800 transition-colors">
                      Scheme Exploration
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      Discover government schemes, get guidance, and access civic services.
                      Intelligent eligibility assistance and grievance support.
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-700">
                    <span>MP State &amp; Central Schemes</span>
                    <span className="inline-flex items-center gap-1 group-hover:underline">
                      Explore Module &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            {/* 4 FEATURE PILLS matching visual reference image */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-5xl">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-slate-800">
                  Report &amp; Track Local Issues
                </span>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-slate-800">
                  Access Government Schemes
                </span>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-slate-800">
                  Get AI-Powered Guidance
                </span>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 shrink-0">
                  <Users2 className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-slate-800">
                  Stronger Gwalior Together
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* DEMO ACCESS CTA BAR */}
        <section className="bg-blue-900 text-white py-8 border-y border-blue-950">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <span className="inline-block text-xs uppercase tracking-wider font-bold text-blue-300">
                Academic Evaluation Mode
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Try JanSahayak with One-Click Demonstration Roles
              </h2>
              <p className="text-xs sm:text-sm text-blue-200 max-w-xl">
                Experience role-tailored dashboards for Citizens, Field Sanitation Workers, and
                Municipal Officers with signed short-lived session cookies.
              </p>
            </div>
            <Link href="/demo-role">
              <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 font-semibold shadow">
                Choose Demo Role
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </section>

        {/* HOW THE PLATFORM WORKS SECTION */}
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Civic Workflow
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                How JanSahayak Works
              </h2>
              <p className="text-sm text-slate-600 mt-2">
                A unified architecture connecting citizens, sanitation ground teams, and municipal
                officers across Gwalior.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 relative">
                <div className="text-3xl font-black text-blue-200 mb-3">01</div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 mb-3">
                  <Camera className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">
                  Citizen Geo-Reporting
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Citizens photograph sanitation problems. The issue is tagged to their Gwalior ward
                  with precise GPS coordinates.
                </p>
              </div>

              {/* Step 2 */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 relative">
                <div className="text-3xl font-black text-blue-200 mb-3">02</div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 mb-3">
                  <MapPin className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">
                  Field Dispatch
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sanitation staff receive assignments on their mobile portal with navigation,
                  priority flags, and before-photos.
                </p>
              </div>

              {/* Step 3 */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 relative">
                <div className="text-3xl font-black text-blue-200 mb-3">03</div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 mb-3">
                  <Bot className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">
                  Gemini AI Verification
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cleanup photos are analyzed by Gemini multimodal AI to compare before and after
                  cleanliness before officer approval.
                </p>
              </div>

              {/* Step 4 */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 relative">
                <div className="text-3xl font-black text-blue-200 mb-3">04</div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 mb-3">
                  <Building className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">
                  Scheme Redressal
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Citizens discover eligible welfare schemes, find civic services, and track state
                  grievance channels in one place.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* GWALIOR WARD MAP PREVIEW SECTION */}
        <section className="py-12 bg-slate-50/70 border-t border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Gwalior Municipal Coverage
              </span>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                Ward-Level Sanitation Infrastructure
              </h2>
              <p className="text-sm text-slate-600">
                Integrated OpenStreetMap demonstration visualization of Gwalior Municipal Corporation wards.
              </p>
            </div>

            <GwaliorWardMap />
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
