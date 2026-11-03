'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  Navigation,
  Loader2,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/lib/i18n';
import { formatFrontendError } from '@/lib/errors';
import type { ComplaintWithDetails, WardRecord } from '@/types';
import { CATEGORY_OPTIONS } from './citizen-types';

interface CitizenReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  wards: WardRecord[];
  onSubmitSuccess: (complaint: ComplaintWithDetails) => void;
  language?: 'en' | 'hi';
}

export function CitizenReportModal({
  isOpen,
  onClose,
  wards,
  onSubmitSuccess,
  language,
}: CitizenReportModalProps) {
  const { t, language: currentLang } = useLanguage();
  const isHi = (language || currentLang) === 'hi';

  const defaultWardId =
    wards[0]?.ward_id || (wards[0] as unknown as { id?: string })?.id || 'GWL-W-024';

  // Form state
  const [category, setCategory] = React.useState('garbage_dump');
  const [wardId, setWardId] = React.useState(defaultWardId);
  const [locationDesc, setLocationDesc] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [latitude, setLatitude] = React.useState<number | null>(null);
  const [longitude, setLongitude] = React.useState<number | null>(null);
  const [locationAccuracy, setLocationAccuracy] = React.useState<number | null>(null);
  const [locationSource, setLocationSource] = React.useState<'gps' | 'manual'>('manual');
  const [gpsDetecting, setGpsDetecting] = React.useState(false);
  const [gpsStatus, setGpsStatus] = React.useState<string | null>(null);

  // File state
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [filePreview, setFilePreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Submission state
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // GPS auto-detection handler
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus(t('citizen.reportModal.gpsNotSupported'));
      return;
    }

    setGpsDetecting(true);
    setGpsStatus(t('citizen.reportModal.gpsAcquiring'));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocationAccuracy(pos.coords.accuracy);
        setLocationSource('gps');
        setGpsDetecting(false);
        setGpsStatus(
          isHi
            ? `जीपीएस निर्देशांक प्राप्त: ±${Math.round(pos.coords.accuracy)}मी सटीकता`
            : `GPS detected: ±${Math.round(pos.coords.accuracy)}m accuracy`
        );
      },
      (err) => {
        setGpsDetecting(false);
        setGpsStatus(
          isHi
            ? `जीपीएस प्राप्त नहीं हुआ (${err.message})। मैन्युअल स्थान दर्ज करें।`
            : `GPS not acquired (${err.message}). Proceeding with manual location.`
        );
        setLocationSource('manual');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Image selection handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type)) {
      setSubmitError(
        isHi
          ? 'अमान्य फ़ाइल प्रारूप। कृपया JPEG, PNG, या WebP फ़ाइल अपलोड करें।'
          : 'Invalid file type. Please upload a JPEG, PNG, or WebP image.'
      );
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setSubmitError(
        isHi
          ? 'फ़ाइल का आकार अधिकतम 8 एमबी से अधिक है।'
          : 'File size exceeds maximum limit of 8 MB.'
      );
      return;
    }

    setSubmitError(null);
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFilePreview(objectUrl);
  };

  const resetForm = () => {
    setCategory('garbage_dump');
    setWardId(defaultWardId);
    setLocationDesc('');
    setDescription('');
    setLatitude(null);
    setLongitude(null);
    setLocationAccuracy(null);
    setLocationSource('manual');
    setGpsStatus(null);
    setSelectedFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
    setSubmitError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!selectedFile) {
      setSubmitError(
        isHi
          ? 'कृपया स्वच्छता समस्या की मूल फ़ोटो संलग्न करें।'
          : 'Please attach an original photograph of the sanitation grievance.'
      );
      return;
    }

    if (!wardId) {
      setSubmitError(
        isHi ? 'कृपया नगर निगम वार्ड का चयन करें।' : 'Please select a municipal ward.'
      );
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('category', category);
      formData.append('ward_id', wardId);
      formData.append('priority', 'normal');
      formData.append('location_description', locationDesc);
      formData.append('description', description);
      formData.append('location_source', locationSource);

      if (latitude !== null) formData.append('latitude', latitude.toString());
      if (longitude !== null) formData.append('longitude', longitude.toString());
      if (locationAccuracy !== null)
        formData.append('location_accuracy_m', locationAccuracy.toString());

      const res = await fetch('/api/complaints', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || data.error || (isHi ? 'शिकायत दर्ज करने में विफल।' : 'Failed to submit complaint.')
        );
      }

      onSubmitSuccess(data.complaint);
      handleClose();
    } catch (err) {
      console.error('[CitizenReportModal] Submission error:', err);
      setSubmitError(formatFrontendError(err, language || currentLang, 'errors.submissionFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-civic-100 text-civic-700 flex items-center justify-center shadow-2xs">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {t('citizen.reportModal.title')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('citizen.reportModal.subtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitError && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('citizen.reportModal.categoryLabel')}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-civic-500/20 focus:border-civic-500 cursor-pointer"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {t(`complaints.categories.${cat.id}.label`) || (isHi ? cat.labelHi : cat.label)}
                </option>
              ))}
            </select>
          </div>

          {/* Ward Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('citizen.reportModal.wardLabel')}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <select
              value={wardId}
              onChange={(e) => setWardId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-civic-500/20 focus:border-civic-500 cursor-pointer"
            >
              {wards.length > 0 ? (
                wards.map((w) => {
                  const id = w.ward_id || (w as unknown as { id?: string }).id;
                  const num = w.ward_no ?? (w as unknown as { ward_number?: number }).ward_number;
                  const zone = (w as unknown as { zone?: string }).zone;
                  return (
                    <option key={id} value={id}>
                      Ward {num}: {w.ward_name} {zone ? `(${zone})` : ''}
                    </option>
                  );
                })
              ) : (
                <option value="GWL-W-024">Ward 24: Maharaj Bada / Lashkar</option>
              )}
            </select>
          </div>

          {/* Landmark / Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('citizen.reportModal.landmarkLabel')}
            </label>
            <Input
              type="text"
              placeholder={t('citizen.reportModal.landmarkPlaceholder')}
              value={locationDesc}
              onChange={(e) => setLocationDesc(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('citizen.reportModal.descLabel')}
            </label>
            <textarea
              rows={2}
              placeholder={t('citizen.reportModal.descPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-civic-500/20 focus:border-civic-500"
            />
          </div>

          {/* GPS Geolocation Detector */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Navigation className="h-3.5 w-3.5 text-civic-600" />
                <span>{t('citizen.reportModal.gpsTitle')}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDetectGps}
                disabled={gpsDetecting}
                className="text-xs h-7 gap-1"
              >
                {gpsDetecting ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {t('citizen.reportModal.detecting')}
                  </>
                ) : (
                  <>
                    <Navigation className="h-3 w-3" />
                    {latitude
                      ? t('citizen.reportModal.redetectLocation')
                      : t('citizen.reportModal.detectLocation')}
                  </>
                )}
              </Button>
            </div>

            {gpsStatus && (
              <p className="text-[11px] text-slate-600 flex items-center gap-1">
                {latitude ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-amber-600 shrink-0" />
                )}
                {gpsStatus}
              </p>
            )}

            {latitude !== null && longitude !== null && (
              <div className="text-[11px] text-slate-500 font-mono bg-white p-2 rounded-lg border border-slate-200">
                Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)} (Source: {locationSource})
              </div>
            )}
          </div>

          {/* Photo Upload Input with Preview */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('citizen.reportModal.photoLabel')}{' '}
              <span className="text-rose-500">*</span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {filePreview ? (
              <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-100">
                <div className="relative h-44 w-full">
                  <Image
                    src={filePreview}
                    alt="Selected photo"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="p-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="truncate max-w-[200px] text-slate-700 font-medium">
                    {selectedFile?.name} ({(selectedFile ? selectedFile.size / 1024 : 0).toFixed(0)} KB)
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      if (filePreview) URL.revokeObjectURL(filePreview);
                      setFilePreview(null);
                    }}
                    className="text-xs h-7 text-rose-600 hover:text-rose-800"
                  >
                    {t('citizen.reportModal.removePhoto')}
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center hover:border-civic-400 hover:bg-civic-50/20 transition-all cursor-pointer group"
              >
                <div className="mx-auto h-10 w-10 rounded-full bg-civic-50 text-civic-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Upload className="h-5 w-5" />
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-800">
                  {t('citizen.reportModal.photoUploadPrompt')}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {t('citizen.reportModal.photoUploadHelp')}
                </p>
              </div>
            )}
          </div>

          {/* Form Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={submitting}
              onClick={handleClose}
            >
              {t('citizen.reportModal.cancel')}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="bg-civic-700 hover:bg-civic-800 text-white gap-2 font-medium"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('citizen.reportModal.submitting')}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  {t('citizen.reportModal.submit')}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
