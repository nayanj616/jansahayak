'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/lib/i18n';
import { CATEGORY_LABELS } from './officer-types';
import type { WardRecord } from '@/types';

interface OfficerFilterToolbarProps {
  filteredCount: number;
  totalCount: number;
  underReviewCount: number;
  unassignedCount: number;
  inProgressCount: number;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  wardFilter: string;
  setWardFilter: (w: string) => void;
  categoryFilter: string;
  setCategoryFilter: (c: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  wards: WardRecord[];
}

export function OfficerFilterToolbar({
  filteredCount,
  totalCount,
  underReviewCount,
  unassignedCount,
  inProgressCount,
  statusFilter,
  setStatusFilter,
  wardFilter,
  setWardFilter,
  categoryFilter,
  setCategoryFilter,
  searchQuery,
  setSearchQuery,
  wards,
}: OfficerFilterToolbarProps) {
  const { t } = useLanguage();

  const tabs = [
    { id: 'all', label: t('officer.queue.tabs.all') },
    { id: 'under_review', label: t('officer.queue.tabs.underReview'), count: underReviewCount },
    { id: 'submitted', label: t('officer.queue.tabs.unassigned'), count: unassignedCount },
    { id: 'in_progress', label: t('officer.queue.tabs.inProgress'), count: inProgressCount },
    { id: 'resolved', label: t('officer.queue.tabs.resolved') },
  ];

  return (
    <CardHeader className="p-5 border-b border-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold text-slate-900">
              {t('officer.queue.title')}
            </CardTitle>
            <Badge variant="secondary" className="text-[11px]">
              {t('officer.queue.countOfTotal', { filtered: filteredCount, total: totalCount })}
            </Badge>
          </div>
          <CardDescription className="text-xs mt-0.5">
            {t('officer.queue.subtitle')}
          </CardDescription>
        </div>

        {/* Quick Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Status tabs">
          {tabs.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-600 ${
                  isActive
                    ? 'bg-civic-700 text-white shadow-2xs font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Secondary Filter Controls: Search, Status, Ward, Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" aria-hidden="true" />
          <Input
            placeholder={t('officer.queue.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-9"
            aria-label="Search complaints by code, landmark or description"
          />
        </div>

        {/* Status Dropdown */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by complaint status"
            className="w-full h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-700 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-600 cursor-pointer"
          >
            <option value="all">{t('officer.queue.allStatuses')}</option>
            <option value="under_review">{t('complaints.statuses.under_review')}</option>
            <option value="submitted">{t('complaints.statuses.submitted')}</option>
            <option value="assigned">{t('complaints.statuses.assigned')}</option>
            <option value="in_progress">{t('complaints.statuses.in_progress')}</option>
            <option value="rework_required">{t('complaints.statuses.rework_required')}</option>
            <option value="resolved">{t('complaints.statuses.resolved')}</option>
            <option value="rejected">{t('complaints.statuses.rejected')}</option>
          </select>
        </div>

        {/* Ward Dropdown */}
        <div>
          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            aria-label="Filter by municipal ward"
            className="w-full h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-700 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-600 cursor-pointer"
          >
            <option value="all">{t('officer.queue.allWards')}</option>
            {wards.map((w) => {
              const id = w.ward_id || (w as unknown as { id?: string }).id || '';
              const num = w.ward_no ?? (w as unknown as { ward_number?: number }).ward_number ?? 0;
              return (
                <option key={id} value={id}>
                  Ward {num}: {w.ward_name}
                </option>
              );
            })}
          </select>
        </div>

        {/* Category Dropdown */}
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by sanitation category"
            className="w-full h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-700 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-600 cursor-pointer"
          >
            <option value="all">{t('officer.queue.allCategories')}</option>
            {Object.entries(CATEGORY_LABELS).map(([catKey, defaultLabel]) => (
              <option key={catKey} value={catKey}>
                {t(`complaints.categories.${catKey}.label`) || defaultLabel}
              </option>
            ))}
          </select>
        </div>
      </div>
    </CardHeader>
  );
}