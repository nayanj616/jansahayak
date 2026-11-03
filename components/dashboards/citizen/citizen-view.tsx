'use client';

import * as React from 'react';
import Image from 'next/image';
import { CheckCircle2, X } from 'lucide-react';
import type { ComplaintWithDetails, DemoSessionPayload, WardRecord } from '@/types';
import { useLanguage } from '@/lib/i18n/context';
import {
  CitizenQuickActionsHeader,
  CitizenScopeBanner,
  CitizenExplorationCards,
} from './citizen-quick-actions';
import { CitizenComplaintList } from './citizen-complaint-list';
import { CitizenReportModal } from './citizen-report-modal';
import { CitizenHistoryModal } from './citizen-history-modal';

interface CitizenViewProps {
  session: DemoSessionPayload;
  initialComplaints?: ComplaintWithDetails[];
  wards?: WardRecord[];
}

export function CitizenView({
  session,
  initialComplaints = [],
  wards = [],
}: CitizenViewProps) {
  const { language } = useLanguage();
  const [complaints, setComplaints] = React.useState<ComplaintWithDetails[]>(initialComplaints);
  const [reportModalOpen, setReportModalOpen] = React.useState(false);
  const [historyModalComplaint, setHistoryModalComplaint] = React.useState<ComplaintWithDetails | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = React.useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = React.useState<string | null>(null);

  const isHi = language === 'hi';

  const handleComplaintSubmitted = (newComplaint: ComplaintWithDetails) => {
    if (newComplaint) {
      setComplaints((prev) => [newComplaint, ...prev]);
      setSubmitSuccess(
        isHi
          ? `शिकायत ${newComplaint.complaint_code || ''} सफलतापूर्वक दर्ज की गई!`
          : `Complaint ${newComplaint.complaint_code || ''} filed successfully!`
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Actions Header */}
      <CitizenQuickActionsHeader
        onOpenReportModal={() => {
          setSubmitSuccess(null);
          setReportModalOpen(true);
        }}
        language={language}
      />

      {/* Success Notification Banner */}
      {submitSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 flex items-center justify-between text-xs animate-in fade-in-0 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{submitSuccess}</span>
          </div>
          <button
            onClick={() => setSubmitSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold p-1 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Citizen Profile & Demo Area Scope Banner */}
      <CitizenScopeBanner session={session} language={language} />

      {/* My Recent Complaints Section */}
      <CitizenComplaintList
        complaints={complaints}
        onOpenReportModal={() => setReportModalOpen(true)}
        onOpenTimeline={(c) => setHistoryModalComplaint(c)}
        onPreviewPhoto={(url) => setPreviewPhotoUrl(url)}
        language={language}
      />

      {/* Bottom Grid: Scheme Exploration & AI Assistant Cards */}
      <CitizenExplorationCards language={language} />

      {/* Report Grievance Modal Dialog */}
      <CitizenReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        wards={wards}
        onSubmitSuccess={handleComplaintSubmitted}
        language={language}
      />

      {/* Timeline Audit History Modal Dialog */}
      <CitizenHistoryModal
        complaint={historyModalComplaint}
        onClose={() => setHistoryModalComplaint(null)}
        language={language}
      />

      {/* Full-size Photo Preview Lightbox */}
      {previewPhotoUrl && (
        <div
          onClick={() => setPreviewPhotoUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh] w-full h-[70vh] rounded-2xl overflow-hidden bg-black/40">
            <Image
              src={previewPhotoUrl}
              alt="Full size complaint evidence"
              fill
              unoptimized
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

