'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import type { PhotoPreviewState } from './officer-types';
import { useLanguage } from '@/lib/i18n/context';

interface OfficerPhotoModalProps {
  previewPhoto: PhotoPreviewState | null;
  onClose: () => void;
}

function OfficerPhotoModalContent({
  previewPhoto,
  onClose,
}: {
  previewPhoto: PhotoPreviewState;
  onClose: () => void;
}) {
  const { t, language } = useLanguage();
  const [imgError, setImgError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white p-4 shadow-2xl animate-in fade-in-0 zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">{previewPhoto.title}</h3>
            {previewPhoto.subtitle && (
              <p className="text-[11px] text-slate-400 mt-0.5">{previewPhoto.subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="text-slate-400 hover:text-slate-600 text-lg p-1"
          >
            &times;
          </button>
        </div>
        <div className="relative h-96 w-full my-3 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
          {imgError ? (
            <div className="flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-amber-400 mb-2" />
              <p className="text-xs font-medium text-slate-300">{t('common.imageUnavailable')}</p>
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
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40">
              <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
            </div>
          )}
        </div>
        <div className="flex justify-end pt-2">
          <Button size="sm" variant="outline" onClick={onClose} className="text-xs">
            {language === 'hi' ? 'निरीक्षण बंद करें' : 'Close Inspector'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function OfficerPhotoModal({ previewPhoto, onClose }: OfficerPhotoModalProps) {
  if (!previewPhoto) return null;

  return (
    <OfficerPhotoModalContent
      key={previewPhoto.url}
      previewPhoto={previewPhoto}
      onClose={onClose}
    />
  );
}

