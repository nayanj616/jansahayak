'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ComplaintOverviewChart } from '../complaint-chart';
import type { ComplaintWithDetails } from '@/types';
import { useLanguage } from '@/lib/i18n/context';

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
  const { t } = useLanguage();

  return (
    <Card id="analytics" className="shadow-2xs">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900">
            {t('officer.analytics.title')}
          </CardTitle>
          <CardDescription className="text-xs">
            {t('officer.analytics.subtitle')}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            aria-label={t('officer.analytics.timeframeLabel')}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-600 cursor-pointer"
          >
            <option value="Last 7 days">{t('officer.analytics.last7Days')}</option>
            <option value="Last 30 days">{t('officer.analytics.last30Days')}</option>
            <option value="This Quarter">{t('officer.analytics.thisQuarter')}</option>
          </select>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <ComplaintOverviewChart timeframe={timeframe} complaints={complaints} />
      </CardContent>
    </Card>
  );
}

