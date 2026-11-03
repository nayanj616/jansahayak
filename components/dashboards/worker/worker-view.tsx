'use client';

import * as React from 'react';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  HardHat,
  MapPin,
  X,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useLanguage } from '@/lib/i18n/context';
import { formatFrontendError } from '@/lib/errors';
import type { AssignmentWithDetails, DemoSessionPayload } from '@/types';
import { WorkerTaskCard } from './worker-task-card';
import { WorkerCompleteModal } from './worker-complete-modal';
import { WorkerPhotoModal } from './worker-photo-modal';
import type { WorkerPhotoPreviewState } from './worker-types';

interface WorkerViewProps {
  session: DemoSessionPayload;
  initialTasks?: AssignmentWithDetails[];
}

export function WorkerView({ session, initialTasks = [] }: WorkerViewProps) {
  const { language, setLanguage, t } = useLanguage();

  // Worker dashboard defaults to Hindi on first visit if no explicit language stored
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const isExplicit = localStorage.getItem('jansahayak_explicit_choice') === 'true';
      const stored = localStorage.getItem('jansahayak_language');
      const hasCookie = document.cookie.includes('jansahayak_lang');
      if (!isExplicit && !stored && !hasCookie && language !== 'hi') {
        setLanguage('hi');
      }
    }
  }, [language, setLanguage]);

  const isHi = language === 'hi';

  const [tasks, setTasks] = React.useState<AssignmentWithDetails[]>(initialTasks);
  const [filter, setFilter] = React.useState<'all' | 'assigned' | 'in_progress' | 'completed'>('all');
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [startingTaskId, setStartingTaskId] = React.useState<string | null>(null);

  // Complete Task Modal state
  const [activeUploadTask, setActiveUploadTask] = React.useState<AssignmentWithDetails | null>(null);
  const [isSubmittingProof, setIsSubmittingProof] = React.useState(false);

  // Notification banner
  const [notification, setNotification] = React.useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Full photo preview modal
  const [previewPhoto, setPreviewPhoto] = React.useState<WorkerPhotoPreviewState | null>(null);

  // Computed stat counts from live task state
  const assignedCount = tasks.filter((t) => t.status === 'assigned').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  const stats = [
    {
      label: t('worker.stats.assigned'),
      value: assignedCount,
      icon: ClipboardList,
      color: 'text-civic-700',
      bgColor: 'bg-civic-50',
      borderColor: 'border-civic-200',
      description: t('worker.stats.assignedDesc', { count: assignedCount }),
    },
    {
      label: t('worker.stats.inProgress'),
      value: inProgressCount,
      icon: Clock,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      description: t('worker.stats.inProgressDesc', { count: inProgressCount }),
    },
    {
      label: t('worker.stats.completed'),
      value: completedCount,
      icon: CheckCircle2,
      color: 'text-sanitation-700',
      bgColor: 'bg-sanitation-50',
      borderColor: 'border-sanitation-200',
      description: t('worker.stats.completedDesc', { count: completedCount }),
    },
  ];

  // Refresh tasks from server API
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setNotification(null);
    try {
      const res = await fetch('/api/tasks');
      if (!res.ok) {
        throw new Error(
          isHi
            ? `कार्य सूची प्राप्त करने में विफल (${res.status})`
            : `Failed to refresh tasks (${res.status})`
        );
      }
      const data = await res.json();
      if (data.tasks) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error('[Worker Dashboard] Refresh error:', err);
      setNotification({
        type: 'error',
        message: formatFrontendError(err, language, 'errors.refreshFailed'),
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
        throw new Error(data.message || (isHi ? 'कार्य शुरू करने में विफल' : 'Failed to start task'));
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? (data.task as AssignmentWithDetails) : t))
      );

      setNotification({
        type: 'success',
        message: isHi
          ? `कार्य ${data.task.complaint?.complaint_code || ''} प्रारंभ हुआ! स्थिति अब 'प्रगति पर' है।`
          : `Task ${data.task.complaint?.complaint_code || ''} started! Status is now In Progress.`,
      });
    } catch (err) {
      console.error('[Worker Dashboard] Start task error:', err);
      setNotification({
        type: 'error',
        message: formatFrontendError(err, language, 'errors.taskStartFailed'),
      });
    } finally {
      setStartingTaskId(null);
    }
  };

  // Submit cleanup completion proof
  const handleSubmitProof = async (file: File, remarks: string) => {
    if (!activeUploadTask) return;

    setIsSubmittingProof(true);

    try {
      const formData = new FormData();
      formData.append('action', 'complete');
      formData.append('assignment_id', activeUploadTask.id);
      formData.append('image', file);
      if (remarks.trim()) {
        formData.append('remarks', remarks.trim());
      }

      const res = await fetch('/api/tasks', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.message || (isHi ? 'सफाई साक्ष्य जमा करने में विफल' : 'Failed to submit cleanup proof')
        );
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === activeUploadTask.id ? (data.task as AssignmentWithDetails) : t))
      );

      setActiveUploadTask(null);
      setNotification({
        type: 'success',
        message: isHi
          ? `कार्य ${data.task.complaint?.complaint_code || ''} पूर्ण हुआ! सफाई साक्ष्य अधिकारी समीक्षा हेतु अग्रेषित।`
          : `Task ${data.task.complaint?.complaint_code || ''} marked completed with cleanup proof! Forwarded for municipal review.`,
      });
    } finally {
      setIsSubmittingProof(false);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">
            {isHi ? 'सफाईकर्मी कार्य डैशबोर्ड' : 'Worker Dashboard'}
          </h1>
          <p className="text-sm text-slate-500">
            {isHi
              ? 'सौंपे गए स्वच्छता कार्य देखें, स्थिति अपडेट करें और कार्य उपरांत साक्ष्य अपलोड करें।'
              : 'View allocated sanitation tasks, update progress, and submit photo verification.'}
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
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-civic-600' : 'text-slate-500'}`}
            />
            {isRefreshing
              ? isHi
                ? 'रीफ़्रेश हो रहा है...'
                : 'Refreshing...'
              : isHi
              ? 'कार्य सूची रीफ़्रेश करें'
              : 'Refresh Tasks'}
          </Button>
        </div>
      </div>

      {/* Global Notification Banner */}
      {notification && (
        <div
          className={`rounded-xl border p-4 text-xs flex items-center justify-between animate-in fade-in-0 shadow-2xs ${
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
            className="hover:opacity-75 font-bold text-sm px-1 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Field Worker Profile Badge Banner */}
      <div className="rounded-xl border border-civic-100 bg-civic-50/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-civic-900">
        <div className="flex items-center gap-2">
          <HardHat className="h-4 w-4 text-civic-600 shrink-0" />
          <span>
            {isHi ? 'सफाईकर्मी परिचय:' : 'Field Persona:'} <strong>{session.user.name}</strong> &bull;{' '}
            {isHi ? 'बीट सेक्टर: मुरार बीट 3 (वार्ड 12)' : 'Beat Sector: Morar Beat 3 (Ward 12)'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-civic-700">
          <MapPin className="h-3.5 w-3.5" />
          <span>
            {isHi
              ? 'ग्वालियर नगर निगम स्वच्छता प्रभाग'
              : 'Live Gwalior Municipal Sanitation Beat'}
          </span>
        </div>
      </div>

      {/* 3 Stat Counter Cards with Live Computations */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className={`border ${stat.borderColor} ${stat.bgColor}/40 shadow-2xs transition-shadow hover:shadow-xs`}
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
      <Card className="shadow-2xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-4 border-b border-slate-100">
          <div>
            <CardTitle className="text-base font-semibold">
              {t('worker.tasksTitle')}
            </CardTitle>
            <CardDescription>
              {t('worker.tasksSubtitle')}
            </CardDescription>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs self-start sm:self-auto">
            {(['all', 'assigned', 'in_progress', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-md font-medium capitalize transition-all cursor-pointer ${
                  filter === tab
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'all'
                  ? `${t('worker.tabs.all')} (${tasks.length})`
                  : tab === 'assigned'
                  ? `${t('worker.tabs.assigned')} (${assignedCount})`
                  : tab === 'in_progress'
                  ? `${t('worker.tabs.inProgress')} (${inProgressCount})`
                  : `${t('worker.tabs.completed')} (${completedCount})`}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {filteredTasks.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title={t('worker.empty.title')}
              description={t('worker.empty.desc')}
            />
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <WorkerTaskCard
                  key={task.id}
                  task={task}
                  isStarting={startingTaskId === task.id}
                  onStartTask={handleStartTask}
                  onOpenCompleteModal={(t) => setActiveUploadTask(t)}
                  onPreviewPhoto={(p) => setPreviewPhoto(p)}
                  language={language}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complete Task & Upload Proof Modal Dialog */}
      <WorkerCompleteModal
        task={activeUploadTask}
        onClose={() => setActiveUploadTask(null)}
        onSubmit={handleSubmitProof}
        isSubmitting={isSubmittingProof}
        language={language}
      />

      {/* High-Resolution Photo Viewer Modal */}
      <WorkerPhotoModal
        previewPhoto={previewPhoto}
        onClose={() => setPreviewPhoto(null)}
        language={language}
      />
    </div>
  );
}

