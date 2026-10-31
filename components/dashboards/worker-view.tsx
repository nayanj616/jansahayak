'use client';

import * as React from 'react';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  Camera,
  MapPin,
  RefreshCw,
  HardHat,
  Play,
  Upload,
  X,
  ExternalLink,
  Loader2,
  FileText,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import type { AssignmentWithDetails, DemoSessionPayload } from '@/types';

interface WorkerViewProps {
  session: DemoSessionPayload;
  initialTasks?: AssignmentWithDetails[];
}

const CATEGORY_LABELS: Record<string, string> = {
  garbage_dump: 'Garbage Dump / Open Pile',
  overflowing_bin: 'Overflowing Waste Bin',
  drain_blockage: 'Blocked Drainage / Nullah',
  dead_animal: 'Dead Animal Carcass Removal',
  construction_debris: 'Construction Debris (C&D)',
  open_defecation: 'Open Defecation Area',
  sweeping_needed: 'Street Sweeping Required',
  street_cleaning: 'Street Sanitation & Litter',
  water_logging: 'Water Logging & Sludge',
  sewage_overflow: 'Sewage Overflow',
  solid_waste: 'Solid Waste Accumulation',
  other: 'General Sanitation Issue',
};

export function WorkerView({ session, initialTasks = [] }: WorkerViewProps) {
  const [tasks, setTasks] = React.useState<AssignmentWithDetails[]>(initialTasks);
  const [filter, setFilter] = React.useState<'all' | 'assigned' | 'in_progress' | 'completed'>('all');
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [startingTaskId, setStartingTaskId] = React.useState<string | null>(null);

  // Complete Task Modal state
  const [activeUploadTask, setActiveUploadTask] = React.useState<AssignmentWithDetails | null>(null);
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [uploadFilePreview, setUploadFilePreview] = React.useState<string | null>(null);
  const [uploadRemarks, setUploadRemarks] = React.useState('');
  const [isSubmittingProof, setIsSubmittingProof] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Notification banners
  const [notification, setNotification] = React.useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Full photo preview modal
  const [previewPhoto, setPreviewPhoto] = React.useState<{
    url: string;
    title: string;
    subtitle?: string;
  } | null>(null);

  // Computed stat counts from live task state
  const assignedCount = tasks.filter((t) => t.status === 'assigned').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  const stats = [
    {
      label: 'Assigned',
      value: assignedCount,
      icon: ClipboardList,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      description: `${assignedCount} pending task${assignedCount === 1 ? '' : 's'} to accept`,
    },
    {
      label: 'In Progress',
      value: inProgressCount,
      icon: Clock,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
      description: `${inProgressCount} active cleanup${inProgressCount === 1 ? '' : 's'} underway`,
    },
    {
      label: 'Completed',
      value: completedCount,
      icon: CheckCircle2,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      description: `${completedCount} completed task${completedCount === 1 ? '' : 's'} under review`,
    },
  ];

  // Refresh tasks from server API
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setNotification(null);
    try {
      const res = await fetch('/api/tasks');
      if (!res.ok) {
        throw new Error(`Failed to refresh tasks (${res.status})`);
      }
      const data = await res.json();
      if (data.tasks) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error('[Worker Dashboard] Refresh error:', err);
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to refresh tasks from server',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Start Task Handler
  const handleStartTask = async (taskId: string) => {
    setStartingTaskId(taskId);
    setNotification(null);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start',
          assignment_id: taskId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to start task');
      }

      // Update local task state
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? (data.task as AssignmentWithDetails) : t))
      );

      setNotification({
        type: 'success',
        message: `Task ${data.task.complaint?.complaint_code || ''} started! Status is now In Progress.`,
      });
    } catch (err) {
      console.error('[Worker Dashboard] Start task error:', err);
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to start task',
      });
    } finally {
      setStartingTaskId(null);
    }
  };

  // Modal file picker handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError('Invalid format: Only JPEG, PNG, or WebP images are permitted.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError(`File too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Limit is 8 MB.`);
      return;
    }

    setUploadError(null);
    setUploadFile(file);
    const objectUrl = URL.createObjectURL(file);
    setUploadFilePreview(objectUrl);
  };

  // Open complete modal
  const openCompleteModal = (task: AssignmentWithDetails) => {
    setActiveUploadTask(task);
    setUploadFile(null);
    setUploadFilePreview(null);
    setUploadRemarks('');
    setUploadError(null);
  };

  // Close complete modal
  const closeCompleteModal = () => {
    if (uploadFilePreview) {
      URL.revokeObjectURL(uploadFilePreview);
    }
    setActiveUploadTask(null);
    setUploadFile(null);
    setUploadFilePreview(null);
    setUploadRemarks('');
    setUploadError(null);
  };

  // Submit cleanup completion proof
  const handleSubmitProof = async () => {
    if (!activeUploadTask || !uploadFile) {
      setUploadError('Please capture or select an after-cleanup photograph.');
      return;
    }

    setIsSubmittingProof(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('action', 'complete');
      formData.append('assignment_id', activeUploadTask.id);
      formData.append('image', uploadFile);
      if (uploadRemarks.trim()) {
        formData.append('remarks', uploadRemarks.trim());
      }

      const res = await fetch('/api/tasks', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit cleanup proof');
      }

      // Update local task state
      setTasks((prev) =>
        prev.map((t) => (t.id === activeUploadTask.id ? (data.task as AssignmentWithDetails) : t))
      );

      closeCompleteModal();
      setNotification({
        type: 'success',
        message: `Task ${data.task.complaint?.complaint_code || ''} marked completed with cleanup proof! Forwarded for municipal review.`,
      });
    } catch (err) {
      console.error('[Worker Dashboard] Complete task error:', err);
      setUploadError(err instanceof Error ? err.message : 'Failed to submit cleanup evidence');
    } finally {
      setIsSubmittingProof(false);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  // Helper for priority badges
  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">High</Badge>;
      case 'normal':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Normal</Badge>;
      case 'low':
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  // Helper for assignment status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'assigned':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Assigned</Badge>;
      case 'in_progress':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-slate-100 text-slate-800 border-slate-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Worker Dashboard</h1>
          <p className="text-sm text-slate-500">
            View allocated sanitation tasks, update progress, and submit photo verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Tasks'}
          </Button>
        </div>
      </div>

      {/* Global Notification Banner */}
      {notification && (
        <div
          className={`rounded-xl border p-4 text-xs flex items-center justify-between animate-in fade-in-0 ${
            notification.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="hover:opacity-75 font-bold text-sm px-1"
          >
            &times;
          </button>
        </div>
      )}

      {/* Field Worker Profile Badge Banner */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900">
        <div className="flex items-center gap-2">
          <HardHat className="h-4 w-4 text-blue-600 shrink-0" />
          <span>
            Field Persona: <strong>{session.user.name}</strong> &bull; Beat Sector: Morar Beat 3 (Ward 12)
          </span>
        </div>
        <div className="flex items-center gap-2 text-blue-700">
          <MapPin className="h-3.5 w-3.5" />
          <span>Live Gwalior Municipal Sanitation Beat</span>
        </div>
      </div>

      {/* 3 Stat Counter Cards with Live Computations */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className={`border ${stat.borderColor} ${stat.bgColor}/40 shadow-xs transition-shadow hover:shadow-sm`}
            >
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    {stat.label}
                  </p>
                  <p className={`text-3xl font-extrabold ${stat.color} tracking-tight`}>
                    {stat.value}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">{stat.description}</p>
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bgColor} ${stat.color}`}
                >
                  <Icon className="h-6 w-6 stroke-[1.8]" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* My Assignments Section with Filter Tabs */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-4 border-b border-slate-100">
          <div>
            <CardTitle className="text-base font-semibold">Allocated Sanitation Tasks</CardTitle>
            <CardDescription>
              Sanitation tasks assigned to your beat by the municipal supervisor
            </CardDescription>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs self-start sm:self-auto">
            {(['all', 'assigned', 'in_progress', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-md font-medium capitalize transition-all ${
                  filter === tab
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'all'
                  ? `All (${tasks.length})`
                  : tab === 'assigned'
                  ? `Assigned (${assignedCount})`
                  : tab === 'in_progress'
                  ? `In Progress (${inProgressCount})`
                  : `Completed (${completedCount})`}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {filteredTasks.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title={`No ${filter === 'all' ? '' : filter.replace('_', ' ')} tasks found`}
              description={
                filter === 'all'
                  ? 'No sanitation tasks are currently assigned to your demonstration beat.'
                  : `There are currently no tasks in the '${filter.replace('_', ' ')}' state.`
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => {
                const complaint = task.complaint;
                const beforeImg = complaint?.images?.find(
                  (img) => img.image_type === 'before' || img.image_type === 'original'
                );
                const afterImg = complaint?.images?.find(
                  (img) => img.image_type === 'after'
                );
                const isStarting = startingTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-sm font-bold text-slate-900">
                          {complaint?.complaint_code || 'GWL-TASK'}
                        </span>
                        <Badge variant="outline" className="text-xs bg-slate-50 font-normal">
                          {CATEGORY_LABELS[complaint?.category || ''] || complaint?.category || 'Sanitation Task'}
                        </Badge>
                        {complaint?.priority && renderPriorityBadge(complaint.priority)}
                        {renderStatusBadge(task.status)}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          Assigned:{' '}
                          {new Date(task.assigned_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Middle Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Left: Location & Description */}
                      <div className="md:col-span-2 space-y-2.5 text-xs">
                        <div className="flex items-start gap-2 text-slate-700">
                          <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-medium text-slate-900">
                              {complaint?.ward
                                ? `Ward ${complaint.ward.ward_no}: ${complaint.ward.ward_name}`
                                : 'Morar Ward Beat'}
                            </span>
                            {complaint?.location_description && (
                              <p className="text-slate-600 mt-0.5">
                                Landmark: {complaint.location_description}
                              </p>
                            )}
                          </div>
                        </div>

                        {complaint?.description && (
                          <div className="flex items-start gap-2 text-slate-600">
                            <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                            <p className="leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 w-full">
                              {complaint.description}
                            </p>
                          </div>
                        )}

                        {task.started_at && (
                          <div className="text-[11px] text-amber-700 font-medium">
                            Work started:{' '}
                            {new Date(task.started_at).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </div>
                        )}
                        {task.completed_at && (
                          <div className="text-[11px] text-emerald-700 font-medium">
                            Cleanup completed:{' '}
                            {new Date(task.completed_at).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </div>
                        )}
                      </div>

                      {/* Right: Photographic Evidence Thumbnails */}
                      <div className="flex sm:justify-end items-center gap-3">
                        {/* Before Photo */}
                        {beforeImg?.signed_url ? (
                          <div className="flex flex-col items-center">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewPhoto({
                                  url: beforeImg.signed_url!,
                                  title: `Before Photo — ${complaint?.complaint_code || ''}`,
                                  subtitle: 'Original photographic evidence submitted by citizen',
                                })
                              }
                              className="group relative h-20 w-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 hover:ring-2 hover:ring-blue-500 transition-all"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={beforeImg.signed_url}
                                alt="Before Cleanup"
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <ExternalLink className="h-4 w-4" />
                              </div>
                            </button>
                            <span className="text-[10px] text-slate-500 mt-1 font-medium">Before Cleanup</span>
                          </div>
                        ) : (
                          <div className="h-20 w-24 rounded-lg border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-[10px] text-slate-400 p-1 text-center">
                            <span>No Before Photo</span>
                          </div>
                        )}

                        {/* After Photo (if available) */}
                        {afterImg?.signed_url ? (
                          <div className="flex flex-col items-center">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewPhoto({
                                  url: afterImg.signed_url!,
                                  title: `After Photo (Proof) — ${complaint?.complaint_code || ''}`,
                                  subtitle: 'Photographic evidence uploaded by sanitation worker',
                                })
                              }
                              className="group relative h-20 w-24 rounded-lg overflow-hidden border-2 border-emerald-400 bg-slate-100 hover:ring-2 hover:ring-emerald-500 transition-all"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={afterImg.signed_url}
                                alt="After Cleanup"
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-emerald-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <ExternalLink className="h-4 w-4" />
                              </div>
                            </button>
                            <span className="text-[10px] text-emerald-700 mt-1 font-semibold">After Proof</span>
                          </div>
                        ) : task.status === 'in_progress' ? (
                          <button
                            type="button"
                            onClick={() => openCompleteModal(task)}
                            className="h-20 w-24 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-50 flex flex-col items-center justify-center text-amber-700 text-[10px] p-1 text-center transition-colors cursor-pointer"
                          >
                            <Camera className="h-5 w-5 mb-1 text-amber-600" />
                            <span className="font-medium">Upload Proof</span>
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {/* Action Bar Footer */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                      <div className="text-xs text-slate-500">
                        {task.status === 'assigned' && (
                          <span>Task is queued. Click Start Task to begin field operations.</span>
                        )}
                        {task.status === 'in_progress' && (
                          <span className="text-amber-700 font-medium flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            Active cleanup underway. Upload an after-cleanup photo to finish.
                          </span>
                        )}
                        {task.status === 'completed' && (
                          <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Proof submitted. Pending municipal officer review & AI verification.
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {task.status === 'assigned' && (
                          <Button
                            size="sm"
                            onClick={() => handleStartTask(task.id)}
                            disabled={isStarting}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
                          >
                            {isStarting ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Play className="h-3.5 w-3.5 fill-current" />
                            )}
                            {isStarting ? 'Starting...' : 'Start Task'}
                          </Button>
                        )}

                        {task.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={() => openCompleteModal(task)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                          >
                            <Camera className="h-3.5 w-3.5" />
                            Complete Task & Upload Proof
                          </Button>
                        )}

                        {task.status === 'completed' && (
                          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs px-2.5 py-1">
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complete Task & Upload Proof Modal Dialog */}
      {activeUploadTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Camera className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Complete Cleanup — {activeUploadTask.complaint?.complaint_code}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Submit photographic proof to verify the sanitation issue has been resolved.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeCompleteModal}
                disabled={isSubmittingProof}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4">
              {uploadError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Photo Upload Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  After-Cleanup Photograph <span className="text-rose-600">*</span>
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
                    className="w-full rounded-xl border-2 border-dashed border-slate-300 p-6 flex flex-col items-center justify-center text-center hover:border-emerald-500 hover:bg-emerald-50/30 transition-all cursor-pointer group"
                  >
                    <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Camera className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800">
                      Take Photo or Browse Image
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1">
                      JPEG, PNG or WebP up to 8 MB
                    </span>
                  </button>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={uploadFilePreview}
                      alt="Cleanup Preview"
                      className="w-full max-h-56 object-contain bg-slate-950"
                    />
                    <div className="p-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="truncate max-w-[200px] text-slate-700 font-medium">
                        {uploadFile?.name} ({(uploadFile!.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setUploadFile(null);
                          setUploadFilePreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-7 px-2"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Optional Field Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Field Remarks (Optional)
                </label>
                <textarea
                  value={uploadRemarks}
                  onChange={(e) => setUploadRemarks(e.target.value)}
                  placeholder="e.g. Cleared 2 overflowing dumpsters, swept 30m perimeter, sprayed lime powder."
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-400 block text-right">
                  {uploadRemarks.length}/500 characters
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 p-4 sm:p-5 flex items-center justify-end gap-2 bg-slate-50/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={closeCompleteModal}
                disabled={isSubmittingProof}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSubmitProof}
                disabled={!uploadFile || isSubmittingProof}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 font-medium shadow-xs"
              >
                {isSubmittingProof ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Uploading Proof...
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5" />
                    Submit Proof & Complete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* High-Resolution Photo Viewer Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div className="relative max-w-3xl w-full rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-800 text-white">
              <div>
                <h4 className="text-sm font-semibold">{previewPhoto.title}</h4>
                {previewPhoto.subtitle && (
                  <p className="text-[11px] text-slate-400">{previewPhoto.subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center bg-black/60 max-h-[75vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewPhoto.url}
                alt={previewPhoto.title}
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
