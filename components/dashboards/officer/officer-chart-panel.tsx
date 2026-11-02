'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ComplaintOverviewChart } from '../complaint-chart';
import type { ComplaintWithDetails } from '@/types';

interface OfficerChartPanelProps {
  timeframe: string;
  setTimeframe: (t: string) => void;
  complaints: ComplaintWithDetails[];
}

export function OfficerChartPanel({
  timeframe,
  setTimeframe,
  complaints,
}: OfficerChartPanelProps) {
  return (
    <Card id="analytics" className="shadow-2xs">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900">
            City-Wide Complaint Metrics
          </CardTitle>
          <CardDescription className="text-xs">
            Real-time distribution computed directly from live Supabase grievance records
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            aria-label="Filter analytics timeframe"
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-600 cursor-pointer"
          >
            <option value="Last 7 days">Last 7 days</option>
            <option value="Last 30 days">Last 30 days</option>
            <option value="This Quarter">This Quarter</option>
          </select>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <ComplaintOverviewChart timeframe={timeframe} complaints={complaints} />
      </CardContent>
    </Card>
  );
}

