'use client';

import * as React from 'react';
import Image from 'next/image';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import type { WorkerPhotoPreviewState } from './worker-types';

interface WorkerPhotoModalProps {
  previewPhoto: WorkerPhotoPreviewState | null;
  onClose: () => void;
  language?: 'en' | 'hi';
}

function WorkerPhotoModalContent({
  previewPhoto,
  onClose,
}: {
  previewPhoto: WorkerPhotoPreviewState;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [imgError, setImgError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

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
        <div className="relative h-[65vh] w-full p-2 flex items-center justify-center bg-slate-950/90">
          {imgError ? (
            <div className="flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-amber-400 mb-2" />
              <p className="text-xs font-medium text-slate-300">{t('common.imageUnavailable')}</p>
              <a
                href={previewPhoto.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-[11px] text-emerald-400 underline hover:text-emerald-300"
              >
                Direct Image Link
              </a>
            </div>
          ) : (
            <Image
              src={previewPhoto.url}
              alt={previewPhoto.title}
              fill
              unoptimized
              className="object-contain"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setImgError(true);
              }}
            />
          )}
          {isLoading && !imgError && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50">
              <Loader2 className="h-6 w-6 text-emerald-400 animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function WorkerPhotoModal({
  previewPhoto,
  onClose,
}: WorkerPhotoModalProps) {
  if (!previewPhoto) return null;

  return (
    <WorkerPhotoModalContent
      key={previewPhoto.url}
      previewPhoto={previewPhoto}
      onClose={onClose}
    />
  );
}
