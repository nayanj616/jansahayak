'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  MapPin,
  Building2,
  UserCheck,
  Eye,
  RefreshCw,
  Search,
  Calendar,
  Layers,
  History,
  HardHat,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { ComplaintOverviewChart } from './complaint-chart';
import { formatDate } from '@/lib/utils';
import type {
  ComplaintWithDetails,
  DemoSessionPayload,
  DemoUserRecord,
  WardRecord,
} from '@/types';

interface OfficerViewProps {
  session: DemoSessionPayload;
  initialComplaints?: ComplaintWithDetails[];
  wards?: WardRecord[];
  workers?: DemoUserRecord[];
}

const CATEGORY_LABELS: Record<string, string> = {
  garbage_dump: 'Garbage Dump / Open Pile',
  overflowing_bin: 'Overflowing Waste Bin',
  drain_blockage: 'Blocked Drainage / Nullah',
  dead_animal: 'Dead Animal Carcass',
  construction_debris: 'Construction Debris (C&D)',
  open_defecation: 'Open Defecation Area',
  sweeping_needed: 'Street Sweeping Required',
  street_cleaning: 'Street Sanitation & Litter',
  water_logging: 'Water Logging & Sludge',
  sewage_overflow: 'Sewage Overflow',
  solid_waste: 'Solid Waste Accumulation',
  other: 'General Sanitation Issue',
};

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' | 'purple' | 'civic';
  }
> = {
  submitted: { label: 'New / Unassigned', variant: 'secondary' },
  assigned: { label: 'Assigned', variant: 'default' },
  in_progress: { label: 'In Progress', variant: 'warning' },
  under_review: { label: 'Needs Review', variant: 'purple' },
  rework_required: { label: 'Rework Required', variant: 'destructive' },
  resolved: { label: 'Resolved', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'outline' },
};

const PRIORITY_BADGES: Record<string, 'default' | 'secondary' | 'warning' | 'destructive'> = {
  low: 'secondary',
  normal: 'default',
  high: 'warning',
  urgent: 'destructive',
};

