'use client';

import * as React from 'react';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  Bot,
  MapPin,
  BarChart3,
  Building2,
  Sparkles,
  Filter,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ComplaintOverviewChart } from './complaint-chart';
import type { DemoSessionPayload } from '@/types';

interface OfficerViewProps {
  session: DemoSessionPayload;
}

export function OfficerView({ session }: OfficerViewProps) {
  const [timeframe, setTimeframe] = React.useState('Last 30 days');
  const [activeModal, setActiveModal] = React.useState<string | null>(null);

  // Clearly labeled zero-value placeholders until real Supabase data is connected
  const stats = [
    {
      label: 'Total Complaints',
      value: 0,
      icon: ClipboardList,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      description: '0 complaints logged (Phase 4 development placeholder)',
    },
    {
      label: 'In Progress',
      value: 0,
      icon: Clock,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
      description: '0 in progress (Phase 4 development placeholder)',
    },
    {
      label: 'Completed',
      value: 0,
      icon: CheckCircle2,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      description: '0 completed (Phase 4 development placeholder)',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Monitor city-wide complaints and operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveModal('filter')}
            className="text-xs"
          >
            <Filter className="h-3.5 w-3.5 mr-1" />
            Demonstration Sectors (59 Wards)
          </Button>
          <Button
            size="sm"
            onClick={() => setActiveModal('ai-review')}
            className="bg-indigo-700 hover:bg-indigo-800 text-white text-xs gap-1.5"
          >
            <Bot className="h-3.5 w-3.5" />
            AI Verifications (0 Pending &bull; Phase 4 Preview)
          </Button>
        </div>
      </div>

      {/* Municipal Officer Administration Scope Banner */}
      <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-purple-900">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-purple-700 shrink-0" />
          <span>
            Designation: <strong>{session.user.designation}</strong> &bull; GMC Administration Demo
          </span>
        </div>
        <div className="flex items-center gap-2 text-purple-700">
          <MapPin className="h-3.5 w-3.5" />
          <span>Evaluation Scope: 59 Provisional Wards (Pending Official Verification)</span>
        </div>
      </div>

      {/* 3 Stat Counters with Zero-Value Placeholders */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className={`border ${stat.borderColor} ${stat.bgColor}/40 shadow-xs`}
            >
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    {stat.label}
                  </p>
                  <p className={`text-3xl font-extrabold ${stat.color} tracking-tight`}>
                    {stat.value}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">{stat.description}</p>
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bgColor} ${stat.color}`}
                >
                  <Icon className="h-6 w-6 stroke-[1.8]" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Complaint Overview Chart Card with Zero Baseline Placeholder */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base font-semibold">Complaint Overview</CardTitle>
            <CardDescription>
              Trend analysis of reported, in-progress and completed civic grievances
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
            >
              <option value="Last 7 days">Last 7 days</option>
              <option value="Last 30 days">Last 30 days</option>
              <option value="This Quarter">This Quarter</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <ComplaintOverviewChart timeframe={timeframe} />
        </CardContent>
      </Card>

      {/* Bottom 3 Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: AI Verification */}
        <Card
          className="hover:border-blue-300 transition-all cursor-pointer group"
          onClick={() => setActiveModal('ai-review')}
        >
          <CardHeader className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700 group-hover:scale-105 transition-transform">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">AI Verification</CardTitle>
                <CardDescription className="text-xs">
                  Review pending verifications (0 Pending)
                </CardDescription>
              </div>
            </div>
            <p className="text-xs text-slate-500 pt-1">
              Gemini model comparative before-and-after image confidence scoring.
            </p>
          </CardHeader>
        </Card>

        {/* Card 2: Ward-wise View */}
        <Card
          className="hover:border-purple-300 transition-all cursor-pointer group"
          onClick={() => setActiveModal('ward-view')}
        >
          <CardHeader className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700 group-hover:scale-105 transition-transform">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Demonstration Sectors View</CardTitle>
                <CardDescription className="text-xs">
                  Explore demonstration sectors (Unverified)
                </CardDescription>
              </div>
            </div>
            <p className="text-xs text-slate-500 pt-1">
              Sanitation metrics across Lashkar, Morar, Thatipur, and Heritage demonstration zones.
            </p>
          </CardHeader>
        </Card>

        {/* Card 3: Analytics */}
        <Card
          className="hover:border-emerald-300 transition-all cursor-pointer group"
          onClick={() => setActiveModal('analytics')}
        >
          <CardHeader className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 group-hover:scale-105 transition-transform">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Analytics</CardTitle>
                <CardDescription className="text-xs">
                  City-wide insights (Phase 4 Baseline)
                </CardDescription>
              </div>
            </div>
            <p className="text-xs text-slate-500 pt-1">
              Resolution turnaround times and sanitation worker allocation ratios.
            </p>
          </CardHeader>
        </Card>
      </div>

      {/* Informative Modal Dialog */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm capitalize">
                  {activeModal.replace('-', ' ')} (Phase 4 Preview)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 text-base"
              >
                &times;
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-2">
              <p>
                This officer module interface is pending implementation in Phase 4:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong>AI Verification:</strong> Officers can review dual before/after photos with Gemini confidence scores and approve cleanup.
                </li>
                <li>
                  <strong>Ward-wise View:</strong> Interactive map across provisional Gwalior wards with worker dispatch controls.
                </li>
                <li>
                  <strong>Analytics:</strong> Real-time municipal KPIs computed directly from Supabase PostgreSQL queries.
                </li>
              </ul>
            </div>
            <div className="mt-5 flex justify-end">
              <Button size="sm" onClick={() => setActiveModal(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
