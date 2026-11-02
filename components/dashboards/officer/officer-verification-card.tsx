'use client';

import * as React from 'react';
import {
  Sparkles,
  Loader2,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ComplaintWithDetails, VisionVerificationMetrics } from '@/types';

interface OfficerVerificationCardProps {
  complaint: ComplaintWithDetails;
  isVerifying: boolean;
  verifyError: string | null;
  onTriggerVerification: (complaintId: string, forceReverify?: boolean) => void;
}

export function OfficerVerificationCard({
  complaint,
  isVerifying,
  verifyError,
  onTriggerVerification,
}: OfficerVerificationCardProps) {
  const [showReverifyConfirm, setShowReverifyConfirm] = React.useState(false);

  const verification = complaint.ai_verification;
  const metrics = verification?.metrics as unknown as VisionVerificationMetrics | undefined;
  const status = verification?.processing_status;
  const isFailed = status === 'failed';
  const isCompleted = status === 'completed' && Boolean(metrics);

  return (
    <div className="rounded-xl border border-indigo-200/90 bg-gradient-to-b from-indigo-50/50 via-white to-white p-4 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100/80 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-xs">
                AI Cleanliness Verification Analysis
              </span>
              <Badge
                variant="outline"
                className="text-[10px] bg-indigo-50 border-indigo-200 text-indigo-700 font-medium"
              >
                {verification?.model_name || 'gemini-3.8-flash'}
              </Badge>
            </div>
            <span className="text-[11px] text-slate-500 block">
              Multimodal comparative observation assisting municipal review.
            </span>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-1.5">
          {isVerifying ? (
            <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium px-2 py-1 bg-indigo-50 rounded-lg">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              <span>Analyzing with Gemini Vision...</span>
            </div>
          ) : !verification ? (
            <Button
              size="sm"
              onClick={() => onTriggerVerification(complaint.id)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Run AI Verification</span>
            </Button>
          ) : isFailed ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onTriggerVerification(complaint.id, true)}
              className="text-xs text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Retry Verification</span>
            </Button>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onTriggerVerification(complaint.id, false)}
                className="text-xs text-slate-600 hover:text-slate-900 gap-1"
                title="Check cached findings"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Refresh</span>
              </Button>

              {showReverifyConfirm ? (
                <div className="flex items-center gap-1 bg-amber-50 p-1 rounded-lg border border-amber-200 text-[11px]">
                  <span className="text-amber-800 font-medium">Re-analyze?</span>
                  <Button
                    size="sm"
                    onClick={() => {
                      setShowReverifyConfirm(false);
                      onTriggerVerification(complaint.id, true);
                    }}
                    className="h-6 px-2 text-[10px] bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowReverifyConfirm(false)}
                    className="h-6 px-1.5 text-[10px] text-slate-500"
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
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Re-run</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Verification Content */}
      {isVerifying ? (
        <div className="p-6 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" aria-hidden="true" />
          <span className="font-medium text-slate-700">
            Performing visual comparison with Gemini Vision...
          </span>
          <span className="text-[11px] text-slate-400">
            Comparing citizen grievance photo against worker cleanup evidence.
          </span>
        </div>
      ) : !verification ? (
        <div className="p-4 rounded-lg bg-indigo-50/40 border border-dashed border-indigo-200 text-center">
          <p className="text-xs text-slate-600 mb-2">
            Visual evidence analysis has not yet been triggered for this complaint.
          </p>
          <Button
            size="sm"
            onClick={() => onTriggerVerification(complaint.id)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Analyze Evidence Photos</span>
          </Button>
        </div>
      ) : isFailed ? (
        <div className="rounded-lg bg-red-50/70 border border-red-200 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <span className="font-semibold text-red-900 text-xs block">
                Visual Verification Incomplete
              </span>
              <span className="text-[11px] text-red-700 mt-0.5 block">
                {verification.processing_error ||
                  verifyError ||
                  'The vision service encountered a provider timeout or processing error.'}
              </span>
              <p className="text-[11px] text-slate-500 mt-2">
                Note: Municipal officers retain full authority to review photos manually and approve or request rework below.
              </p>
            </div>
          </div>
        </div>
      ) : isCompleted && metrics ? (
        <div className="space-y-3 text-xs">
          {/* Evaluation Status Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Confidence Category */}
            <Badge
              variant="outline"
              className={`text-[11px] font-semibold capitalize ${
                metrics.evaluation.confidenceLevel === 'high'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : metrics.evaluation.confidenceLevel === 'medium'
                    ? 'bg-amber-50 text-amber-700 border-amber-300'
                    : metrics.evaluation.confidenceLevel === 'low'
                      ? 'bg-orange-50 text-orange-700 border-orange-300'
                      : 'bg-purple-50 text-purple-700 border-purple-300'
              }`}
            >
              Confidence: {metrics.evaluation.confidenceLevel}
            </Badge>

            {/* Reliability */}
            <Badge
              variant="outline"
              className={`text-[11px] ${
                metrics.evaluation.isComparisonReliable
                  ? 'bg-slate-50 text-slate-700 border-slate-300'
                  : 'bg-amber-50 text-amber-700 border-amber-300'
              }`}
            >
              {metrics.evaluation.isComparisonReliable
                ? 'Reliable Photographic Match'
                : 'Comparative Viewpoints Differ'}
            </Badge>

            {/* Waste Reduction Estimate */}
            {metrics.evaluation.wasteReductionEstimate !== null ? (
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200 text-[11px] font-semibold"
              >
                ~{metrics.evaluation.wasteReductionEstimate}% Estimated Cleared
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-slate-50 text-slate-500 border-slate-200 text-[10px]"
              >
                No Area Estimate (Inconclusive Perspective)
              </Badge>
            )}
          </div>

          {/* Officer Summary Callout */}
          <div className="rounded-lg bg-indigo-50/70 border border-indigo-100 p-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block mb-0.5">
              AI Observational Summary
            </span>
            <p className="text-slate-800 text-[11px] leading-relaxed">
              {metrics.officerSummary}
            </p>
            {metrics.evaluation.estimateRationale && (
              <p className="text-slate-500 text-[10px] mt-1 italic">
                Reduction basis: {metrics.evaluation.estimateRationale}
              </p>
            )}
          </div>

          {/* Evidence Findings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Before Observations */}
            <div className="rounded-lg border border-slate-200 p-2.5 bg-slate-50/50">
              <span className="font-semibold text-slate-700 text-[11px] block mb-1.5">
                Before Photo Observations:
              </span>
              {(metrics.beforeObservations?.wasteIdentified?.length ?? 0) > 0 ? (
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {metrics.beforeObservations.wasteIdentified.map((item, i) => (
                    <span
                      key={i}
                      className="inline-block px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[10px]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-[11px] italic">
                  No specific waste types identified.
                </p>
              )}
              {metrics.beforeObservations?.approximateSpread && (
                <p className="text-[11px] text-slate-600">
                  <span className="font-medium">Spread:</span>{' '}
                  {metrics.beforeObservations.approximateSpread}
                </p>
              )}
            </div>

            {/* After Observations */}
            <div className="rounded-lg border border-slate-200 p-2.5 bg-slate-50/50">
              <span className="font-semibold text-slate-700 text-[11px] block mb-1.5">
                After Photo Observations:
              </span>
              {(metrics.afterObservations?.visibleSurfaces?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {metrics.afterObservations.visibleSurfaces.map((item, i) => (
                    <span
                      key={i}
                      className="inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}
              <div>
                <span className="text-[11px] text-slate-500 font-medium">
                  Remaining Debris:{' '}
                </span>
                {(metrics.afterObservations?.remainingDebris?.length ?? 0) > 0 ? (
                  <span className="text-amber-700 text-[11px]">
                    {metrics.afterObservations.remainingDebris.join(', ')}
                  </span>
                ) : (
                  <span className="text-slate-600 text-[11px]">
                    No significant residual debris visible
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Visible Changes */}
          {(metrics.comparativeFindings?.changesObserved?.length ?? 0) > 0 && (
            <div className="rounded-lg border border-slate-100 bg-slate-50/30 p-2 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-700 block mb-1">
                Visual Deltas Observed:
              </span>
              <ul className="list-disc pl-4 space-y-0.5">
                {metrics.comparativeFindings.changesObserved.map((change, i) => (
                  <li key={i}>{change}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Comparison Limitations Banner */}
          {(metrics.comparisonLimitations?.angleMismatched ||
            metrics.comparisonLimitations?.lightingMismatched ||
            metrics.comparisonLimitations?.occlusionPresent ||
            (metrics.comparisonLimitations?.limitationNotes?.length ?? 0) > 0) && (
            <div className="rounded-lg bg-amber-50/60 border border-amber-200/80 p-2.5">
              <span className="font-semibold text-amber-900 text-[11px] flex items-center gap-1 mb-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                Comparison Limitations Noted
              </span>
              <div className="flex flex-wrap gap-1.5 mb-1 text-[10px]">
                {metrics.comparisonLimitations.angleMismatched && (
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                    Angles Differ
                  </span>
                )}
                {metrics.comparisonLimitations.lightingMismatched && (
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                    Lighting Differs
                  </span>
                )}
                {metrics.comparisonLimitations.occlusionPresent && (
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                    Obstruction Present
                  </span>
                )}
              </div>
              {metrics.comparisonLimitations.limitationNotes.length > 0 && (
                <p className="text-[11px] text-amber-800 italic">
                  {metrics.comparisonLimitations.limitationNotes.join(' ')}
                </p>
              )}
            </div>
          )}

          {/* Advisory Disclaimer Notice */}
          <div className="pt-1 text-[10px] text-slate-400 italic">
            Advisory Notice: Multimodal observational findings assist the human officer. Municipal officers retain full authority to approve, request rework, or reject complaints.
          </div>
        </div>
      ) : null}
    </div>
  );
}
