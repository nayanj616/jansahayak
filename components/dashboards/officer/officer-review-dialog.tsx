'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, RotateCcw, XCircle, Loader2, Sparkles } from 'lucide-react';
import type { ComplaintWithDetails, VisionVerificationMetrics } from '@/types';
import { CATEGORY_LABELS } from './officer-types';
import { useLanguage } from '@/lib/i18n/context';
import { getLatestAiVerification } from '@/lib/verifications';

interface OfficerReviewDialogProps {
  complaint: ComplaintWithDetails | null;
  reviewAction: 'approve' | 'rework' | 'reject';
  onChangeReviewAction: (action: 'approve' | 'rework' | 'reject') => void;
  reviewRemarks: string;
  onChangeReviewRemarks: (remarks: string) => void;
  isReviewing: boolean;
  reviewError: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function OfficerReviewDialog({
  complaint,
  reviewAction,
  onChangeReviewAction,
  reviewRemarks,
  onChangeReviewRemarks,
  isReviewing,
  reviewError,
  onSubmit,
  onClose,
}: OfficerReviewDialogProps) {
  const { t } = useLanguage();
  if (!complaint) return null;

  const verification = getLatestAiVerification(complaint.ai_verification);
  const metrics = verification?.metrics as unknown as VisionVerificationMetrics | undefined;
  const categoryLabel = t(`complaints.categories.${complaint.category}.label`) || CATEGORY_LABELS[complaint.category] || complaint.category;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-in fade-in-0 zoom-in-95">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              {t('officer.reviewDialog.title')}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('officer.reviewDialog.complaintPrefix')} {complaint.complaint_code} &bull;{' '}
              {categoryLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('officer.reviewDialog.cancel')}
            className="text-slate-400 hover:text-slate-600 p-1 text-base"
          >
            &times;
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          {reviewError && (
            <div className="rounded-lg bg-red-50 p-2.5 text-red-800 text-xs border border-red-200">
              {reviewError}
            </div>
          )}

          {/* AI Verification Briefing in Review Dialog (Phase 4B.2) */}
          {metrics?.officerSummary && (
            <div className="rounded-lg bg-indigo-50/80 border border-indigo-200 p-3 text-xs">
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5 font-bold text-indigo-900 text-[11px]">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  {t('officer.reviewDialog.aiAdvisoryLabel')}
                </div>
                <Badge variant="outline" className="text-[10px] bg-white border-indigo-200 text-indigo-700 py-0 capitalize">
                  {t(`officer.verification.confidenceLevels.${metrics.evaluation.confidenceLevel}`) || metrics.evaluation.confidenceLevel} {t('officer.verification.confidence')}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-800 leading-relaxed">
                {metrics.officerSummary}
              </p>
              <p className="text-[10px] text-indigo-600/90 mt-1.5 italic">
                {t('officer.reviewDialog.aiAdvisoryDisclaimer')}
              </p>
            </div>
          )}

          {/* Review Action Options (Requirement 6) */}
          <div>
            <label className="font-semibold text-slate-700 block mb-2">
              {t('officer.reviewDialog.decisionLabel')}
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
                  onChange={() => onChangeReviewAction('approve')}
                  className="sr-only"
                />
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {t('officer.reviewDialog.approve')}
                </div>
                <span className="text-[11px] text-slate-500">
                  {t('officer.reviewDialog.approveTarget')}
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
                  onChange={() => onChangeReviewAction('rework')}
                  className="sr-only"
                />
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <RotateCcw className="h-4 w-4 text-amber-600" />
                  {t('officer.reviewDialog.rework')}
                </div>
                <span className="text-[11px] text-slate-500">
                  {t('officer.reviewDialog.reworkTarget')}
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
                  onChange={() => onChangeReviewAction('reject')}
                  className="sr-only"
                />
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <XCircle className="h-4 w-4 text-red-600" />
                  {t('officer.reviewDialog.reject')}
                </div>
                <span className="text-[11px] text-slate-500">
                  {t('officer.reviewDialog.rejectTarget')}
                </span>
              </label>
            </div>
          </div>

          {/* Remarks Field (Requirement 7) */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              {t('officer.reviewDialog.remarksLabel')}
            </label>
            <textarea
              rows={4}
              value={reviewRemarks}
              onChange={(e) => onChangeReviewRemarks(e.target.value)}
              placeholder={
                reviewAction === 'approve'
                  ? t('officer.reviewDialog.remarksPlaceholderApprove')
                  : reviewAction === 'rework'
                  ? t('officer.reviewDialog.remarksPlaceholderRework')
                  : t('officer.reviewDialog.remarksPlaceholderReject')
              }
              className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              maxLength={1000}
              required
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>{t('officer.reviewDialog.remarksAuditHelp')}</span>
              <span>{reviewRemarks.length}/1000</span>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isReviewing}
              className="text-xs"
            >
              {t('officer.reviewDialog.cancel')}
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
                  {t('officer.reviewDialog.submitting')}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t('officer.reviewDialog.submitDecision')}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