export function OfficerView({
  session,
  initialComplaints = [],
  wards = [],
  workers = [],
}: OfficerViewProps) {
  const [complaints, setComplaints] = React.useState<ComplaintWithDetails[]>(initialComplaints);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [timeframe, setTimeframe] = React.useState('Last 30 days');

  // Filter states
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [wardFilter, setWardFilter] = React.useState<string>('all');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState<string>('');

  // Modals & Dialogs
  const [detailModalComplaint, setDetailModalComplaint] = React.useState<ComplaintWithDetails | null>(null);
  const [isDetailLoading, setIsDetailLoading] = React.useState(false);
  const [assignDialogComplaint, setAssignDialogComplaint] = React.useState<ComplaintWithDetails | null>(null);
  const [reviewDialogComplaint, setReviewDialogComplaint] = React.useState<ComplaintWithDetails | null>(null);

  // Assignment Form State
  const [selectedWorkerId, setSelectedWorkerId] = React.useState<string>(workers[0]?.id || '');
  const [assignmentNotes, setAssignmentNotes] = React.useState<string>('');
  const [isAssigning, setIsAssigning] = React.useState<boolean>(false);
  const [assignError, setAssignError] = React.useState<string | null>(null);

  // Review Form State
  const [reviewAction, setReviewAction] = React.useState<'approve' | 'rework' | 'reject'>('approve');
  const [reviewRemarks, setReviewRemarks] = React.useState<string>('');
  const [isReviewing, setIsReviewing] = React.useState<boolean>(false);
  const [reviewError, setReviewError] = React.useState<string | null>(null);

  // Photo Full-Preview Modal
  const [previewPhoto, setPreviewPhoto] = React.useState<{
    url: string;
    title: string;
    subtitle?: string;
  } | null>(null);

  // Notification Banner
  const [notification, setNotification] = React.useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // 1. Dashboard Metrics derived independently of active UI filters (Requirement D)
  const totalCount = complaints.length;
  const underReviewCount = complaints.filter((c) => c.status === 'under_review').length;
  const inProgressCount = complaints.filter((c) => ['assigned', 'in_progress'].includes(c.status)).length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;

  const stats = [
    {
      label: 'Total Grievances',
      value: totalCount,
      icon: ClipboardList,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      description: `${totalCount} logged city-wide in Supabase`,
    },
    {
      label: 'Awaiting Officer Review',
      value: underReviewCount,
      icon: ShieldAlert,
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      description: `${underReviewCount} pending verification & approval`,
      highlight: underReviewCount > 0,
    },
    {
      label: 'Work in Progress',
      value: inProgressCount,
      icon: Clock,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
      description: `${inProgressCount} active field cleanups`,
    },
    {
      label: 'Resolved & Closed',
      value: resolvedCount,
      icon: CheckCircle2,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      description: `${resolvedCount} verified and resolved`,
    },
  ];

  // 2. Refresh complaints from API
  const handleRefreshComplaints = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/complaints');
      const data = await res.json();
      if (data.success && Array.isArray(data.complaints)) {
        setComplaints(data.complaints);
        setNotification({
          type: 'success',
          message: 'Dashboard complaint queue refreshed with live Supabase data.',
        });
      }
    } catch (err) {
      console.error('Failed to refresh complaints:', err);
      setNotification({
        type: 'error',
        message: 'Failed to refresh complaints from server.',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // 3. Open Detail Modal & Fetch On-Demand Signed URLs (Requirement D)
  const handleOpenDetailModal = async (complaint: ComplaintWithDetails) => {
    setDetailModalComplaint(complaint);
    setIsDetailLoading(true);

    try {
      const res = await fetch(`/api/complaints/${complaint.id}`);
      const data = await res.json();
      if (data.success && data.complaint) {
        setDetailModalComplaint(data.complaint);
        // Also update local list item so signed URLs persist for this session
        setComplaints((prev) =>
          prev.map((c) => (c.id === data.complaint.id ? data.complaint : c))
        );
      }
    } catch (err) {
      console.error('Failed to fetch complaint details with signed URLs:', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  // 4. Open Assignment Dialog
  const handleOpenAssignDialog = (complaint: ComplaintWithDetails) => {
    setAssignDialogComplaint(complaint);
    setAssignError(null);
    setAssignmentNotes('');
    if (workers.length > 0) {
      setSelectedWorkerId(workers[0].id);
    }
  };

  // 5. Submit Assignment
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignDialogComplaint || !selectedWorkerId) return;

    setIsAssigning(true);
    setAssignError(null);

    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint_id: assignDialogComplaint.id,
          worker_id: selectedWorkerId,
          notes: assignmentNotes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to dispatch task');
      }

      setNotification({
        type: 'success',
        message: data.message || 'Worker successfully dispatched.',
      });

      // Update local complaints state with updated complaint
      if (data.complaint) {
        setComplaints((prev) =>
          prev.map((c) => (c.id === data.complaint.id ? data.complaint : c))
        );
        if (detailModalComplaint?.id === data.complaint.id) {
          setDetailModalComplaint(data.complaint);
        }
      } else {
        await handleRefreshComplaints();
      }

      setAssignDialogComplaint(null);
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Assignment failed');
    } finally {
      setIsAssigning(false);
    }
  };

  // 6. Open Review Dialog
  const handleOpenReviewDialog = (complaint: ComplaintWithDetails) => {
    setReviewDialogComplaint(complaint);
    setReviewError(null);
    setReviewAction('approve');
    setReviewRemarks('');
  };

  // 7. Submit Review Action
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewDialogComplaint) return;

    if (!reviewRemarks.trim()) {
      setReviewError('Review remarks / evaluation notes are mandatory.');
      return;
    }

    setIsReviewing(true);
    setReviewError(null);

    try {
      const res = await fetch('/api/complaints/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint_id: reviewDialogComplaint.id,
          action: reviewAction,
          remarks: reviewRemarks.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to submit review');
      }

      setNotification({
        type: 'success',
        message: data.message || 'Review action recorded successfully.',
      });

      // Update local state
      if (data.complaint) {
        setComplaints((prev) =>
          prev.map((c) => (c.id === data.complaint.id ? data.complaint : c))
        );
        if (detailModalComplaint?.id === data.complaint.id) {
          setDetailModalComplaint(data.complaint);
        }
      } else {
        await handleRefreshComplaints();
      }

      setReviewDialogComplaint(null);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Review submission failed');
    } finally {
      setIsReviewing(false);
    }
  };

  // 8. Filtered Complaints Queue
  const filteredComplaints = React.useMemo(() => {
    return complaints.filter((c) => {
      // Status filter
      if (statusFilter !== 'all' && c.status !== statusFilter) {
        return false;
      }
      // Ward filter
      if (wardFilter !== 'all' && c.ward_id !== wardFilter) {
        return false;
      }
      // Category filter
      if (categoryFilter !== 'all' && c.category !== categoryFilter) {
        return false;
      }
      // Search query (code or description)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const codeMatch = c.complaint_code.toLowerCase().includes(q);
        const descMatch = (c.description || '').toLowerCase().includes(q);
        const locMatch = (c.location_description || '').toLowerCase().includes(q);
        const wardMatch = (c.ward?.ward_name || '').toLowerCase().includes(q);
        if (!codeMatch && !descMatch && !locMatch && !wardMatch) {
          return false;
        }
      }
      return true;
    });
  }, [complaints, statusFilter, wardFilter, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header & Refresh Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Municipal Officer Operations
          </h1>
          <p className="text-sm text-slate-500">
            GMC Sector Grievance Administration &bull; Dispatch &bull; Quality Verification
          </p>
        </div>

        <div className="flex items-center gap-2">
          {underReviewCount > 0 && (
            <Button
              size="sm"
              onClick={() => setStatusFilter('under_review')}
              className="bg-indigo-700 hover:bg-indigo-800 text-white text-xs gap-1.5 shadow-xs"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              {underReviewCount} Under Review
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshComplaints}
            disabled={isRefreshing}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* Notification Toast Banner */}
      {notification && (
        <div
          className={`flex items-center justify-between rounded-xl border p-4 text-xs font-medium ${
            notification.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 ml-3"
          >
            &times;
          </button>
        </div>
      )}

      {/* Municipal Scope Banner */}
      <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-purple-900">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-purple-700 shrink-0" />
          <span>
            Designation: <strong>{session.user.designation}</strong> &bull; Municipal Officer Session
          </span>
        </div>
        <div className="flex items-center gap-2 text-purple-700">
          <MapPin className="h-3.5 w-3.5" />
          <span>GMC Evaluation Scope: 59 Provisional Wards Across Gwalior</span>
        </div>
      </div>

      {/* 4 Real Metric Stat Counters (Requirement D) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className={`border ${stat.borderColor} ${stat.bgColor}/50 shadow-2xs ${
                stat.highlight ? 'ring-2 ring-indigo-500/30' : ''
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
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bgColor} ${stat.color}`}
                >
                  <Icon className="h-6 w-6 stroke-[1.8]" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Complaint Overview Chart Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base font-semibold">City-Wide Complaint Metrics</CardTitle>
            <CardDescription>
              Real-time distribution computed directly from live Supabase grievance records
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
          <ComplaintOverviewChart timeframe={timeframe} complaints={complaints} />
        </CardContent>
      </Card>

      {/* Officer Operations Queue & Filters (Requirements 1 & 2) */}
      <Card className="shadow-2xs">
        <CardHeader className="p-5 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Officer Complaint Queue
                </CardTitle>
                <Badge variant="secondary" className="text-[11px]">
                  {filteredComplaints.length} of {complaints.length} complaints
                </Badge>
              </div>
              <CardDescription className="text-xs mt-0.5">
                Review citizen complaints, allocate field sanitation staff, and verify cleanup evidence
              </CardDescription>
            </div>

            {/* Quick Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'under_review', label: 'Under Review', count: underReviewCount },
                { id: 'submitted', label: 'Unassigned', count: complaints.filter((c) => c.status === 'submitted').length },
                { id: 'in_progress', label: 'In Progress', count: inProgressCount },
                { id: 'resolved', label: 'Resolved' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Filter Controls: Ward, Category, Search (Requirement 2) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search code, landmark..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>

            {/* Status Dropdown */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
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
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
              >
                <option value="all">All Wards (59 GMC Wards)</option>
                {wards.map((w) => (
                  <option key={w.ward_id} value={w.ward_id}>
                    Ward {w.ward_no}: {w.ward_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Dropdown */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
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

        <CardContent className="p-0">
          {filteredComplaints.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={ClipboardList}
                title="No complaints match active filters"
                description="Try clearing the status, ward, or category filters to view other city complaints."
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStatusFilter('all');
                      setWardFilter('all');
                      setCategoryFilter('all');
                      setSearchQuery('');
                    }}
                    className="text-xs"
                  >
                    Reset All Filters
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredComplaints.map((c) => {
                const statusInfo = STATUS_CONFIG[c.status] || {
                  label: c.status,
                  variant: 'secondary' as const,
                };
                const priorityVariant = PRIORITY_BADGES[c.priority] || 'default';
                const categoryLabel = CATEGORY_LABELS[c.category] || c.category;
                const activeAssignment =
                  (c.current_or_latest_assignment && !Array.isArray(c.current_or_latest_assignment)
                    ? c.current_or_latest_assignment
                    : null) ||
                  (c.active_assignment && !Array.isArray(c.active_assignment)
                    ? c.active_assignment
                    : null);
                const assignedWorker = activeAssignment?.worker;

                const isAssignable = ['submitted', 'assigned', 'rework_required'].includes(c.status);
                const isUnderReview = c.status === 'under_review';

                return (
                  <div
                    key={c.id}
                    className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-slate-50/80 ${
                      isUnderReview ? 'bg-indigo-50/20' : ''
                    }`}
                  >
                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {c.complaint_code}
                        </span>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        <Badge variant={priorityVariant} className="capitalize">
                          {c.priority}
                        </Badge>
                        {isUnderReview && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-800">
                            <ShieldAlert className="h-3 w-3" />
                            Evidence Ready
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-medium text-slate-800 flex items-center gap-2">
                        <span>{categoryLabel}</span>
                        {c.ward && (
                          <>
                            <span className="text-slate-300">&bull;</span>
                            <span className="text-slate-500">
                              Ward {c.ward.ward_no}: {c.ward.ward_name}
                            </span>
                          </>
                        )}
                      </div>

                      {c.location_description && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 line-clamp-1">
                          <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                          <span>{c.location_description}</span>
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(c.created_at)}
                        </span>
                        {assignedWorker && (
                          <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <HardHat className="h-3 w-3 text-amber-600" />
                            Worker: {assignedWorker.display_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {isUnderReview && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenReviewDialog(c)}
                          className="bg-indigo-700 hover:bg-indigo-800 text-white text-xs gap-1.5 shadow-2xs"
                        >
                          <ShieldAlert className="h-3.5 w-3.5" />
                          Review Cleanup
                        </Button>
                      )}

                      {isAssignable && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAssignDialog(c)}
                          className="text-xs gap-1.5"
                        >
                          <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                          {c.status === 'assigned' ? 'Reassign' : 'Assign Worker'}
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDetailModal(c)}
                        className="text-xs text-slate-600 hover:text-slate-900 gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Details
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* COMPLAINT DETAIL MODAL (Requirement 4) */}
      {detailModalComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in-0 zoom-in-95 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 font-mono">
                    {detailModalComplaint.complaint_code}
                  </h3>
                  <Badge
                    variant={
                      STATUS_CONFIG[detailModalComplaint.status]?.variant || 'secondary'
                    }
                  >
                    {STATUS_CONFIG[detailModalComplaint.status]?.label || detailModalComplaint.status}
                  </Badge>
                  <Badge variant={PRIORITY_BADGES[detailModalComplaint.priority] || 'default'}>
                    {detailModalComplaint.priority} priority
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Submitted on {formatDate(detailModalComplaint.created_at)} &bull; ID: {detailModalComplaint.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDetailModalComplaint(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 text-lg"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-5 text-xs text-slate-700">
              {/* Category & Location Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Sanitation Category
                  </span>
                  <p className="font-semibold text-slate-900">
                    {CATEGORY_LABELS[detailModalComplaint.category] || detailModalComplaint.category}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    GMC Ward & Zone
                  </span>
                  <p className="font-semibold text-slate-900">
                    {detailModalComplaint.ward
                      ? `Ward ${detailModalComplaint.ward.ward_no}: ${detailModalComplaint.ward.ward_name}`
                      : 'Ward GWL-W-024 (Lashkar Central)'}
                  </p>
                  {detailModalComplaint.ward?.sanitation_zone && (
                    <p className="text-slate-500 text-[11px]">
                      {detailModalComplaint.ward.sanitation_zone}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2 pt-2 border-t border-slate-200/60">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Physical Landmark & Description
                  </span>
                  <p className="text-slate-800">
                    {detailModalComplaint.location_description || 'No physical landmark description provided.'}
                  </p>
                  {detailModalComplaint.description && (
                    <p className="text-slate-600 mt-1 italic">
                      &ldquo;{detailModalComplaint.description}&rdquo;
                    </p>
                  )}
                </div>

                {/* GPS Coordinates */}
                {(detailModalComplaint.latitude || detailModalComplaint.longitude) && (
                  <div className="sm:col-span-2 flex items-center gap-2 text-slate-500 text-[11px] pt-1">
                    <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span>
                      GPS: {detailModalComplaint.latitude?.toFixed(5)}, {detailModalComplaint.longitude?.toFixed(5)}
                      {detailModalComplaint.location_accuracy_m && (
                        <> (&plusmn;{Math.round(detailModalComplaint.location_accuracy_m)}m accuracy)</>
                      )}
                      &bull; Source: {detailModalComplaint.location_source || 'gps'}
                    </span>
                  </div>
                )}
              </div>

              {/* DUAL BEFORE & AFTER PHOTOGRAPHIC EVIDENCE VIEWER */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-blue-600" />
                    Photographic Cleanup Proof & Evidence
                  </h4>
                  {isDetailLoading && (
                    <span className="text-[11px] text-blue-600 flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading signed private URLs...
                    </span>
                  )}
                </div>

                {(() => {
                  const images = detailModalComplaint.images || [];
                  const beforeImg = images.find(
                    (i) => i.image_type === 'before' || i.image_type === 'original'
                  );
                  const afterImg = images.find(
                    (i) => i.image_type === 'after'
                  );

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Before Photo */}
                      <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                        <div className="bg-slate-100/80 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between">
                          <span className="font-semibold text-slate-700 text-[11px]">
                            Citizen Grievance Photo (Before)
                          </span>
                          <Badge variant="outline" className="text-[10px] py-0">
                            complaint-originals
                          </Badge>
                        </div>
                        <div className="p-3 flex flex-col items-center justify-center min-h-[160px]">
                          {beforeImg?.signed_url ? (
                            <div
                              className="relative h-44 w-full rounded-lg overflow-hidden cursor-pointer group"
                              onClick={() =>
                                setPreviewPhoto({
                                  url: beforeImg.signed_url!,
                                  title: `Before Cleanup Evidence: ${detailModalComplaint.complaint_code}`,
                                  subtitle: `Bucket: complaint-originals &bull; Path: ${beforeImg.object_path}`,
                                })
                              }
                            >
                              <Image
                                src={beforeImg.signed_url}
                                alt="Before cleanup"
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs gap-1 font-medium">
                                <Eye className="h-4 w-4" /> Click to Inspect
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-6 text-slate-400">
                              <p className="text-xs">No before photo available</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* After Photo */}
                      <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                        <div className="bg-slate-100/80 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between">
                          <span className="font-semibold text-slate-700 text-[11px]">
                            Sanitation Worker Proof (After)
                          </span>
                          <Badge variant="outline" className="text-[10px] py-0">
                            cleanup-evidence
                          </Badge>
                        </div>
                        <div className="p-3 flex flex-col items-center justify-center min-h-[160px]">
                          {afterImg?.signed_url ? (
                            <div
                              className="relative h-44 w-full rounded-lg overflow-hidden cursor-pointer group"
                              onClick={() =>
                                setPreviewPhoto({
                                  url: afterImg.signed_url!,
                                  title: `After Cleanup Evidence: ${detailModalComplaint.complaint_code}`,
                                  subtitle: `Bucket: cleanup-evidence &bull; Path: ${afterImg.object_path}`,
                                })
                              }
                            >
                              <Image
                                src={afterImg.signed_url}
                                alt="After cleanup"
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs gap-1 font-medium">
                                <Eye className="h-4 w-4" /> Click to Inspect
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-6 text-slate-400">
                              <p className="text-xs">
                                {detailModalComplaint.status === 'under_review'
                                  ? 'Evidence photo processing...'
                                  : 'Cleanup proof not uploaded yet'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* ACTIVE WORKER ASSIGNMENT CARD */}
              {(() => {
                const activeAssignment =
                  (detailModalComplaint.current_or_latest_assignment &&
                  !Array.isArray(detailModalComplaint.current_or_latest_assignment)
                    ? detailModalComplaint.current_or_latest_assignment
                    : null) ||
                  (detailModalComplaint.active_assignment &&
                  !Array.isArray(detailModalComplaint.active_assignment)
                    ? detailModalComplaint.active_assignment
                    : null);
                const worker = activeAssignment?.worker;

                return (
                  <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/70">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                        <HardHat className="h-3.5 w-3.5 text-amber-600" />
                        Sanitation Worker Assignment
                      </span>
                      {activeAssignment && (
                        <Badge variant="secondary" className="capitalize text-[10px]">
                          Task: {activeAssignment.status}
                        </Badge>
                      )}
                    </div>

                    {activeAssignment && worker ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1">
                        <div>
                          <span className="text-slate-400 block">Worker</span>
                          <span className="font-medium text-slate-900">{worker.display_name}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Dispatched</span>
                          <span>{formatDate(activeAssignment.assigned_at)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Completed</span>
                          <span>
                            {activeAssignment.completed_at
                              ? formatDate(activeAssignment.completed_at)
                              : 'Pending field completion'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs italic">
                        No active sanitation worker currently dispatched to this complaint.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* COMPLAINT AUDIT HISTORY TIMELINE (Requirement 4) */}
              <div>
                <h4 className="font-semibold text-slate-900 text-xs flex items-center gap-1.5 mb-2">
                  <History className="h-3.5 w-3.5 text-blue-600" />
                  Chronological Lifecycle History
                </h4>

                <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-48 overflow-y-auto bg-white">
                  {(detailModalComplaint.history || []).length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      No audit history logged.
                    </div>
                  ) : (
                    (detailModalComplaint.history || []).map((h) => (
                      <div key={h.id} className="p-2.5 text-xs flex items-start gap-2.5">
                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800 capitalize">
                              {h.action.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatDate(h.created_at)}
                            </span>
                          </div>
                          {h.remarks && (
                            <p className="text-slate-600 text-[11px] mt-0.5">
                              &ldquo;{h.remarks}&rdquo;
                            </p>
                          )}
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Status:{' '}
                            <span className="text-slate-600">{h.old_status || 'initial'}</span> &rarr;{' '}
                            <span className="font-medium text-slate-800">{h.new_status}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailModalComplaint(null)}
                className="text-xs"
              >
                Close View
              </Button>

              <div className="flex items-center gap-2">
                {detailModalComplaint.status === 'under_review' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      const c = detailModalComplaint;
                      setDetailModalComplaint(null);
                      handleOpenReviewDialog(c);
                    }}
                    className="bg-indigo-700 hover:bg-indigo-800 text-white text-xs gap-1.5"
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Review Cleanup Evidence
                  </Button>
                )}

                {['submitted', 'assigned', 'rework_required'].includes(detailModalComplaint.status) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const c = detailModalComplaint;
                      setDetailModalComplaint(null);
                      handleOpenAssignDialog(c);
                    }}
                    className="text-xs gap-1.5"
                  >
                    <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                    {detailModalComplaint.status === 'assigned' ? 'Reassign Worker' : 'Assign Worker'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WORKER ASSIGNMENT DIALOG (Requirement 5) */}
      {assignDialogComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in-0 zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {assignDialogComplaint.status === 'assigned'
                    ? 'Reassign Sanitation Worker'
                    : 'Dispatch Sanitation Field Worker'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complaint {assignDialogComplaint.complaint_code} &bull;{' '}
                  {CATEGORY_LABELS[assignDialogComplaint.category] || assignDialogComplaint.category}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssignDialogComplaint(null)}
                className="text-slate-400 hover:text-slate-600 p-1 text-base"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
              {assignError && (
                <div className="rounded-lg bg-red-50 p-2.5 text-red-800 text-xs border border-red-200">
                  {assignError}
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Select Sanitation Field Worker *
                </label>
                <select
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  required
                >
                  {workers.length === 0 ? (
                    <option value="">No active workers found</option>
                  ) : (
                    workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.display_name} (Ward: {w.ward_id || 'GWL-W-012'})
                      </option>
                    ))
                  )}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Field staff allocated to Sector GWL-W-012 / Morar Central.
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Operational Dispatch Instructions / Remarks
                </label>
                <textarea
                  rows={3}
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  placeholder="e.g. Inspect drainage block near post office corner and clear with hydraulic jetting..."
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  maxLength={1000}
                />
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Audited into complaint history remarks upon task dispatch.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAssignDialogComplaint(null)}
                  disabled={isAssigning}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isAssigning || !selectedWorkerId}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Dispatching...
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-3.5 w-3.5" />
                      Confirm Task Allocation
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICER REVIEW DIALOG (Requirements 6 & 7) */}
      {reviewDialogComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-in fade-in-0 zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Review &amp; Verify Cleanup Operations
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complaint {reviewDialogComplaint.complaint_code} &bull;{' '}
                  {CATEGORY_LABELS[reviewDialogComplaint.category] || reviewDialogComplaint.category}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewDialogComplaint(null)}
                className="text-slate-400 hover:text-slate-600 p-1 text-base"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              {reviewError && (
                <div className="rounded-lg bg-red-50 p-2.5 text-red-800 text-xs border border-red-200">
                  {reviewError}
                </div>
              )}

              {/* Review Action Options (Requirement 6) */}
              <div>
                <label className="font-semibold text-slate-700 block mb-2">
                  Select Officer Evaluation Decision *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Approve */}
                  <label
                    className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                      reviewAction === 'approve'
                        ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20 text-emerald-900'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reviewAction"
                      value="approve"
                      checked={reviewAction === 'approve'}
                      onChange={() => setReviewAction('approve')}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Approve
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Target: <strong>resolved</strong>
                    </span>
                  </label>

                  {/* Rework */}
                  <label
                    className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                      reviewAction === 'rework'
                        ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20 text-amber-900'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reviewAction"
                      value="rework"
                      checked={reviewAction === 'rework'}
                      onChange={() => setReviewAction('rework')}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <RotateCcw className="h-4 w-4 text-amber-600" />
                      Rework
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Target: <strong>rework_req</strong>
                    </span>
                  </label>

                  {/* Reject */}
                  <label
                    className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                      reviewAction === 'reject'
                        ? 'border-red-500 bg-red-50/50 ring-2 ring-red-500/20 text-red-900'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reviewAction"
                      value="reject"
                      checked={reviewAction === 'reject'}
                      onChange={() => setReviewAction('reject')}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Reject
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Target: <strong>rejected</strong>
                    </span>
                  </label>
                </div>
              </div>

              {/* Remarks Field (Requirement 7) */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Evaluation Remarks &amp; Feedback *
                </label>
                <textarea
                  rows={4}
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder={
                    reviewAction === 'approve'
                      ? 'e.g. Field cleanup verified against citizen photograph. Waste cleared and lime sanitized.'
                      : reviewAction === 'rework'
                      ? 'e.g. Residual debris remains along road curb. Re-sweep and remove roadside rubble.'
                      : 'e.g. Grievance out of scope for municipal sanitation division.'
                  }
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  maxLength={1000}
                  required
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>Mandatory audit remarks stored in complaint_history</span>
                  <span>{reviewRemarks.length}/1000</span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReviewDialogComplaint(null)}
                  disabled={isReviewing}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isReviewing || !reviewRemarks.trim()}
                  className={`text-white text-xs gap-1.5 ${
                    reviewAction === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : reviewAction === 'rework'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isReviewing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving Decision...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Submit Review Decision
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL PHOTO INSPECTION MODAL */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-xs"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white p-4 shadow-2xl animate-in fade-in-0 zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">{previewPhoto.title}</h3>
                {previewPhoto.subtitle && (
                  <p className="text-[11px] text-slate-400 mt-0.5">{previewPhoto.subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                &times;
              </button>
            </div>
            <div className="relative h-96 w-full my-3 rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center">
              <Image
                src={previewPhoto.url}
                alt={previewPhoto.title}
                fill
                className="object-contain"
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button size="sm" variant="outline" onClick={() => setPreviewPhoto(null)} className="text-xs">
                Close Inspector
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
