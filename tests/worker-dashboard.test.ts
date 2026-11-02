import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WorkerTaskCard } from '../components/dashboards/worker/worker-task-card';
import { WorkerCompleteModal } from '../components/dashboards/worker/worker-complete-modal';
import { WorkerPhotoModal } from '../components/dashboards/worker/worker-photo-modal';
import { WorkerView } from '../components/dashboards/worker-view';
import { LanguageProvider } from '../lib/i18n/context';
import type { AssignmentWithDetails, DemoSessionPayload } from '../types';

const mockWorkerSession: DemoSessionPayload = {
  user: {
    role: 'worker',
    name: 'Ramesh Kumar',
    email: 'ramesh.kumar@gwl.gov.in',
    designation: 'Sanitation Field Worker',
    ward: 'Morar Beat 3 (Ward 12)',
    zone: 'Zone 3',
    avatarInitials: 'RK',
    dbUserId: 'user-worker-1',
  },
  issuedAt: Date.now(),
  expiresAt: Date.now() + 86400000,
};

const mockWorkerTasks: AssignmentWithDetails[] = [
  {
    id: 'asgn-1',
    complaint_id: 'cmp-wrk-1',
    worker_id: 'user-worker-1',
    assigned_by: 'user-officer-1',
    status: 'assigned',
    assigned_at: new Date(Date.now() - 7200000).toISOString(),
    started_at: null,
    completed_at: null,
    updated_at: new Date().toISOString(),
    complaint: {
      id: 'cmp-wrk-1',
      complaint_code: 'GMC-2026-0501',
      category: 'garbage_dump',
      priority: 'high',
      status: 'assigned',
      description: 'Solid waste accumulation near post office.',
      location_description: 'Morar Post Office Lane',
      latitude: 26.22,
      longitude: 78.18,
      location_accuracy_m: 5,
      location_source: 'gps',
      ward_id: 'GWL-W-012',
      reporter_id: 'citizen-1',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date().toISOString(),
      images: [
        {
          id: 'img-w-1',
          complaint_id: 'cmp-wrk-1',
          image_type: 'before',
          bucket_name: 'complaint-originals',
          object_path: 'before/cmp-1.jpg',
          content_type: 'image/jpeg',
          file_size_bytes: 4096,
          uploaded_by: 'citizen-1',
          signed_url: '/test-dump.jpg',
          created_at: new Date().toISOString(),
        },
      ],
    },
  },
  {
    id: 'asgn-2',
    complaint_id: 'cmp-wrk-2',
    worker_id: 'user-worker-1',
    assigned_by: 'user-officer-1',
    status: 'in_progress',
    assigned_at: new Date(Date.now() - 14400000).toISOString(),
    started_at: new Date(Date.now() - 3600000).toISOString(),
    completed_at: null,
    updated_at: new Date().toISOString(),
    complaint: {
      id: 'cmp-wrk-2',
      complaint_code: 'GMC-2026-0502',
      category: 'drain_blockage',
      priority: 'urgent',
      status: 'in_progress',
      description: 'Storm drain choked with plastic rubble.',
      location_description: 'Near Morar Chowk',
      latitude: 26.221,
      longitude: 78.182,
      location_accuracy_m: 5,
      location_source: 'gps',
      ward_id: 'GWL-W-012',
      reporter_id: 'citizen-2',
      created_at: new Date(Date.now() - 14400000).toISOString(),
      updated_at: new Date().toISOString(),
      images: [],
    },
  },
];

function renderWithLang(element: React.ReactElement) {
  return renderToStaticMarkup(
    React.createElement(LanguageProvider, null, element)
  );
}

// ============================================================================
// 1. WORKER TASK CARD TESTS
// ============================================================================

test('WorkerTaskCard: renders assigned task details and Start Task button', () => {
  const html = renderToStaticMarkup(
    React.createElement(WorkerTaskCard, {
      task: mockWorkerTasks[0],
      isStarting: false,
      onStartTask: () => {},
      onOpenCompleteModal: () => {},
      onPreviewPhoto: () => {},
      language: 'hi',
    })
  );

  assert.ok(html.includes('GMC-2026-0501'), 'Task code');
  assert.ok(html.includes('खुला कचरा डंप'), 'Hindi category label');
  assert.ok(html.includes('कार्य शुरू करें'), 'Hindi start task button');
  assert.ok(html.includes('सौंपा गया'), 'Hindi status badge');
});

test('WorkerTaskCard: renders in_progress task with Complete Task button in English', () => {
  const html = renderToStaticMarkup(
    React.createElement(WorkerTaskCard, {
      task: mockWorkerTasks[1],
      isStarting: false,
      onStartTask: () => {},
      onOpenCompleteModal: () => {},
      onPreviewPhoto: () => {},
      language: 'en',
    })
  );

  assert.ok(html.includes('GMC-2026-0502'), 'Task code');
  assert.ok(html.includes('Blocked Drainage / Nullah'), 'English category label');
  assert.ok(html.includes('Complete Task &amp; Upload Proof') || html.includes('Complete Task & Upload Proof'), 'Complete button');
  assert.ok(html.includes('In Progress'), 'In Progress status badge');
});

// ============================================================================
// 2. WORKER COMPLETE MODAL TESTS
// ============================================================================

test('WorkerCompleteModal: renders camera capture option and remarks field', () => {
  const html = renderToStaticMarkup(
    React.createElement(WorkerCompleteModal, {
      task: mockWorkerTasks[1],
      onClose: () => {},
      onSubmit: async () => {},
      isSubmitting: false,
      language: 'hi',
    })
  );

  assert.ok(html.includes('सफाई कार्य पूर्ण करें'), 'Hindi modal title');
  assert.ok(html.includes('सफाई के बाद की फ़ोटो'), 'After photo label');
  assert.ok(html.includes('कैमरा से फ़ोटो लें'), 'Camera capture button');
  assert.ok(html.includes('कार्य विवरण / टिप्पणी'), 'Remarks label');
  assert.ok(html.includes('साक्ष्य जमा करें एवं पूर्ण करें'), 'Submit button');
});

// ============================================================================
// 3. WORKER PHOTO MODAL TESTS
// ============================================================================

test('WorkerPhotoModal: renders photo lightbox viewer with title', () => {
  const html = renderToStaticMarkup(
    React.createElement(WorkerPhotoModal, {
      previewPhoto: {
        url: '/test-dump.jpg',
        title: 'सफाई से पहले की फ़ोटो — GMC-2026-0501',
        subtitle: 'नागरिक द्वारा प्रस्तुत साक्ष्य',
      },
      onClose: () => {},
      language: 'hi',
    })
  );

  assert.ok(html.includes('सफाई से पहले की फ़ोटो'), 'Title rendered');
  assert.ok(html.includes('नागरिक द्वारा प्रस्तुत साक्ष्य'), 'Subtitle rendered');
});

// ============================================================================
// 4. WORKER VIEW INTEGRATION TESTS
// ============================================================================

test('WorkerView: renders Hindi-first worker command center and stat counters', () => {
  const html = renderWithLang(
    React.createElement(WorkerView, {
      session: mockWorkerSession,
      initialTasks: mockWorkerTasks,
    })
  );

  assert.ok(html.includes('डैशबोर्ड') || html.includes('Dashboard'), 'Worker title');
  assert.ok(html.includes('Ramesh Kumar'), 'Worker persona name');
  assert.ok(html.includes('GMC-2026-0501'), 'Task 1 in list');
  assert.ok(html.includes('GMC-2026-0502'), 'Task 2 in list');
});
