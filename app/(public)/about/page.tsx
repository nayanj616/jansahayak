import * as React from 'react';
import Link from 'next/link';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Code2, Users2 } from 'lucide-react';
import { GwaliorMonumentLogo } from '@/components/shared/gwalior-fort-art';

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/40 text-slate-900">
      <PublicHeader />

      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <GwaliorMonumentLogo className="h-14 w-14 text-amber-700" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              About JanSahayak
            </h1>
            <p className="text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
              An academic demonstration project for an integrated civic assistance platform focused
              on Gwalior, Madhya Pradesh, India.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <Card>
              <CardHeader className="p-6 pb-2">
                <div className="flex items-center gap-2.5 text-blue-800 font-bold text-sm mb-1">
                  <BookOpen className="h-4 w-4" />
                  <span>Academic Motivation</span>
                </div>
                <CardTitle className="text-base">Civic Waste &amp; Welfare Scaffolding</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-2 text-xs text-slate-600 space-y-2 leading-relaxed">
                <p>
                  JanSahayak investigates how modern web architectures, GIS geo-tagging, and
                  multimodal AI can enhance civic governance in Tier-2 Indian cities like Gwalior.
                </p>
                <p>
                  By creating a single interface uniting citizen reporting, field worker dispatch,
                  and municipal oversight, the project explores the elimination of operational
                  bottlenecks in public health and sanitation.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-6 pb-2">
                <div className="flex items-center gap-2.5 text-emerald-800 font-bold text-sm mb-1">
                  <Code2 className="h-4 w-4" />
                  <span>Technical Architecture</span>
                </div>
                <CardTitle className="text-base">Modern Stack &amp; Standards</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-2 text-xs text-slate-600 space-y-2 leading-relaxed">
                <p>
                  Built with Next.js App Router, React 19, TypeScript strict mode, Tailwind CSS,
                  shadcn/ui patterns, Lucide icons, Supabase PostgreSQL, Google Gemini multimodal AI,
                  and OpenStreetMap Leaflet integration.
                </p>
                <p>
                  The system enforces server-side signed demo session cookies (via jose),
                  preventing unauthorized dashboard navigation without real-identity account
                  friction.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Academic Disclaimer &amp; Demarcation</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              JanSahayak is an academic demonstration project and does NOT represent an official
              portal of Gwalior Municipal Corporation (GMC) or the Government of Madhya Pradesh.
              No visitor identity or municipal employment is officially verified, and all grievance
              records displayed in Phase 1 are demonstration placeholders.
            </p>
            <div className="pt-2">
              <Link href="/demo-role">
                <Button size="sm" className="bg-blue-700 hover:bg-blue-800 text-white font-medium text-xs">
                  <Users2 className="h-3.5 w-3.5 mr-1.5" />
                  Explore Demo Roles
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
