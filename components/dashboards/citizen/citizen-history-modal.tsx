'use client';

import * as React from 'react';
import { History, X, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';
import type { ComplaintWithDetails } from '@/types';
import { STATUS_LABELS, type CitizenBadgeVariant } from './citizen-types';

interface CitizenHistoryModalProps {
  complaint: ComplaintWithDetails | null;
  onClose: () => void;
  language?: 'en' | 'hi';
}

export function CitizenHistoryModal({
  complaint,
  onClose,
  language,
}: CitizenHistoryModalProps) {
  const { t, language: currentLang } = useLanguage();
  const isHi = (language || currentLang) === 'hi';

  if (!complaint) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-civic-100 text-civic-700 flex items-center justify-center">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {t('citizen.historyModal.title')} {complaint.complaint_code}
              </h3>
              <p className="text-xs text-slate-500">
                {t('citizen.historyModal.subtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto space-y-4 pr-1">
          {complaint.history && complaint.history.length > 0 ? (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {complaint.history.map((event, idx) => (
                <div key={event.id || idx} className="relative">
                  <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-civic-600 ring-2 ring-civic-100" />
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 capitalize">
                        {event.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {formatDate(event.created_at)}
                      </span>
                    </div>
                    {event.new_status && (
                      <div className="text-[11px] text-slate-600 flex items-center gap-1">
                        <span>{t('citizen.historyModal.statusLabel')}</span>
                        {renderStatusBadge(event.new_status)}
                      </div>
                    )}
                    {event.remarks && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1">
                        {event.remarks}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-500">
              <Layers className="h-8 w-8 mx-auto text-slate-300 mb-2" />
              {t('citizen.historyModal.emptyDesc')}
            </div>
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end shrink-0">
          <Button size="sm" variant="outline" onClick={onClose}>
            {t('citizen.historyModal.close')}
          </Button>
        </div>
      </div>
    </div>
  );
}
