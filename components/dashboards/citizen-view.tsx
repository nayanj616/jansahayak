'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus,
  FileText,
  Search,
  Bot,
  ArrowRight,
  MapPin,
  Clock,
  Sparkles,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Camera,
  Navigation,
  History,
  Eye,
  Calendar,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/utils';
import type {
  ComplaintWithDetails,
  DemoSessionPayload,
  WardRecord,
} from '@/types';

interface CitizenViewProps {
  session: DemoSessionPayload;
  initialComplaints?: ComplaintWithDetails[];
  wards?: WardRecord[];
}

const CATEGORY_OPTIONS = [
  { id: 'garbage_dump', label: 'Open Garbage Dump', desc: 'Accumulation of uncollected waste or roadside pile' },
  { id: 'overflowing_bin', label: 'Overflowing Dustbin', desc: 'Public community waste bin filled beyond capacity' },
  { id: 'drain_blockage', label: 'Blocked Drain / Nala', desc: 'Choked storm drain causing water stagnation' },
  { id: 'dead_animal', label: 'Dead Animal Carcass', desc: 'Urgent removal required for public hygiene' },
  { id: 'construction_debris', label: 'Construction Debris (C&D)', desc: 'Dumping of building rubble, cement, or bricks' },
  { id: 'sweeping_needed', label: 'Street Sweeping Required', desc: 'Heavy litter or un-swept public thoroughfare' },
  { id: 'water_logging', label: 'Water Logging', desc: 'Roadside water logging or drainage overflow' },
  { id: 'sewage_overflow', label: 'Sewage Overflow', desc: 'Manhole or sewage pipe overflow' },
  { id: 'other', label: 'Other Sanitation Issue', desc: 'General municipal sanitation and cleanliness issue' },
];

