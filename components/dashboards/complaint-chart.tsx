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

interface ComplaintChartProps {
  timeframe?: string;
}

// Sample time-series distribution matching the visual reference pattern
const CHART_DATA = [
  { day: 'Day 1', Reported: 3, InProgress: 1, Completed: 0 },
  { day: 'Day 5', Reported: 5, InProgress: 2, Completed: 1 },
  { day: 'Day 9', Reported: 8, InProgress: 4, Completed: 2 },
  { day: 'Day 13', Reported: 6, InProgress: 3, Completed: 3 },
  { day: 'Day 17', Reported: 10, InProgress: 5, Completed: 5 },
  { day: 'Day 21', Reported: 7, InProgress: 4, Completed: 6 },
  { day: 'Day 25', Reported: 9, InProgress: 3, Completed: 8 },
  { day: 'Day 30', Reported: 4, InProgress: 2, Completed: 12 },
];

function subscribe() {
  return () => {};
}

export function ComplaintOverviewChart({ timeframe = 'Last 30 days' }: ComplaintChartProps) {
  // Safe client-side check without setState in useEffect
  const isClient = React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  if (!isClient) {
    return (
      <div className="h-64 w-full flex items-center justify-center bg-slate-50/50 rounded-lg">
        <p className="text-xs text-slate-400">Loading chart analytics...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={CHART_DATA}
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
              domain={[0, 14]}
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
              name="Reported"
            />
            <Bar
              dataKey="InProgress"
              fill="#f97316"
              radius={[4, 4, 0, 0]}
              name="In Progress"
            />
            <Bar
              dataKey="Completed"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              name="Completed"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] text-center text-slate-400 mt-2">
        Demonstration analytics for {timeframe}. Real database aggregation will bind in Phase 2.
      </p>
    </div>
  );
}
