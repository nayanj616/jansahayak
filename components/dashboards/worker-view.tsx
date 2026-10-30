'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  Camera,
  MapPin,
  RefreshCw,
  HardHat,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import type { DemoSessionPayload } from '@/types';

interface WorkerViewProps {
  session: DemoSessionPayload;
}

export function WorkerView({ session }: WorkerViewProps) {
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);

  // Clearly labeled zero-value placeholders until real Supabase data is connected
  const stats = [
    {
      label: 'Assigned',
      value: 0,
      icon: ClipboardList,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      description: '0 pending tasks (Phase 1 placeholder)',
    },
    {
      label: 'In Progress',
      value: 0,
      icon: Clock,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
      description: '0 active cleanups (Phase 1 placeholder)',
    },
    {
      label: 'Completed',
      value: 0,
      icon: CheckCircle2,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      description: '0 completed tasks (Phase 1 placeholder)',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">
            View your assigned complaints and update their status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setActionNotice(
                'Status Update workflow placeholder: Real-time status dispatch will be active in Phase 2.'
              )
            }
            className="text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Update Status
          </Button>
          <Button
            size="sm"
            onClick={() =>
              setActionNotice(
                'After-photo Upload placeholder: Camera integration and image uploads to Supabase Storage will be activated in Phase 2.'
              )
            }
            className="bg-blue-700 hover:bg-blue-800 text-white text-xs"
          >
            <Camera className="h-3.5 w-3.5 mr-1" />
            Upload Photos
          </Button>
        </div>
      </div>

      {/* Field Worker Profile Badge Banner with Demonstration Labels */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900">
        <div className="flex items-center gap-2">
          <HardHat className="h-4 w-4 text-blue-600 shrink-0" />
          <span>
            Field Persona: <strong>{session.user.name}</strong> &bull;{' '}
            {session.user.ward || 'Demonstration Sector: Morar Area'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-blue-700">
          <MapPin className="h-3.5 w-3.5" />
          <span>Demonstration Zone (Unverified Boundary)</span>
        </div>
      </div>

      {/* 3 Stat Counter Cards with Zero-Value Placeholders */}
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

      {/* My Assignments Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-base font-semibold">My Assignments</CardTitle>
            <CardDescription>
              Sanitation tasks assigned to your beat by the municipal supervisor
            </CardDescription>
          </div>
          <Link
            href="#all-assignments"
            className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            View All
          </Link>
        </CardHeader>
        <CardContent>
          {/* Authentic Empty State matching visual reference */}
          <EmptyState
            icon={ClipboardList}
            title="No assignments yet"
            description="New assignments will appear here. No field tasks have been allocated to your demonstration beat yet. Real records will connect via Supabase in Phase 2."
          />
        </CardContent>
      </Card>

      {/* Action Notice Dialog */}
      {actionNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in-0 zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h4 className="text-base font-semibold text-slate-900">
                  Phase 1 Architecture Notice
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">{actionNotice}</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <Button size="sm" onClick={() => setActionNotice(null)}>
                Understood
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
