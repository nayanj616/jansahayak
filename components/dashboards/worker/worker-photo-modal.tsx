'use client';

import * as React from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import type { WorkerPhotoPreviewState } from './worker-types';

interface WorkerPhotoModalProps {
  previewPhoto: WorkerPhotoPreviewState | null;
  onClose: () => void;
  language?: 'en' | 'hi';
}

export function WorkerPhotoModal({
  previewPhoto,
  onClose,
}: WorkerPhotoModalProps) {
  const { t } = useLanguage();
  if (!previewPhoto) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs animate-in fade-in-0 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-3xl w-full rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden cursor-default"
      >
        <div className="flex items-center justify-between p-3.5 border-b border-slate-800 text-white">
          <div>
            <h4 className="text-sm font-semibold">{previewPhoto.title}</h4>
            {previewPhoto.subtitle && (
              <p className="text-[11px] text-slate-400">{previewPhoto.subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('worker.photoModal.closeAria')}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="relative h-[65vh] w-full p-2 flex items-center justify-center bg-black/60">
          <Image
            src={previewPhoto.url}
            alt={previewPhoto.title}
            fill
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
}
