'use client';

import * as React from 'react';
import Image from 'next/image';
import { Camera, X, AlertCircle, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';
import type { AssignmentWithDetails } from '@/types';

interface WorkerCompleteModalProps {
  task: AssignmentWithDetails | null;
  onClose: () => void;
  onSubmit: (file: File, remarks: string) => Promise<void>;
  isSubmitting: boolean;
  language?: 'en' | 'hi';
}

export function WorkerCompleteModal({
  task,
  onClose,
  onSubmit,
  isSubmitting,
  language,
}: WorkerCompleteModalProps) {
  const { t, language: currentLang } = useLanguage();
  const isHi = (language || currentLang) === 'hi';

  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [uploadFilePreview, setUploadFilePreview] = React.useState<string | null>(null);
  const [uploadRemarks, setUploadRemarks] = React.useState('');
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleClose = () => {
    if (uploadFilePreview) URL.revokeObjectURL(uploadFilePreview);
    setUploadFile(null);
    setUploadFilePreview(null);
    setUploadRemarks('');
    setUploadError(null);
    onClose();
  };

  if (!task) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError(t('validation.invalidFileType'));
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError(t('validation.fileTooLarge'));
      return;
    }

    setUploadError(null);
    setSelectedFileInternal(file);
  };

  const setSelectedFileInternal = (file: File) => {
    if (uploadFilePreview) URL.revokeObjectURL(uploadFilePreview);
    setUploadFile(file);
    const objectUrl = URL.createObjectURL(file);
    setUploadFilePreview(objectUrl);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError(t('worker.completeModal.photoRequiredError'));
      return;
    }

    try {
      await onSubmit(uploadFile, uploadRemarks);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t('errors.submissionFailed'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in-0">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-sanitation-100 text-sanitation-700 flex items-center justify-center shadow-2xs">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {isHi ? 'सफाई कार्य पूर्ण करें —' : t('worker.completeModal.title')} {task.complaint?.complaint_code}
              </h3>
              <p className="text-xs text-slate-500">
                {t('worker.completeModal.subtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleFormSubmit} className="p-4 sm:p-5 space-y-4">
          {uploadError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Photo Upload Area with Camera Support */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {isHi ? 'सफाई के बाद की फ़ोटो' : t('worker.completeModal.afterPhotoLabel')}{' '}
              <span className="text-rose-600">*</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            {!uploadFilePreview ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-slate-300 p-6 flex flex-col items-center justify-center text-center hover:border-sanitation-500 hover:bg-sanitation-50/30 transition-all cursor-pointer group"
              >
                <div className="h-12 w-12 rounded-full bg-sanitation-50 text-sanitation-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Camera className="h-6 w-6" />
                </div>
                <span className="text-xs font-semibold text-slate-800">
                  {isHi ? 'कैमरा से फ़ोटो लें' : t('worker.completeModal.takePhotoPrompt')}
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  {t('worker.completeModal.photoFormatHelp')}
                </span>
              </button>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900/5">
                <div className="relative h-52 w-full bg-slate-950">
                  <Image
                    src={uploadFilePreview}
                    alt="Cleanup Preview"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="p-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="truncate max-w-[200px] text-slate-700 font-medium">
                    {uploadFile?.name} ({(uploadFile!.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (uploadFilePreview) URL.revokeObjectURL(uploadFilePreview);
                      setUploadFile(null);
                      setUploadFilePreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-7 px-2"
                  >
                    {t('worker.completeModal.removePhoto')}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Optional Field Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {isHi ? 'कार्य विवरण / टिप्पणी' : t('worker.completeModal.remarksLabel')}
            </label>
            <textarea
              value={uploadRemarks}
              onChange={(e) => setUploadRemarks(e.target.value)}
              placeholder={t('worker.completeModal.remarksPlaceholder')}
              rows={3}
              maxLength={500}
              className="w-full rounded-xl border border-slate-200 p-3 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sanitation-500 focus:border-sanitation-500"
            />
            <span className="text-[10px] text-slate-400 block text-right">
              {uploadRemarks.length}/500 {t('worker.completeModal.charCount')}
            </span>
          </div>

          {/* Modal Footer */}
          <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              {t('worker.completeModal.cancel')}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!uploadFile || isSubmitting}
              className="bg-sanitation-600 hover:bg-sanitation-700 text-white text-xs gap-1.5 font-medium shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t('worker.completeModal.submittingProof')}
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  {isHi ? 'साक्ष्य जमा करें एवं पूर्ण करें' : t('worker.completeModal.submitProof')}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
