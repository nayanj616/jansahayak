'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  FileText,
  Plus,
  Eye,
  Camera,
  Calendar,
  MapPin,
  History,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';
import type { ComplaintWithDetails } from '@/types';
import { CATEGORY_OPTIONS, STATUS_LABELS, type CitizenBadgeVariant } from './citizen-types';

interface CitizenComplaintListProps {
  complaints: ComplaintWithDetails[];
  onOpenReportModal: () => void;
  onOpenTimeline: (complaint: ComplaintWithDetails) => void;
  onPreviewPhoto: (url: string) => void;
  language?: 'en' | 'hi';
}

export function CitizenComplaintList({
  complaints,
  onOpenReportModal,
  onOpenTimeline,
  onPreviewPhoto,
  language,
}: CitizenComplaintListProps) {
  const { t, language: currentLang } = useLanguage();
  const isHi = (language || currentLang) === 'hi';

  const getCategoryLabel = (categoryKey: string) => {
    const localized = t(`complaints.categories.${categoryKey}.label`);
    if (localized && localized !== `complaints.categories.${categoryKey}.label`) {
      return localized;
    }
    const found = CATEGORY_OPTIONS.find((c) => c.id === categoryKey);
    if (!found) return categoryKey.replace(/_/g, ' ');
    return isHi ? found.labelHi : found.label;
  };

  const renderStatusBadge = (status: string) => {
    const config = STATUS_LABELS[status];
    const localized = t(`complaints.statuses.${status}`);
    const label = (localized && localized !== `complaints.statuses.${status}`)
      ? localized
      : config ? (isHi ? config.hi : config.en) : status;
    const variant: CitizenBadgeVariant = config?.variant || 'outline';

    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <Card className="shadow-2xs">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-slate-100">
        <div>
          <CardTitle className="text-base font-semibold">
            {t('citizen.recentComplaints')}
          </CardTitle>
          <CardDescription>
            {t('citizen.complaintsLogged', { count: complaints.length })}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {complaints.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={t('citizen.noComplaintsTitle')}
            description={t('citizen.noComplaintsDesc')}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenReportModal}
                className="mt-2 text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                {t('citizen.fileFirstComplaint')}
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {complaints.map((item) => {
              const primaryImage = item.images?.[0];
              return (
                <div
                  key={item.id}
                  className="py-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/70 p-3 rounded-xl transition-colors"
                >
                  {/* Left: Thumbnail & Main Info */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    {/* Photo Thumbnail */}
                    {primaryImage?.signed_url ? (
                      <div
                        onClick={() => onPreviewPhoto(primaryImage.signed_url!)}
                        className="relative h-16 w-16 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100 cursor-pointer group shadow-2xs"
                      >
                        <Image
                          src={primaryImage.signed_url}
                          alt="Complaint evidence"
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye className="h-4 w-4" />
                        </div>
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                        <Camera className="h-6 w-6 stroke-[1.5]" />
                      </div>
                    )}

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {item.complaint_code}
                        </span>
                        {renderStatusBadge(item.status)}
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(item.created_at)}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {getCategoryLabel(item.category)}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 text-civic-600 shrink-0" />
                          {item.ward?.ward_name || item.ward_id || (isHi ? 'वार्ड क्षेत्र' : 'Ward Area')}
                          {item.location_description ? ` • ${item.location_description}` : ''}
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-xs text-slate-600 line-clamp-1 italic pt-0.5">
                          &ldquo;{item.description}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenTimeline(item)}
                      className="text-xs gap-1.5"
                    >
                      <History className="h-3.5 w-3.5 text-slate-500" />
                      {t('citizen.timeline')}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
