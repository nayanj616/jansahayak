'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, UserCheck } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import type { ComplaintWithDetails } from '@/types';
import { CATEGORY_LABELS, type Worker } from './officer-types';

interface OfficerAssignModalProps {
  complaint: ComplaintWithDetails | null;
  workers: Worker[];
  selectedWorkerId: string;
  onSelectWorkerId: (id: string) => void;
  assignmentNotes: string;
  onChangeAssignmentNotes: (notes: string) => void;
  isAssigning: boolean;
  assignError: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function OfficerAssignModal({
  complaint,
  workers,
  selectedWorkerId,
  onSelectWorkerId,
  assignmentNotes,
  onChangeAssignmentNotes,
  isAssigning,
  assignError,
  onSubmit,
  onClose,
}: OfficerAssignModalProps) {
  const { t } = useLanguage();
  if (!complaint) return null;

  const categoryLabel = t(`complaints.categories.${complaint.category}.label`) || CATEGORY_LABELS[complaint.category] || complaint.category;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in-0 zoom-in-95">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              {complaint.status === 'assigned'
                ? t('officer.assignModal.titleReassign')
                : t('officer.assignModal.titleNew')}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('officer.assignModal.complaintPrefix')} {complaint.complaint_code} &bull;{' '}
              {categoryLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 text-base"
          >
            &times;
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          {assignError && (
            <div className="rounded-lg bg-red-50 p-2.5 text-red-800 text-xs border border-red-200">
              {assignError}
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              {t('officer.assignModal.selectWorkerLabel')}
            </label>
            <select
              value={selectedWorkerId}
              onChange={(e) => onSelectWorkerId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              required
            >
              {workers.length === 0 ? (
                <option value="">{t('officer.assignModal.noWorkers')}</option>
              ) : (
                workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.display_name} (Ward: {w.ward_id || 'GWL-W-012'})
                  </option>
                ))
              )}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              {t('officer.assignModal.workerSectorHelp')}
            </p>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              {t('officer.assignModal.remarksLabel')}
            </label>
            <textarea
              rows={3}
              value={assignmentNotes}
              onChange={(e) => onChangeAssignmentNotes(e.target.value)}
              placeholder={t('officer.assignModal.remarksPlaceholder')}
              className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              maxLength={1000}
            />
            <p className="text-[11px] text-slate-400 mt-0.5">
              {t('officer.assignModal.remarksAuditHelp')}
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isAssigning}
              className="text-xs"
            >
              {t('officer.assignModal.cancel')}
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
                  {t('officer.assignModal.dispatching')}
                </>
              ) : (
                <>
                  <UserCheck className="h-3.5 w-3.5" />
                  {t('officer.assignModal.confirmDispatch')}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