export function CitizenView({
  session,
  initialComplaints = [],
  wards = [],
}: CitizenViewProps) {
  const [complaints, setComplaints] = React.useState<ComplaintWithDetails[]>(initialComplaints);
  const [reportModalOpen, setReportModalOpen] = React.useState(false);
  const [historyModalComplaint, setHistoryModalComplaint] = React.useState<ComplaintWithDetails | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = React.useState<string | null>(null);

  // Form state
  const [category, setCategory] = React.useState('garbage_dump');
  const [wardId, setWardId] = React.useState(wards[0]?.ward_id || 'GWL-W-024');
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
  const [submitSuccess, setSubmitSuccess] = React.useState<string | null>(null);

  // GPS auto-detection handler
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Geolocation is not supported by your browser.');
      return;
    }

    setGpsDetecting(true);
    setGpsStatus('Acquiring high-accuracy GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocationAccuracy(pos.coords.accuracy);
        setLocationSource('gps');
        setGpsDetecting(false);
        setGpsStatus(`GPS detected: ±${Math.round(pos.coords.accuracy)}m accuracy`);
      },
      (err) => {
        setGpsDetecting(false);
        setGpsStatus(`GPS not acquired (${err.message}). Proceeding with manual location.`);
        setLocationSource('manual');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Image selection handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate client-side
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type)) {
      setSubmitError('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setSubmitError('File size exceeds maximum limit of 8 MB.');
      return;
    }

    setSubmitError(null);
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFilePreview(objectUrl);
  };

  // Reset form
  const resetForm = () => {
    setCategory('garbage_dump');
    setWardId(wards[0]?.ward_id || 'GWL-W-024');
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

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!selectedFile) {
      setSubmitError('Please attach an original photograph of the sanitation grievance.');
      return;
    }

    if (!wardId) {
      setSubmitError('Please select a municipal ward.');
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
      if (locationAccuracy !== null) formData.append('location_accuracy_m', locationAccuracy.toString());

      const res = await fetch('/api/complaints', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to submit complaint.');
      }

      // Prepend newly created complaint to state list
      if (data.complaint) {
        setComplaints((prev) => [data.complaint, ...prev]);
      }

      setSubmitSuccess(`Complaint ${data.complaint?.complaint_code || ''} filed successfully!`);
      resetForm();
      setReportModalOpen(false);
    } catch (err) {
      console.error('[CitizenView] Submission error:', err);
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  // Status badge styling helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Submitted</Badge>;
      case 'assigned':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Worker Assigned</Badge>;
      case 'in_progress':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">In Progress</Badge>;
      case 'under_review':
        return <Badge className="bg-cyan-100 text-cyan-800 border-cyan-200">Under Review</Badge>;
      case 'rework_required':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Rework Required</Badge>;
      case 'resolved':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Resolved</Badge>;
      case 'rejected':
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Report issues, track progress and explore schemes.
          </p>
        </div>

        <div>
          <Button
            onClick={() => {
              setSubmitSuccess(null);
              setSubmitError(null);
              setReportModalOpen(true);
            }}
            className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-medium shadow-xs gap-2"
          >
            <Plus className="h-4 w-4" />
            Report a New Complaint
          </Button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {submitSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 flex items-center justify-between text-xs animate-in fade-in-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{submitSuccess}</span>
          </div>
          <button
            onClick={() => setSubmitSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Citizen Profile Banner */}
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            Demonstration Area: <strong>{session.user.ward || 'Demonstration Sector: Lashkar Area'}</strong> &bull;{' '}
            {session.user.zone || 'Lashkar Demonstration Zone'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-emerald-700">
          <Clock className="h-3.5 w-3.5" />
          <span>Active Session Expiration: 2 Hours</span>
        </div>
      </div>

      {/* My Recent Complaints Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-base font-semibold">My Recent Complaints</CardTitle>
            <CardDescription>
              Sanitation issues reported by your persona ({complaints.length} logged)
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {complaints.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No complaints yet"
              description="Report a complaint to get started. Cleanliness issues you report will appear here for real-time tracking."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReportModalOpen(true)}
                  className="mt-2 text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  File First Complaint
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
                    className="py-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/60 p-3 rounded-xl transition-colors"
                  >
                    {/* Left: Thumbnail & Main Info */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      {/* Photo Thumbnail */}
                      {primaryImage?.signed_url ? (
                        <div
                          onClick={() => setPreviewPhotoUrl(primaryImage.signed_url || null)}
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

                        <p className="text-sm font-semibold text-slate-800 capitalize truncate">
                          {item.category.replace(/_/g, ' ')}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                            {item.ward?.ward_name || item.ward_id || 'Ward Area'}
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
                        onClick={() => setHistoryModalComplaint(item)}
                        className="text-xs gap-1.5"
                      >
                        <History className="h-3.5 w-3.5 text-slate-500" />
                        Timeline
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Grid: Scheme Exploration & AI Assistant */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Explore Government Schemes */}
        <Card className="hover:border-blue-300 transition-all group">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 group-hover:scale-105 transition-transform">
                <Search className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-semibold">
                Explore Government Schemes
              </CardTitle>
            </div>
            <CardDescription>
              Find schemes you may be eligible for across Madhya Pradesh and Central Government welfare initiatives.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/scheme-exploration"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 group-hover:text-blue-800 transition-colors"
            >
              Browse Schemes Directory
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardContent>
        </Card>

        {/* AI Civic Assistant */}
        <Card className="hover:border-cyan-300 transition-all group">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700 group-hover:scale-105 transition-transform">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">
                  AI Civic Assistant
                </CardTitle>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
                  <Sparkles className="h-2.5 w-2.5" />
                  Gemini
                </span>
              </div>
            </div>
            <CardDescription>
              Get answers to your questions about schemes, documentation requirements, and municipal services in Gwalior.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/scheme-exploration#assistant"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-700 group-hover:text-cyan-800 transition-colors"
            >
              Ask a Civic Question
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* WORKING CITIZEN COMPLAINT SUBMISSION MODAL */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Report Sanitation Issue</h3>
                  <p className="text-xs text-slate-500">Gwalior Municipal Corporation Redressal</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
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
                  Sanitation Issue Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label} ({cat.desc})
                    </option>
                  ))}
                </select>
              </div>

              {/* Ward Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gwalior Municipal Ward <span className="text-rose-500">*</span>
                </label>
                <select
                  value={wardId}
                  onChange={(e) => setWardId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                >
                  {wards.length > 0 ? (
                    wards.map((w) => (
                      <option key={w.ward_id} value={w.ward_id}>
                        Ward {w.ward_no}: {w.ward_name} {w.sanitation_zone ? `(${w.sanitation_zone})` : ''}
                      </option>
                    ))
                  ) : (
                    <option value="GWL-W-024">Ward 24: Maharaj Bada / Lashkar</option>
                  )}
                </select>
              </div>

              {/* Landmark / Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Location Landmark / Address
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Near Gwalior Post Office, Sarafa Bazaar"
                  value={locationDesc}
                  onChange={(e) => setLocationDesc(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description of Grievance
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide any specific details (e.g. bin overflowing since 2 days)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* GPS Geolocation Detector */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <Navigation className="h-3.5 w-3.5 text-emerald-600" />
                    <span>GPS Geo-Tagging</span>
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
                        Detecting...
                      </>
                    ) : (
                      <>
                        <Navigation className="h-3 w-3" />
                        {latitude ? 'Re-detect GPS' : 'Detect Location'}
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
                  Original Complaint Photograph <span className="text-rose-500">*</span>
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
                        Remove Photo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center hover:border-emerald-400 hover:bg-emerald-50/20 transition-all cursor-pointer group"
                  >
                    <div className="mx-auto h-10 w-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Upload className="h-5 w-5" />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-800">
                      Click to capture or upload complaint photo
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      JPEG, PNG, or WebP up to 8 MB. Uploads directly to private storage.
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
                  onClick={() => setReportModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2 font-medium"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting Grievance...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Submit Complaint
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TIMELINE AUDIT HISTORY MODAL */}
      {historyModalComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <History className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Complaint Timeline: {historyModalComplaint.complaint_code}
                  </h3>
                  <p className="text-xs text-slate-500">Lifecycle Audit History</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModalComplaint(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1">
              {historyModalComplaint.history && historyModalComplaint.history.length > 0 ? (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {historyModalComplaint.history.map((event, idx) => (
                    <div key={event.id || idx} className="relative">
                      <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-600 ring-2 ring-blue-100" />
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
                            <span>Status:</span>
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
                  Initial complaint submission logged. Further timeline updates will appear as workers and officers process the grievance.
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <Button size="sm" variant="outline" onClick={() => setHistoryModalComplaint(null)}>
                Close Timeline
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FULL-SIZE PHOTO PREVIEW MODAL */}
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
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
