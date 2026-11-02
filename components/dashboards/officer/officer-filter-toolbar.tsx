'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'under_review', label: 'Under Review', count: underReviewCount },
    { id: 'submitted', label: 'Unassigned', count: unassignedCount },
    { id: 'in_progress', label: 'In Progress', count: inProgressCount },
    { id: 'resolved', label: 'Resolved' },
  ];

  return (
    <CardHeader className="p-5 border-b border-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold text-slate-900">
              Officer Complaint Queue
            </CardTitle>
            <Badge variant="secondary" className="text-[11px]">
              {filteredCount} of {totalCount} complaints
            </Badge>
          </div>
          <CardDescription className="text-xs mt-0.5">
            Review citizen complaints, allocate field sanitation staff, and verify cleanup evidence
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
            placeholder="Search code, landmark..."
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
            <option value="all">All Statuses</option>
            <option value="under_review">Under Review (Needs Approval)</option>
            <option value="submitted">Submitted (New / Unassigned)</option>
            <option value="assigned">Assigned (Worker Allocated)</option>
            <option value="in_progress">In Progress (Work Underway)</option>
            <option value="rework_required">Rework Required</option>
            <option value="resolved">Resolved (Approved)</option>
            <option value="rejected">Rejected</option>
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
            <option value="all">All Wards (59 GMC Wards)</option>
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
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => (
              <option key={catKey} value={catKey}>
                {catLabel}
              </option>
            ))}
          </select>
        </div>
      </div>
    </CardHeader>
  );
}
