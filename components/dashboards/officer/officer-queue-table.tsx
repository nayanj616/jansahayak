'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  ClipboardList,
  Eye,
  MapPin,
  Calendar,
  Layers,
  HardHat,
  UserCheck,
  CheckCircle2,
  Camera,
} from 'lucide-react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/utils';
import { CATEGORY_LABELS, STATUS_CONFIG, PRIORITY_BADGES } from './officer-types';
import type { ComplaintWithDetails } from '@/types';

interface OfficerQueueTableProps {
  complaints: ComplaintWithDetails[];
  onInspect: (complaint: ComplaintWithDetails) => void;
  onAssign: (complaint: ComplaintWithDetails) => void;
  onReview: (complaint: ComplaintWithDetails) => void;
  onResetFilters: () => void;
  onPreviewPhoto?: (photo: { url: string; title: string; subtitle?: string }) => void;
}

export function OfficerQueueTable({
  complaints,
  onInspect,
  onAssign,
  onReview,
  onResetFilters,
  onPreviewPhoto,
}: OfficerQueueTableProps) {
  if (complaints.length === 0) {
    return (
      <CardContent className="p-0">
        <div className="py-12">
          <EmptyState
            icon={ClipboardList}
            title="No complaints match active filters"
            description="Try clearing the status, ward, or category filters to view other city complaints."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={onResetFilters}
                className="text-xs"
              >
                Reset All Filters
              </Button>
            }
          />
        </div>
      </CardContent>
    );
  }

  return (
    <CardContent className="p-0">
      <div className="divide-y divide-slate-100">
        {complaints.map((c) => {
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
          const primaryImage = c.images?.[0];

          return (
            <div
              key={c.id}
              className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-slate-50/80 ${
                isUnderReview ? 'bg-purple-50/30' : ''
              }`}
            >
              {/* Left Column: Evidence Thumbnail + Main Details */}
              <div className="flex items-start gap-3.5 min-w-0">
                {/* Photo Thumbnail */}
                {primaryImage?.signed_url ? (
                  <div
                    onClick={() =>
                      onPreviewPhoto?.({
                        url: primaryImage.signed_url!,
                        title: `${c.complaint_code} Evidence`,
                        subtitle: `${categoryLabel} • Ward ${c.ward?.ward_no || 'Area'}`,
                      })
                    }
                    className="relative h-16 w-16 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100 cursor-pointer group shadow-2xs"
                  >
                    <Image
                      src={primaryImage.signed_url}
                      alt="Complaint initial evidence"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Eye className="h-4 w-4" />
                    </div>
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                    <Camera className="h-6 w-6 stroke-[1.5]" />
                  </div>
                )}

                {/* Metadata Details */}
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {c.complaint_code}
                    </span>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    <Badge variant={priorityVariant} className="capitalize">
                      {c.priority}
                    </Badge>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(c.created_at)}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {categoryLabel}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="h-3.5 w-3.5 text-civic-700 shrink-0" />
                      {c.ward ? `Ward ${c.ward.ward_no}: ${c.ward.ward_name}` : 'Ward Area'}
                      {c.location_description ? ` • ${c.location_description}` : ''}
                    </span>
                  </div>

                  {/* Worker Assignment Tag & Evidence Count */}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {assignedWorker ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200/60 px-2 py-0.5 text-[11px] font-medium text-blue-800">
                        <HardHat className="h-3 w-3 text-blue-600 shrink-0" />
                        <span>Allocated: {assignedWorker.display_name}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                        <HardHat className="h-3 w-3 shrink-0" />
                        <span>Unallocated</span>
                      </span>
                    )}

                    {c.images && c.images.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                        <Layers className="h-3 w-3 text-slate-400" />
                        <span>{c.images.length} photo{c.images.length === 1 ? '' : 's'}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Context-Aware Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center">
                {/* 1. Inspect Details Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onInspect(c)}
                  className="text-xs h-8 gap-1.5"
                >
                  <Eye className="h-3.5 w-3.5 text-slate-500" />
                  <span>Inspect</span>
                </Button>

                {/* 2. Worker Assignment Button */}
                {isAssignable && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAssign(c)}
                    className="text-xs h-8 gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>{c.status === 'rework_required' ? 'Reassign' : 'Assign'}</span>
                  </Button>
                )}

                {/* 3. Review & Verify Button */}
                {isUnderReview && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onReview(c)}
                    className="text-xs h-8 gap-1.5 font-semibold shadow-xs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Review & Verify</span>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </CardContent>
  );
}

