'use client';

import * as React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { BarChart3, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ComplaintWithDetails } from '@/types';

interface ComplaintChartProps {
  timeframe?: string;
  complaints?: ComplaintWithDetails[];
}

// Zero-value baseline placeholder data (no fabricated operational numbers)
const ZERO_BASELINE_DATA = [
  { day: 'Day 1', Reported: 0, InProgress: 0, Completed: 0 },
  { day: 'Day 5', Reported: 0, InProgress: 0, Completed: 0 },
  { day: 'Day 9', Reported: 0, InProgress: 0, Completed: 0 },
  { day: 'Day 13', Reported: 0, InProgress: 0, Completed: 0 },
  { day: 'Day 17', Reported: 0, InProgress: 0, Completed: 0 },
  { day: 'Day 21', Reported: 0, InProgress: 0, Completed: 0 },
  { day: 'Day 25', Reported: 0, InProgress: 0, Completed: 0 },
  { day: 'Day 30', Reported: 0, InProgress: 0, Completed: 0 },
];

function subscribe() {
  return () => {};
}

export function ComplaintOverviewChart({
  timeframe = 'Last 30 days',
  complaints,
}: ComplaintChartProps) {
  const isClient = React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const [showZeroBaseline, setShowZeroBaseline] = React.useState(false);

  const realChartData = React.useMemo(() => {
    if (!complaints || complaints.length === 0) return null;
    return [
      {
        status: 'Submitted',
        Count: complaints.filter((c) => c.status === 'submitted').length,
      },
      {
        status: 'Assigned',
        Count: complaints.filter((c) => c.status === 'assigned').length,
      },
      {
        status: 'In Progress',
        Count: complaints.filter((c) => c.status === 'in_progress').length,
      },
      {
        status: 'Under Review',
        Count: complaints.filter((c) => c.status === 'under_review').length,
      },
      {
        status: 'Rework',
        Count: complaints.filter((c) => c.status === 'rework_required').length,
      },
      {
        status: 'Resolved',
        Count: complaints.filter((c) => c.status === 'resolved').length,
      },
      {
        status: 'Rejected',
        Count: complaints.filter((c) => c.status === 'rejected').length,
      },
    ];
  }, [complaints]);

  if (!isClient) {
    return (
      <div className="h-64 w-full flex items-center justify-center bg-slate-50/50 rounded-lg">
        <p className="text-xs text-slate-400">Loading chart analytics...</p>
      </div>
    );
  }

  // If real live complaints are provided, render the live chart directly
  if (realChartData) {
    return (
      <div className="w-full space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
            <BarChart3 className="h-3 w-3 shrink-0" />
            Live Supabase Analytics ({complaints?.length || 0} Total Records)
          </span>
          <span className="text-xs text-slate-500 font-medium">Status Distribution</span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={realChartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="status"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              />
              <Bar
                dataKey="Count"
                fill="#4f46e5"
                radius={[4, 4, 0, 0]}
                name="Complaints"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-center text-slate-400">
          Distribution computed dynamically from live complaint records across Gwalior sectors.
        </p>
      </div>
    );
  }

  if (!showZeroBaseline) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center min-h-[18rem]">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-3">
          <BarChart3 className="h-6 w-6 stroke-[1.8]" />
        </div>
        <h4 className="text-sm font-semibold text-slate-800 mb-1">
          No Complaint Analytics Logged Yet
        </h4>
        <p className="max-w-md text-xs text-slate-500 mb-4 leading-relaxed">
          Operational statistics are not fabricated. Live time-series aggregation for municipal officers
          is scheduled for Phase 4.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowZeroBaseline(true)}
          className="text-xs text-slate-600 gap-1.5"
        >
          <Info className="h-3.5 w-3.5 text-blue-600" />
          Preview Zero-Value Chart Baseline
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between px-1">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-medium text-amber-800">
          <Info className="h-3 w-3 shrink-0" />
          Zero-Value Placeholder Baseline ({timeframe})
        </span>
        <button
          type="button"
          onClick={() => setShowZeroBaseline(false)}
          className="text-xs text-blue-600 hover:underline cursor-pointer"
        >
          View Empty State
        </button>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={ZERO_BASELINE_DATA}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
              domain={[0, 10]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            />
            <Bar
              dataKey="Reported"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              name="Reported (0)"
            />
            <Bar
              dataKey="InProgress"
              fill="#f97316"
              radius={[4, 4, 0, 0]}
              name="In Progress (0)"
            />
            <Bar
              dataKey="Completed"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              name="Completed (0)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] text-center text-slate-400">
        All categories show zero counts. No operational records are fabricated prior to Supabase database connection.
      </p>
    </div>
  );
}
