'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  HardHat,
  ShieldCheck,
  Sparkles,
  Layers,
  History,
  Clock,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Loader2,
  Eye,
  Camera,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';
import type { ComplaintWithDetails, VisionVerificationMetrics, ComplaintStatus } from '@/types';

interface ComplaintTrackingViewProps {
  complaint: ComplaintWithDetails;
  currentRole?: 'citizen' | 'worker' | 'officer' | null;
}

export function ComplaintTrackingView({
  complaint: initialComplaint,
  currentRole,
}: ComplaintTrackingViewProps) {
  const { t, language } = useLanguage();
  const isHi = language === 'hi';

  const [complaint, setComplaint] = React.useState<ComplaintWithDetails>(initialComplaint);
  const [activePhoto, setActivePhoto] = React.useState<{ url: string; title: string; subtitle?: string } | null>(null);
  const [photoError, setPhotoError] = React.useState<boolean>(false);
  const [photoLoading, setPhotoLoading] = React.useState<boolean>(true);

  // Gemini Vision interactive state for officer
  const [isVerifying, setIsVerifying] = React.useState<boolean>(false);
  const [verifyError, setVerifyError] = React.useState<string | null>(null);
  const [showReverifyConfirm, setShowReverifyConfirm] = React.useState<boolean>(false);

  // Find images
  const citizenImage = complaint.images?.find((i) => i.image_type === 'before' || i.image_type === 'original') || complaint.images?.[0];
  const workerImage = complaint.images?.find((i) => i.image_type === 'after');

  // Normalized verification record
  const rawVerif = complaint.ai_verification;
  const verification = Array.isArray(rawVerif)
    ? (rawVerif.length > 0 ? rawVerif[rawVerif.length - 1] : null)
    : rawVerif;
  const metrics = verification?.metrics as unknown as VisionVerificationMetrics | undefined;
  const isFailed = verification?.processing_status === 'failed';
  const isCompleted = verification?.processing_status === 'completed' && Boolean(metrics);

  // Active assignment
  const assignment = complaint.current_or_latest_assignment || complaint.active_assignment;
  const assignedWorker = assignment?.worker;

  // Category and Status labels
  const categoryLabel = t(`complaints.categories.${complaint.category}.label`) || complaint.category;
  const statusLabel = t(`complaints.statuses.${complaint.status}`) || complaint.status;

  const getStatusBadgeVariant = (status: ComplaintStatus) => {
    switch (status) {
      case 'submitted':
        return 'submitted';
      case 'assigned':
        return 'assigned';
      case 'in_progress':
        return 'in_progress';
      case 'under_review':
        return 'under_review';
      case 'rework_required':
        return 'rework_required';
      case 'resolved':
        return 'resolved';
      case 'rejected':
        return 'rejected';
      default:
        return 'outline';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const dashboardHref =
    currentRole === 'citizen'
      ? '/citizen'
      : currentRole === 'worker'
      ? '/worker'
      : currentRole === 'officer'
      ? '/officer'
      : '/swachh-gwalior';

  // Handle officer triggering Gemini Vision verification
  const handleTriggerVerification = async (forceRecheck = false) => {
    if (currentRole !== 'officer') return;
    setIsVerifying(true);
    setVerifyError(null);
    setShowReverifyConfirm(false);

    try {
      const res = await fetch(`/api/complaints/${complaint.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force_recheck: forceRecheck }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'AI verification request failed');
      }

      // Re-fetch complaint with fresh signed URLs and updated verification
      const compRes = await fetch(`/api/complaints/${complaint.id}`);
      const compData = await compRes.json();
      if (compData.success && compData.complaint) {
        setComplaint(compData.complaint);
      }
    } catch (err) {
      console.error('Gemini verification error:', err);
      setVerifyError(err instanceof Error ? err.message : 'Unknown verification error');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={dashboardHref}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-civic-700 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{t('tracking.backToDashboard')}</span>
        </Link>

        {currentRole && (
          <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            <ShieldCheck className="h-3.5 w-3.5 text-civic-700" />
            <span className="font-medium text-slate-700 capitalize">
              {currentRole === 'citizen'
                ? t('tracking.citizenScope')
                : currentRole === 'worker'
                ? t('tracking.workerScope')
                : t('tracking.officerScope')}
            </span>
          </div>
        )}
      </div>

      {/* Main Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-base font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                {complaint.complaint_code}
              </span>
              <Badge variant={getStatusBadgeVariant(complaint.status)} className="text-xs px-2.5 py-0.5">
                {statusLabel}
              </Badge>
              <Badge variant={getPriorityBadgeVariant(complaint.priority)} className="capitalize text-xs">
                {t(`complaints.priorities.${complaint.priority}`) || complaint.priority}
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{categoryLabel}</h1>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>
                {t('tracking.reportedOn')} {formatDate(complaint.created_at)}
              </span>
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-civic-700 shrink-0" />
              <strong className="text-slate-800">
                {complaint.ward
                  ? `Ward ${complaint.ward.ward_no}: ${complaint.ward.ward_name}`
                  : complaint.ward_id || (isHi ? 'वार्ड क्षेत्र' : 'Ward Area')}
              </strong>
            </span>
            {complaint.location_description && (
              <span className="text-slate-600 italic max-w-xs sm:text-right">
                &ldquo;{complaint.location_description}&rdquo;
              </span>
            )}
          </div>
        </div>

        {complaint.description && (
          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
              {complaint.description}
            </p>
          </div>
        )}
      </div>

      {/* Grid: Evidence Photos & Sanitation Team */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Photographic Evidence Card */}
        <Card className="shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4 text-civic-700" />
              {t('tracking.evidenceTitle')}
            </CardTitle>
            <CardDescription className="text-xs">
              {t('tracking.aiVerificationSubtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Citizen Before Photo */}
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex flex-col">
                <div className="p-2 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    {t('tracking.citizenBeforePhoto')}
                  </span>
                </div>
                <div className="relative aspect-4/3 w-full bg-slate-100">
                  {citizenImage?.signed_url ? (
                    <div
                      onClick={() =>
                        setActivePhoto({
                          url: citizenImage.signed_url!,
                          title: t('tracking.citizenBeforePhoto'),
                          subtitle: `${complaint.complaint_code} • ${formatDate(complaint.created_at)}`,
                        })
                      }
                      className="relative h-full w-full cursor-pointer group"
                    >
                      <Image
                        src={citizenImage.signed_url}
                        alt="Citizen submitted grievance evidence"
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-102 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{t('common.enlargePhoto')}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-slate-400 p-4 text-center">
                      <Camera className="h-8 w-8 stroke-[1.2] mb-1" />
                      <span className="text-[11px]">{t('officer.detailModal.noPhotoUploaded')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Worker After Photo */}
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex flex-col">
                <div className="p-2 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {t('tracking.workerAfterPhoto')}
                  </span>
                </div>
                <div className="relative aspect-4/3 w-full bg-slate-100">
                  {workerImage?.signed_url ? (
                    <div
                      onClick={() =>
                        setActivePhoto({
                          url: workerImage.signed_url!,
                          title: t('tracking.workerAfterPhoto'),
                          subtitle: `${complaint.complaint_code} • Field Cleanup Resolution`,
                        })
                      }
                      className="relative h-full w-full cursor-pointer group"
                    >
                      <Image
                        src={workerImage.signed_url}
                        alt="Sanitation worker completed cleanup evidence"
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-102 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{t('common.enlargePhoto')}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-slate-400 p-4 text-center">
                      <Clock className="h-8 w-8 stroke-[1.2] mb-1 text-slate-300" />
                      <span className="text-[11px] leading-tight text-slate-500">
                        {t('tracking.awaitingCleanup')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Field Sanitation Team Card */}
        <Card className="shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <HardHat className="h-4 w-4 text-amber-600" />
              {t('tracking.fieldSanitationTitle')}
            </CardTitle>
            <CardDescription className="text-xs">
              Sanitation worker dispatch and field execution milestones.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {assignedWorker ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                  <div className="h-9 w-9 rounded-full bg-amber-200 text-amber-900 font-bold flex items-center justify-center text-xs shrink-0">
                    {assignedWorker.display_name?.charAt(0) || 'W'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900">{assignedWorker.display_name}</p>
                    <p className="text-[11px] text-slate-500">
                      {assignedWorker.ward_id ? `Assigned to Ward ${assignedWorker.ward_id}` : 'GMC Sanitation Field Worker'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      {t('tracking.assignedOn')}
                    </span>
                    <span className="font-medium text-slate-800">
                      {assignment?.assigned_at ? formatDate(assignment.assigned_at) : '—'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      {t('tracking.workStartedOn')}
                    </span>
                    <span className="font-medium text-slate-800">
                      {assignment?.started_at ? formatDate(assignment.started_at) : (isHi ? 'प्रतीक्षारत' : 'Pending start')}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 sm:col-span-2">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      {t('tracking.cleanupCompletedOn')}
                    </span>
                    <span className="font-medium text-slate-800">
                      {assignment?.completed_at ? formatDate(assignment.completed_at) : (isHi ? 'प्रतीक्षारत' : 'In field / Pending completion')}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 text-center space-y-1.5">
                <Clock className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-800">{t('tracking.unassignedWorker')}</p>
                <p className="text-[11px] text-slate-500">{t('tracking.unassignedWorkerDesc')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gemini Vision AI Verification Section (Phase 3) */}
      <Card className="border-indigo-200/90 bg-gradient-to-b from-indigo-50/40 via-white to-white shadow-xs">
        <CardHeader className="pb-3 border-b border-indigo-100/80">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  {t('tracking.aiVerificationTitle')}
                  <Badge variant="outline" className="text-[10px] bg-indigo-50 border-indigo-200 text-indigo-700">
                    {verification?.model_name || t('officer.verification.model')}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  {t('tracking.aiVerificationSubtitle')}
                </CardDescription>
              </div>
            </div>

            {/* Officer Trigger Controls */}
            {currentRole === 'officer' && complaint.status === 'under_review' && (
              <div className="flex items-center gap-2">
                {isVerifying ? (
                  <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium px-2.5 py-1 bg-indigo-50 rounded-lg">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{t('officer.verification.analyzing')}</span>
                  </div>
                ) : !verification ? (
                  <Button
                    size="sm"
                    onClick={() => handleTriggerVerification(false)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 shadow-xs"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{t('officer.verification.runVerification')}</span>
                  </Button>
                ) : isFailed ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTriggerVerification(true)}
                    className="text-xs text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>{t('officer.verification.runVerification')}</span>
                  </Button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleTriggerVerification(false)}
                      className="text-xs text-slate-600 hover:text-slate-900 gap-1"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>{t('common.refresh')}</span>
                    </Button>

                    {showReverifyConfirm ? (
                      <div className="flex items-center gap-1 bg-amber-50 p-1 rounded-lg border border-amber-200 text-[11px]">
                        <span className="text-amber-800 font-medium">Re-run analysis?</span>
                        <Button
                          size="sm"
                          onClick={() => handleTriggerVerification(true)}
                          className="bg-amber-600 hover:bg-amber-700 text-white h-6 px-2 text-[10px]"
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowReverifyConfirm(false)}
                          className="h-6 px-1.5 text-[10px]"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowReverifyConfirm(true)}
                        className="text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50 gap-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Re-analyze</span>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {verifyError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Verification Error</strong>
                <span>{verifyError}</span>
              </div>
            </div>
          )}

          {isCompleted && metrics ? (
            <div className="space-y-4 text-xs">
              {/* Summary Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white border border-indigo-100 shadow-2xs">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">
                    {t('tracking.confidence')}
                  </span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Badge
                      variant={
                        metrics.evaluation.confidenceLevel === 'high'
                          ? 'resolved'
                          : metrics.evaluation.confidenceLevel === 'medium'
                          ? 'assigned'
                          : 'outline'
                      }
                      className="capitalize"
                    >
                      {metrics.evaluation.confidenceLevel}
                    </Badge>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-indigo-100 shadow-2xs">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">
                    {t('tracking.wasteReduction')}
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-extrabold text-emerald-700">
                      {typeof metrics.evaluation.wasteReductionEstimate === 'number'
                        ? `${metrics.evaluation.wasteReductionEstimate}%`
                        : typeof verification?.waste_reduction_percentage === 'number'
                        ? `${verification.waste_reduction_percentage}%`
                        : 'Inconclusive'}
                    </span>
                    <span className="text-[10px] text-slate-400">cleanliness delta</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-indigo-100 shadow-2xs">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">
                    Analysis Timestamp
                  </span>
                  <div className="mt-1 font-medium text-slate-800">
                    {verification?.created_at ? formatDate(verification.created_at) : 'Recent'}
                  </div>
                </div>
              </div>

              {/* Officer Summary Text */}
              {metrics.officerSummary && (
                <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
                  <h5 className="font-bold text-slate-900 mb-1 text-xs">AI Advisory Summary</h5>
                  <p className="text-slate-700 leading-relaxed">{metrics.officerSummary}</p>
                </div>
              )}

              {/* Before & After Observations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <h5 className="font-semibold text-slate-800 mb-1.5 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    {t('tracking.beforeObservations')}
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                    {metrics.beforeObservations.wasteIdentified?.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                    {metrics.beforeObservations.approximateSpread && (
                      <li className="italic text-slate-500">
                        Spread: {metrics.beforeObservations.approximateSpread}
                      </li>
                    )}
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <h5 className="font-semibold text-slate-800 mb-1.5 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {t('tracking.afterObservations')}
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                    {metrics.afterObservations.visibleSurfaces?.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                    {metrics.afterObservations.remainingDebris && metrics.afterObservations.remainingDebris.length > 0 ? (
                      <li className="text-amber-700">
                        Remaining: {metrics.afterObservations.remainingDebris.join(', ')}
                      </li>
                    ) : (
                      <li className="text-emerald-700 font-medium">No significant refuse remaining</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Visible Changes */}
              {metrics.comparativeFindings?.changesObserved && metrics.comparativeFindings.changesObserved.length > 0 && (
                <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <h5 className="font-semibold text-emerald-900 mb-1 text-xs">
                    {t('tracking.visibleChanges')}
                  </h5>
                  <ul className="list-disc list-inside space-y-0.5 text-emerald-800 text-[11px]">
                    {metrics.comparativeFindings.changesObserved.map((change, idx) => (
                      <li key={idx}>{change}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Limitations Notice */}
              {metrics.comparisonLimitations?.limitationNotes && metrics.comparisonLimitations.limitationNotes.length > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">{t('tracking.limitations')}: </span>
                    <span>{metrics.comparisonLimitations.limitationNotes.join('. ')}</span>
                  </div>
                </div>
              )}

              {/* Mandatory Advisory Notice */}
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-[11px] flex items-start gap-2">
                <Info className="h-4 w-4 text-civic-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{t('tracking.advisoryNotice')}</p>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/30 text-center space-y-2">
              <Sparkles className="h-8 w-8 text-indigo-400 mx-auto" />
              <h5 className="font-semibold text-slate-800 text-xs">{t('tracking.notTriggeredTitle')}</h5>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                {t('tracking.notTriggeredDesc')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Human Officer Decision & Authority Section */}
      <Card className="shadow-2xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-civic-700" />
            {t('tracking.humanReviewTitle')}
          </CardTitle>
          <CardDescription className="text-xs">
            {t('tracking.humanAuthorityDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase">
                {t('common.status')}
              </span>
              <Badge variant={getStatusBadgeVariant(complaint.status)}>
                {statusLabel}
              </Badge>
            </div>

            {complaint.status === 'resolved' ? (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium">
                ✓ {t('tracking.decisionApproved')}
              </div>
            ) : complaint.status === 'rework_required' ? (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
                ⚠ {t('tracking.decisionRework')}
              </div>
            ) : complaint.status === 'rejected' ? (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs font-medium">
                ✕ {t('tracking.decisionRejected')}
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs">
                {t('tracking.decisionPending')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chronological Audit Trail (complaint_history) */}
      <Card className="shadow-2xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <History className="h-4 w-4 text-slate-600" />
            {t('tracking.auditTimelineTitle')}
          </CardTitle>
          <CardDescription className="text-xs">
            Immutable system state transitions and administrative actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {!complaint.history || complaint.history.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">No history events logged.</p>
          ) : (
            <div className="space-y-3">
              {complaint.history.map((event, idx) => (
                <div
                  key={event.id || idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 text-xs"
                >
                  <div className="h-6 w-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="font-bold text-slate-900 capitalize">
                        {event.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {formatDate(event.created_at)}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      <span>Status transition: </span>
                      <span className="font-medium text-slate-700">{event.old_status || 'initial'}</span>
                      {' → '}
                      <span className="font-bold text-slate-900">{event.new_status}</span>
                    </div>

                    {event.remarks && (
                      <p className="text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-200 italic mt-1">
                        &ldquo;{event.remarks}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Citizen Guidance / Next Steps */}
      <div className="rounded-xl border border-civic-200 bg-civic-50/60 p-4 space-y-1 text-xs text-civic-900">
        <h5 className="font-bold flex items-center gap-1.5 text-civic-950">
          <Info className="h-4 w-4 text-civic-700" />
          {t('tracking.nextStepsTitle')}
        </h5>
        <p className="text-civic-800 leading-relaxed">
          {complaint.status === 'submitted'
            ? t('tracking.nextStepsSubmitted')
            : complaint.status === 'assigned'
            ? t('tracking.nextStepsAssigned')
            : complaint.status === 'in_progress'
            ? t('tracking.nextStepsInProgress')
            : complaint.status === 'under_review'
            ? t('tracking.nextStepsUnderReview')
            : complaint.status === 'rework_required'
            ? t('tracking.nextStepsRework')
            : complaint.status === 'resolved'
            ? t('tracking.nextStepsResolved')
            : t('tracking.nextStepsRejected')}
        </p>
      </div>

      {/* Lightbox Photo Preview Modal */}
      {activePhoto && (
        <div
          onClick={() => setActivePhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-xs animate-in fade-in-0 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl bg-white p-4 shadow-2xl animate-in zoom-in-95 cursor-default space-y-3"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{activePhoto.title}</h4>
                {activePhoto.subtitle && (
                  <p className="text-[11px] text-slate-500">{activePhoto.subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActivePhoto(null)}
                className="text-slate-400 hover:text-slate-600 p-1 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <div className="relative h-96 w-full rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
              {photoError ? (
                <div className="flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                  <AlertTriangle className="h-8 w-8 text-amber-400 mb-2" />
                  <p className="text-xs font-medium text-slate-300">{t('common.imageUnavailable')}</p>
                  <a
                    href={activePhoto.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 text-[11px] text-civic-400 underline hover:text-civic-300"
                  >
                    Direct Image Link
                  </a>
                </div>
              ) : (
                <Image
                  src={activePhoto.url}
                  alt={activePhoto.title}
                  fill
                  unoptimized
                  className="object-contain"
                  onLoad={() => setPhotoLoading(false)}
                  onError={() => {
                    setPhotoLoading(false);
                    setPhotoError(true);
                  }}
                />
              )}
              {photoLoading && !photoError && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40">
                  <Loader2 className="h-6 w-6 text-civic-400 animate-spin" />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <Button size="sm" variant="outline" onClick={() => setActivePhoto(null)} className="text-xs">
                {t('common.close')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
