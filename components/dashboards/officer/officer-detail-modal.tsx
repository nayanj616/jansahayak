'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  MapPin,
  Layers,
  HardHat,
  History,
  ShieldAlert,
  Loader2,
  Camera,
  Eye,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { OfficerVerificationCard } from './officer-verification-card';
import {
  CATEGORY_LABELS,
  STATUS_CONFIG,
  PRIORITY_BADGES,
  PhotoPreviewState,
} from './officer-types';
import type { ComplaintWithDetails } from '@/types';
import { useLanguage } from '@/lib/i18n/context';

interface OfficerDetailModalProps {
  complaint: ComplaintWithDetails | null;
  isDetailLoading: boolean;
  isVerifying: boolean;
  verifyError: string | null;
  onClose: () => void;
  onAssign: (complaint: ComplaintWithDetails) => void;
  onReview: (complaint: ComplaintWithDetails) => void;
  onPreviewPhoto: (photo: PhotoPreviewState) => void;
  onTriggerVerification: (complaintId: string, forceReverify?: boolean) => void;
}

export function OfficerDetailModal({
  complaint,
  isDetailLoading,
  isVerifying,
  verifyError,
  onClose,
  onAssign,
  onReview,
  onPreviewPhoto,
  onTriggerVerification,
}: OfficerDetailModalProps) {
  const { t } = useLanguage();

  // Close on Escape key
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && complaint) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [complaint, onClose]);

  if (!complaint) return null;

  const statusInfo = STATUS_CONFIG[complaint.status] || {
    label: complaint.status,
    variant: 'secondary' as const,
  };
  const localizedStatus = t(`complaints.statuses.${complaint.status}`) || statusInfo.label;
  const localizedPriority = t(`complaints.priorities.${complaint.priority}`) || complaint.priority;
  const priorityVariant = PRIORITY_BADGES[complaint.priority] || 'default';
  const categoryLabel = t(`complaints.categories.${complaint.category}`) || CATEGORY_LABELS[complaint.category] || complaint.category;

  const citizenImage = complaint.images?.find((img) => img.image_type === 'before' || img.image_type === 'original') || complaint.images?.[0];
  const workerImage = complaint.images?.find((img) => img.image_type === 'after') || complaint.images?.[1];

  const activeAssignment =
    (complaint.current_or_latest_assignment &&
    !Array.isArray(complaint.current_or_latest_assignment)
      ? complaint.current_or_latest_assignment
      : null) ||
    (complaint.active_assignment && !Array.isArray(complaint.active_assignment)
      ? complaint.active_assignment
      : null);
  const worker = activeAssignment?.worker;

  const isAssignable = ['submitted', 'assigned', 'rework_required'].includes(complaint.status);
  const isUnderReview = complaint.status === 'under_review';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in-0 zoom-in-95 my-8 max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 id="detail-modal-title" className="text-lg font-bold text-slate-900 font-mono">
                {complaint.complaint_code}
              </h3>
              <Badge variant={statusInfo.variant}>{localizedStatus}</Badge>
              <Badge variant={priorityVariant} className="capitalize">
                {localizedPriority}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Submitted on {formatDate(complaint.created_at)} &bull; ID: {complaint.id}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 text-xl leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-600"
            aria-label="Close complaint inspection modal"
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
              <p className="font-semibold text-slate-900">{categoryLabel}</p>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                GMC Ward & Zone
              </span>
              <p className="font-semibold text-slate-900">
                {complaint.ward
                  ? `Ward ${complaint.ward.ward_no}: ${complaint.ward.ward_name}`
                  : 'Ward GWL-W-024 (Lashkar Central)'}
              </p>
              {complaint.ward?.sanitation_zone && (
                <p className="text-slate-500 text-[11px]">{complaint.ward.sanitation_zone}</p>
              )}
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-slate-200/60">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Physical Landmark & Description
              </span>
              <p className="text-slate-800">
                {complaint.location_description || 'No physical landmark description provided.'}
              </p>
              {complaint.description && (
                <p className="text-slate-600 mt-1 italic">&ldquo;{complaint.description}&rdquo;</p>
              )}
            </div>

            {/* GPS Coordinates */}
            {(complaint.latitude || complaint.longitude) && (
              <div className="sm:col-span-2 flex items-center gap-2 text-slate-500 text-[11px] pt-1">
                <MapPin className="h-3.5 w-3.5 text-civic-700 shrink-0" aria-hidden="true" />
                <span>
                  GPS: {complaint.latitude?.toFixed(5)}, {complaint.longitude?.toFixed(5)}
                  {complaint.location_accuracy_m && (
                    <> (&plusmn;{Math.round(complaint.location_accuracy_m)}m accuracy)</>
                  )}
                  &bull; Source: {complaint.location_source || 'gps'}
                </span>
              </div>
            )}
          </div>

          {/* DUAL BEFORE & AFTER PHOTOGRAPHIC EVIDENCE VIEWER */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-civic-700" aria-hidden="true" />
                {t('officer.detailModal.evidenceTitle')}
              </h4>
              {isDetailLoading && (
                <span className="text-[11px] text-civic-700 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                  Loading signed private URLs...
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Before Photo */}
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex flex-col shadow-2xs">
                <div className="p-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
                    {t('officer.detailModal.citizenBeforePhoto')}
                  </span>
                  <span className="text-[10px] text-slate-500">Citizen Submission</span>
                </div>

                <div className="relative aspect-4/3 w-full bg-slate-200">
                  {citizenImage?.signed_url ? (
                    <div
                      onClick={() =>
                        onPreviewPhoto({
                          url: citizenImage.signed_url!,
                          title: t('officer.detailModal.citizenBeforePhoto'),
                          subtitle: `Reported on ${formatDate(complaint.created_at)} • ${complaint.complaint_code}`,
                        })
                      }
                      className="relative h-full w-full cursor-pointer group"
                    >
                      <Image
                        src={citizenImage.signed_url}
                        alt="Before cleanup initial complaint evidence"
                        fill
                        className="object-cover group-hover:scale-102 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1">
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        <span>Enlarge Photo</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-slate-400 p-4 text-center">
                      <Camera className="h-8 w-8 stroke-[1.2] mb-1" aria-hidden="true" />
                      <span>{t('officer.detailModal.noPhotoUploaded')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* After Photo */}
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex flex-col shadow-2xs">
                <div className="p-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                    {t('officer.detailModal.workerAfterPhoto')}
                  </span>
                  <span className="text-[10px] text-slate-500">Field Resolution</span>
                </div>

                <div className="relative aspect-4/3 w-full bg-slate-200">
                  {workerImage?.signed_url ? (
                    <div
                      onClick={() =>
                        onPreviewPhoto({
                          url: workerImage.signed_url!,
                          title: t('officer.detailModal.workerAfterPhoto'),
                          subtitle: `Submitted by field staff • ${complaint.complaint_code}`,
                        })
                      }
                      className="relative h-full w-full cursor-pointer group"
                    >
                      <Image
                        src={workerImage.signed_url}
                        alt="After cleanup completed work evidence"
                        fill
                        className="object-cover group-hover:scale-102 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1">
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        <span>Enlarge Photo</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-slate-400 p-4 text-center">
                      <Camera className="h-8 w-8 stroke-[1.2] mb-1" aria-hidden="true" />
                      <span>Pending field completion</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        Worker has not submitted proof
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* GEMINI VISION OBSERVATIONAL VERIFICATION CARD */}
          <OfficerVerificationCard
            complaint={complaint}
            isVerifying={isVerifying}
            verifyError={verifyError}
            onTriggerVerification={onTriggerVerification}
          />

          {/* ACTIVE WORKER ASSIGNMENT CARD */}
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/70">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                <HardHat className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                {t('officer.detailModal.workerAllocated')}
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
                {t('officer.detailModal.noWorkerAssigned')}
              </p>
            )}
          </div>

          {/* COMPLAINT AUDIT HISTORY TIMELINE */}
          <div>
            <h4 className="font-semibold text-slate-900 text-xs flex items-center gap-1.5 mb-2">
              <History className="h-3.5 w-3.5 text-civic-700" aria-hidden="true" />
              {t('officer.detailModal.historyTimeline')}
            </h4>

            <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-48 overflow-y-auto bg-white">
              {(complaint.history || []).length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  No audit history logged.
                </div>
              ) : (
                (complaint.history || []).map((h) => (
                  <div key={h.id} className="p-2.5 text-xs flex items-start gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-civic-600 mt-1.5 shrink-0" aria-hidden="true" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 capitalize">
                          {h.action.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400">{formatDate(h.created_at)}</span>
                      </div>
                      {h.remarks && (
                        <p className="text-slate-600 text-[11px] mt-0.5">&ldquo;{h.remarks}&rdquo;</p>
                      )}
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Status: <span className="text-slate-600">{h.old_status || 'initial'}</span> &rarr;{' '}
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
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            {t('officer.detailModal.closeView')}
          </Button>

          <div className="flex items-center gap-2">
            {isUnderReview && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  onClose();
                  onReview(complaint);
                }}
                className="text-xs gap-1.5 font-semibold"
              >
                <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t('officer.detailModal.reviewAction')}</span>
              </Button>
            )}

            {isAssignable && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onAssign(complaint);
                }}
                className="text-xs gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{complaint.status === 'rework_required' ? t('officer.detailModal.reassignAction') : t('officer.detailModal.assignAction')}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

