'use client';

import * as React from 'react';
import { RefreshCw, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';
import { OfficerMetricsBar } from './officer-metrics-bar';
import { OfficerChartPanel } from './officer-chart-panel';
import { OfficerFilterToolbar } from './officer-filter-toolbar';
import { OfficerQueueTable } from './officer-queue-table';
import { OfficerDetailModal } from './officer-detail-modal';
import { OfficerAssignModal } from './officer-assign-modal';
import { OfficerReviewDialog } from './officer-review-dialog';
import { OfficerPhotoModal } from './officer-photo-modal';
import type {
  ComplaintWithDetails,
  DemoSessionPayload,
  DemoUserRecord,
  WardRecord,
} from '@/types';
import type { PhotoPreviewState, OfficerNotificationState, Worker } from './officer-types';

interface OfficerViewProps {
  session: DemoSessionPayload;
  initialComplaints?: ComplaintWithDetails[];
  wards?: WardRecord[];
  workers?: DemoUserRecord[];
}

export function OfficerView({
  session,
  initialComplaints = [],
  wards = [],
  workers = [],
}: OfficerViewProps) {
  const { t } = useLanguage();
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

  // Vision Verification State
  const [isVerifying, setIsVerifying] = React.useState<boolean>(false);
  const [verifyError, setVerifyError] = React.useState<string | null>(null);

  // Photo Full-Preview Modal
  const [previewPhoto, setPreviewPhoto] = React.useState<PhotoPreviewState | null>(null);

  // Notification Banner
  const [notification, setNotification] = React.useState<OfficerNotificationState | null>(null);

  // 1. Dashboard Metrics derived independently of active UI filters
  const totalCount = complaints.length;
  const underReviewCount = complaints.filter((c) => c.status === 'under_review').length;
  const inProgressCount = complaints.filter((c) => ['assigned', 'in_progress'].includes(c.status)).length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;
  const unassignedCount = complaints.filter((c) => c.status === 'submitted').length;

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

  // 3. Open Detail Modal & Fetch On-Demand Signed URLs
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

  // 8. Run Multimodal Gemini Vision Verification
  const handleRunVerification = async (complaintId: string, forceRecheck: boolean = false) => {
    setIsVerifying(true);
    setVerifyError(null);

    try {
      const res = await fetch(`/api/complaints/${complaintId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force_recheck: forceRecheck }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Visual verification failed.');
      }

      const updatedVerification = data.verification;

      // Update detail modal state if open
      if (detailModalComplaint?.id === complaintId) {
        setDetailModalComplaint((prev) =>
          prev ? { ...prev, ai_verification: updatedVerification } : null
        );
      }

      // Update review dialog state if open
      if (reviewDialogComplaint?.id === complaintId) {
        setReviewDialogComplaint((prev) =>
          prev ? { ...prev, ai_verification: updatedVerification } : null
        );
      }

      // Update complaints list
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaintId ? { ...c, ai_verification: updatedVerification } : c
        )
      );

      setNotification({
        type: 'success',
        message: data.cached
          ? 'Retrieved cached verification findings.'
          : 'Visual verification completed successfully with Gemini Vision.',
      });
    } catch (err) {
      console.error('Failed to run visual verification:', err);
      const errMsg =
        err instanceof Error ? err.message : 'Visual verification encountered an error.';
      setVerifyError(errMsg);
      setNotification({
        type: 'error',
        message: errMsg,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // 9. Filtered Complaints Queue
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">
            {t('officer.dashboardTitle')}
          </h1>
          <p className="text-sm text-slate-500">
            {t('officer.dashboardSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {underReviewCount > 0 && (
            <Button
              size="sm"
              onClick={() => setStatusFilter('under_review')}
              className="bg-purple-700 hover:bg-purple-800 text-white text-xs gap-1.5 shadow-xs"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              {underReviewCount} {t('officer.underReviewBadge')}
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
            {isRefreshing ? t('officer.refreshing') : t('officer.refreshQueue')}
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

      {/* Municipal Scope Banner & Metric Cards */}
      <OfficerMetricsBar
        designation={session.user.designation || 'Sanitation Superintendent'}
        totalCount={totalCount}
        underReviewCount={underReviewCount}
        inProgressCount={inProgressCount}
        resolvedCount={resolvedCount}
        onFilterByStatus={(status) => setStatusFilter(status)}
        activeStatusFilter={statusFilter}
      />

      {/* Analytics Chart Panel */}
      <OfficerChartPanel
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        complaints={complaints}
      />

      {/* Complaint Queue Management Card */}
      <Card id="queue" className="shadow-2xs overflow-hidden">
        <OfficerFilterToolbar
          filteredCount={filteredComplaints.length}
          totalCount={totalCount}
          underReviewCount={underReviewCount}
          unassignedCount={unassignedCount}
          inProgressCount={inProgressCount}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          wardFilter={wardFilter}
          setWardFilter={setWardFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          wards={wards}
        />

        <OfficerQueueTable
          complaints={filteredComplaints}
          onInspect={handleOpenDetailModal}
          onAssign={handleOpenAssignDialog}
          onReview={handleOpenReviewDialog}
          onResetFilters={() => {
            setStatusFilter('all');
            setWardFilter('all');
            setCategoryFilter('all');
            setSearchQuery('');
          }}
          onPreviewPhoto={setPreviewPhoto}
        />
      </Card>

      {/* Detail Modal with Photo Inspection & Verification */}
      <OfficerDetailModal
        complaint={detailModalComplaint}
        isDetailLoading={isDetailLoading}
        isVerifying={isVerifying}
        verifyError={verifyError}
        onClose={() => setDetailModalComplaint(null)}
        onAssign={handleOpenAssignDialog}
        onReview={handleOpenReviewDialog}
        onPreviewPhoto={setPreviewPhoto}
        onTriggerVerification={handleRunVerification}
      />

      {/* Worker Assignment Modal */}
      <OfficerAssignModal
        complaint={assignDialogComplaint}
        workers={workers as unknown as Worker[]}
        selectedWorkerId={selectedWorkerId}
        onSelectWorkerId={setSelectedWorkerId}
        assignmentNotes={assignmentNotes}
        onChangeAssignmentNotes={setAssignmentNotes}
        isAssigning={isAssigning}
        assignError={assignError}
        onSubmit={handleAssignSubmit}
        onClose={() => setAssignDialogComplaint(null)}
      />

      {/* Officer Review & Verification Dialog */}
      <OfficerReviewDialog
        complaint={reviewDialogComplaint}
        reviewAction={reviewAction}
        onChangeReviewAction={setReviewAction}
        reviewRemarks={reviewRemarks}
        onChangeReviewRemarks={setReviewRemarks}
        isReviewing={isReviewing}
        reviewError={reviewError}
        onSubmit={handleReviewSubmit}
        onClose={() => setReviewDialogComplaint(null)}
      />

      {/* Full Photo Modal */}
      <OfficerPhotoModal
        previewPhoto={previewPhoto}
        onClose={() => setPreviewPhoto(null)}
      />
    </div>
  );
}

