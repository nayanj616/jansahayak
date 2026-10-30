'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Plus,
  FileText,
  Search,
  Bot,
  ArrowRight,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import type { DemoSessionPayload } from '@/types';

interface CitizenViewProps {
  session: DemoSessionPayload;
}

export function CitizenView({ session }: CitizenViewProps) {
  const [reportModalOpen, setReportModalOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Report issues, track progress and explore schemes.
          </p>
        </div>

        <div>
          <Button
            onClick={() => setReportModalOpen(true)}
            className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-medium shadow-xs gap-2"
          >
            <Plus className="h-4 w-4" />
            Report a New Complaint
          </Button>
        </div>
      </div>

      {/* Citizen Profile Banner */}
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            Assigned Location: <strong>{session.user.ward || 'Ward 24 (Lashkar)'}</strong> &bull;{' '}
            {session.user.zone || 'Lashkar Zone'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-emerald-700">
          <Clock className="h-3.5 w-3.5" />
          <span>Active Session Expiration: 2 Hours</span>
        </div>
      </div>

      {/* My Recent Complaints Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-base font-semibold">My Recent Complaints</CardTitle>
            <CardDescription>Sanitation issues reported by your account</CardDescription>
          </div>
          <Link
            href="#all-complaints"
            className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            View All
          </Link>
        </CardHeader>
        <CardContent>
          {/* Authentic Empty State matching visual reference */}
          <EmptyState
            icon={FileText}
            title="No complaints yet"
            description="Report a complaint to get started. Cleanliness issues you report will appear here for real-time tracking."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReportModalOpen(true)}
                className="mt-2 text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                File First Complaint
              </Button>
            }
          />
        </CardContent>
      </Card>

      {/* Bottom Grid: Scheme Exploration & AI Assistant */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Explore Government Schemes */}
        <Card className="hover:border-blue-300 transition-all group">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 group-hover:scale-105 transition-transform">
                <Search className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-semibold">
                Explore Government Schemes
              </CardTitle>
            </div>
            <CardDescription>
              Find schemes you may be eligible for across Madhya Pradesh and Central Government welfare initiatives.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/scheme-exploration"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 group-hover:text-blue-800 transition-colors"
            >
              Browse Schemes Directory
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardContent>
        </Card>

        {/* AI Civic Assistant */}
        <Card className="hover:border-cyan-300 transition-all group">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700 group-hover:scale-105 transition-transform">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">
                  AI Civic Assistant
                </CardTitle>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
                  <Sparkles className="h-2.5 w-2.5" />
                  Gemini
                </span>
              </div>
            </div>
            <CardDescription>
              Get answers to your questions about schemes, documentation requirements, and municipal services in Gwalior.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/scheme-exploration#assistant"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-700 group-hover:text-cyan-800 transition-colors"
            >
              Ask a Civic Question
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Phase 2 Complaint Modal Placeholder */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Report Sanitation Issue</h3>
                  <p className="text-xs text-slate-500">Phase 1 Workflow Scaffolding</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-600">
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 text-xs space-y-2">
                <p className="font-semibold text-slate-800">
                  Phase 1 Preparation Notice:
                </p>
                <p>
                  Per the project requirements, actual complaint submission, database inserts, and
                  image upload pipelines are scheduled for <strong>Phase 2</strong>.
                </p>
                <p>
                  In Phase 2, this dialog will provide:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                  <li>Automatic GPS geo-tagging via browser location</li>
                  <li>Before-cleanup photo upload directly to Supabase Storage</li>
                  <li>Ward selection across Gwalior Wards 1 to 66</li>
                  <li>Category selection (Garbage Dump, Drain, Dead Animal, etc.)</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReportModalOpen(false)}
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
