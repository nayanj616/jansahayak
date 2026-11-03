'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  FileText,
  Clock,
  CheckCircle2,
  Play,
  Camera,
  Eye,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';
import type { AssignmentWithDetails } from '@/types';
import {
  WORKER_CATEGORY_LABELS,
  WORKER_STATUS_CONFIG,
  WORKER_PRIORITY_BADGES,
  type WorkerBadgeVariant,
  type WorkerPhotoPreviewState,
} from './worker-types';

interface WorkerTaskCardProps {
  task: AssignmentWithDetails;
  isStarting: boolean;
  onStartTask: (taskId: string) => void;
  onOpenCompleteModal: (task: AssignmentWithDetails) => void;
  onPreviewPhoto: (photo: WorkerPhotoPreviewState) => void;
  language?: 'en' | 'hi';
}

export function WorkerTaskCard({
  task,
  isStarting,
  onStartTask,
  onOpenCompleteModal,
  onPreviewPhoto,
  language,
}: WorkerTaskCardProps) {
  const { t, language: currentLang } = useLanguage();
  const isHi = (language || currentLang) === 'hi';
  const complaint = task.complaint;

  const beforeImg = complaint?.images?.find(
    (img) => img.image_type === 'before' || img.image_type === 'original'
  );
  const afterImg = complaint?.images?.find((img) => img.image_type === 'after');

  // Category label
  const categoryConfig = complaint?.category
    ? WORKER_CATEGORY_LABELS[complaint.category]
    : undefined;
  const categoryText = isHi
    ? (categoryConfig?.hi || t(`complaints.categories.${complaint?.category}.label`))
    : (t(`complaints.categories.${complaint?.category}.label`) || categoryConfig?.en || complaint?.category || 'Sanitation Task');

  // Status config
  const statusConfig = WORKER_STATUS_CONFIG[task.status];
  const localizedStatus = t(`assignments.statuses.${task.status}`);
  const statusLabel = localizedStatus && localizedStatus !== `assignments.statuses.${task.status}`
    ? localizedStatus
    : (isHi ? statusConfig?.hi : statusConfig?.en) || task.status;
  const statusVariant: WorkerBadgeVariant = statusConfig?.variant || 'outline';

  // Priority config
  const priorityConfig = complaint?.priority
    ? WORKER_PRIORITY_BADGES[complaint.priority]
    : undefined;
  const priorityLabel = isHi
    ? (priorityConfig?.hi || t(`complaints.priorities.${complaint?.priority}`))
    : (t(`complaints.priorities.${complaint?.priority}`) || priorityConfig?.en || complaint?.priority);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 transition-all space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {complaint?.complaint_code || 'GWL-TASK'}
          </span>
          <Badge variant="outline" className="text-xs bg-slate-50 font-normal">
            {categoryText}
          </Badge>
          {priorityConfig && (
            <Badge variant={priorityConfig.variant} className="text-xs">
              {priorityLabel}
            </Badge>
          )}
          <Badge variant={statusVariant} className="text-xs">
            {statusLabel}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {t('worker.card.assignedOn')}{' '}
            {new Date(task.assigned_at).toLocaleDateString(isHi ? 'hi-IN' : 'en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Middle Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left: Location & Description */}
        <div className="md:col-span-2 space-y-2.5 text-xs">
          <div className="flex items-start gap-2 text-slate-700">
            <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-slate-900">
                {complaint?.ward
                  ? `${isHi ? 'वार्ड' : 'Ward'} ${complaint.ward.ward_no}: ${complaint.ward.ward_name}`
                  : isHi
                  ? 'मुरार वार्ड बीट'
                  : 'Morar Ward Beat'}
              </span>
              {complaint?.location_description && (
                <p className="text-slate-600 mt-0.5">
                  {t('worker.card.landmark')} {complaint.location_description}
                </p>
              )}
            </div>
          </div>

          {complaint?.description && (
            <div className="flex items-start gap-2 text-slate-600">
              <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 w-full italic">
                &ldquo;{complaint.description}&rdquo;
              </p>
            </div>
          )}

          {task.started_at && (
            <div className="text-[11px] text-amber-700 font-medium">
              {t('worker.card.workStarted')}{' '}
              {new Date(task.started_at).toLocaleString(isHi ? 'hi-IN' : 'en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </div>
          )}
          {task.completed_at && (
            <div className="text-[11px] text-emerald-700 font-medium">
              {t('worker.card.cleanupCompleted')}{' '}
              {new Date(task.completed_at).toLocaleString(isHi ? 'hi-IN' : 'en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </div>
          )}
        </div>

        {/* Right: Photographic Evidence Thumbnails */}
        <div className="flex sm:justify-end items-center gap-3">
          {/* Before Photo */}
          {beforeImg?.signed_url ? (
            <div className="flex flex-col items-center">
              <div
                onClick={() =>
                  onPreviewPhoto({
                    url: beforeImg.signed_url!,
                    title: `${t('worker.card.beforeCleanup')} — ${complaint?.complaint_code || ''}`,
                    subtitle: isHi
                      ? 'नागरिक द्वारा दर्ज शिकायत का मूल फ़ोटो साक्ष्य'
                      : 'Original photographic evidence submitted by citizen',
                  })
                }
                className="group relative h-20 w-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 hover:ring-2 hover:ring-civic-500 transition-all cursor-pointer shadow-2xs"
              >
                <Image
                  src={beforeImg.signed_url}
                  alt="Before Cleanup"
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Eye className="h-4 w-4" />
                </div>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 font-medium">
                {t('worker.card.beforeCleanup')}
              </span>
            </div>
          ) : (
            <div className="h-20 w-24 rounded-lg border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-[10px] text-slate-400 p-1 text-center">
              <span>{t('worker.card.noBeforePhoto')}</span>
            </div>
          )}

          {/* After Photo (if available) or Upload CTA */}
          {afterImg?.signed_url ? (
            <div className="flex flex-col items-center">
              <div
                onClick={() =>
                  onPreviewPhoto({
                    url: afterImg.signed_url!,
                    title: `${t('worker.card.afterProof')} — ${complaint?.complaint_code || ''}`,
                    subtitle: isHi
                      ? 'सफाईकर्मी द्वारा कार्य पूर्ण होने पर अपलोड किया गया साक्ष्य'
                      : 'Photographic evidence uploaded by sanitation worker',
                  })
                }
                className="group relative h-20 w-24 rounded-lg overflow-hidden border-2 border-emerald-400 bg-slate-100 hover:ring-2 hover:ring-emerald-500 transition-all cursor-pointer shadow-2xs"
              >
                <Image
                  src={afterImg.signed_url}
                  alt="After Cleanup"
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-emerald-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Eye className="h-4 w-4" />
                </div>
              </div>
              <span className="text-[10px] text-emerald-700 mt-1 font-semibold">
                {t('worker.card.afterProof')}
              </span>
            </div>
          ) : task.status === 'in_progress' ? (
            <button
              type="button"
              onClick={() => onOpenCompleteModal(task)}
              className="h-20 w-24 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-50 flex flex-col items-center justify-center text-amber-700 text-[10px] p-1 text-center transition-colors cursor-pointer"
            >
              <Camera className="h-5 w-5 mb-1 text-amber-600" />
              <span className="font-medium">{t('worker.card.uploadProof')}</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Action Bar Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <div className="text-xs text-slate-500">
          {task.status === 'assigned' && (
            <span>
              {t('worker.card.queuedDesc')}
            </span>
          )}
          {task.status === 'in_progress' && (
            <span className="text-amber-700 font-medium flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {t('worker.card.inProgressDesc')}
            </span>
          )}
          {task.status === 'completed' && (
            <span className="text-emerald-700 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t('worker.card.completedDesc')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {task.complaint_id && (
            <Link
              href={`/complaints/${task.complaint_id}`}
              className="inline-flex items-center gap-1.5 text-xs text-civic-700 hover:text-civic-800 font-medium px-2.5 py-1.5 rounded-lg border border-civic-200 bg-civic-50 hover:bg-civic-100 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>{t('common.viewTracking')}</span>
            </Link>
          )}

          {task.status === 'assigned' && (
            <Button
              size="sm"
              onClick={() => onStartTask(task.id)}
              disabled={isStarting}
              className="bg-civic-700 hover:bg-civic-800 text-white text-xs gap-1.5"
            >
              {isStarting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5 fill-current" />
              )}
              {isStarting
                ? t('worker.card.starting')
                : (isHi ? 'कार्य शुरू करें' : t('worker.card.startTask'))}
            </Button>
          )}

          {task.status === 'in_progress' && (
            <Button
              size="sm"
              onClick={() => onOpenCompleteModal(task)}
              className="bg-sanitation-600 hover:bg-sanitation-700 text-white text-xs gap-1.5"
            >
              <Camera className="h-3.5 w-3.5" />
              {t('worker.card.completeTaskProof')}
            </Button>
          )}

          {task.status === 'completed' && (
            <Badge variant="resolved" className="text-xs px-2.5 py-1">
              {t('worker.card.completedBadge')}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
