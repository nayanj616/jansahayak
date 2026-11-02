'use client';

import * as React from 'react';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  MapPin,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface OfficerMetricsBarProps {
  designation: string;
  totalCount: number;
  underReviewCount: number;
  inProgressCount: number;
  resolvedCount: number;
  onFilterByStatus?: (status: string) => void;
  activeStatusFilter?: string;
}

export function OfficerMetricsBar({
  designation,
  totalCount,
  underReviewCount,
  inProgressCount,
  resolvedCount,
  onFilterByStatus,
  activeStatusFilter,
}: OfficerMetricsBarProps) {
  const stats = [
    {
      id: 'all',
      label: 'Total Grievances',
      value: totalCount,
      icon: ClipboardList,
      color: 'text-civic-700',
      bgColor: 'bg-civic-50',
      borderColor: 'border-civic-200',
      description: 'Logged across Gwalior municipal jurisdiction',
    },
    {
      id: 'under_review',
      label: 'Needs Review',
      value: underReviewCount,
      icon: AlertTriangle,
      color: 'text-purple-700',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      highlight: underReviewCount > 0,
      description: `${underReviewCount} completed task${underReviewCount === 1 ? '' : 's'} awaiting officer verification`,
    },
    {
      id: 'in_progress',
      label: 'Active In Progress',
      value: inProgressCount,
      icon: Clock,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      description: `${inProgressCount} complaint${inProgressCount === 1 ? '' : 's'} assigned or undergoing field work`,
    },
    {
      id: 'resolved',
      label: 'Resolved',
      value: resolvedCount,
      icon: CheckCircle2,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      description: `${resolvedCount} verified and resolved grievance${resolvedCount === 1 ? '' : 's'}`,
    },
  ];

  return (
    <div id="metrics" className="space-y-4">
      {/* Municipal Scope Banner */}
      <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-purple-900 shadow-2xs">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-purple-700 shrink-0" aria-hidden="true" />
          <span>
            Designation: <strong>{designation}</strong> &bull; Municipal Officer Session
          </span>
        </div>
        <div className="flex items-center gap-2 text-purple-700">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          <span>GMC Evaluation Scope: 59 Provisional Wards Across Gwalior</span>
        </div>
      </div>

      {/* 4 Real Metric Stat Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isSelected = activeStatusFilter === stat.id;

          return (
            <Card
              key={stat.label}
              onClick={() => onFilterByStatus?.(stat.id)}
              className={`border ${stat.borderColor} ${stat.bgColor}/50 shadow-2xs transition-all ${
                onFilterByStatus ? 'cursor-pointer hover:shadow-md' : ''
              } ${isSelected ? 'ring-2 ring-civic-600' : ''} ${
                stat.highlight && !isSelected ? 'ring-1 ring-purple-400/40' : ''
              }`}
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
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bgColor} ${stat.color} shrink-0`}
                  aria-hidden="true"
                >
                  <Icon className="h-6 w-6 stroke-[1.8]" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

