'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import type { PhotoPreviewState } from './officer-types';
import { useLanguage } from '@/lib/i18n/context';

interface OfficerPhotoModalProps {
  previewPhoto: PhotoPreviewState | null;
  onClose: () => void;
}

export function OfficerPhotoModal({ previewPhoto, onClose }: OfficerPhotoModalProps) {
  const { t, language } = useLanguage();
  if (!previewPhoto) return null;

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
        <div className="relative h-96 w-full my-3 rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center">
          <Image
            src={previewPhoto.url}
            alt={previewPhoto.title}
            fill
            className="object-contain"
          />
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

