import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { OfficerMetricsBar } from '../components/dashboards/officer/officer-metrics-bar';
import { OfficerChartPanel } from '../components/dashboards/officer/officer-chart-panel';
import { OfficerFilterToolbar } from '../components/dashboards/officer/officer-filter-toolbar';
import { OfficerQueueTable } from '../components/dashboards/officer/officer-queue-table';
import { OfficerVerificationCard } from '../components/dashboards/officer/officer-verification-card';
import { OfficerAssignModal } from '../components/dashboards/officer/officer-assign-modal';
import { OfficerReviewDialog } from '../components/dashboards/officer/officer-review-dialog';
import { OfficerPhotoModal } from '../components/dashboards/officer/officer-photo-modal';
import { OfficerView } from '../components/dashboards/officer-view';
import type { ComplaintWithDetails, DemoSessionPayload, DemoUserRecord, WardRecord } from '../types';

const mockSession: DemoSessionPayload = {
  user: {
    role: 'officer',
    name: 'Vikram Malhotra',
    email: 'vikram.malhotra@gwl.gov.in',
    designation: 'Sanitation Superintendent',
    ward: 'GWL-W-012',
    zone: 'Zone 3',
    avatarInitials: 'VM',
    dbUserId: 'user-officer-1',
  },
  issuedAt: Date.now(),
  expiresAt: Date.now() + 86400000,
};

const mockWards = [
  {
    ward_id: 'GWL-W-012',
    ward_no: 12,
    ward_name: 'Morar Central',
    ward_name_original: 'मुरार सेंट्रल',
    lgd_code: null,
    city: 'Gwalior',
    state: 'Madhya Pradesh',
    country: 'India',
    ulb_name: 'Gwalior Municipal Corporation',
    ulb_lgd_code: null,
    latitude: 26.22,
    longitude: 78.18,
    boundary_geojson: null,
  },
  {
    ward_id: 'GWL-W-013',
    ward_no: 13,
    ward_name: 'Lashkar East',
    ward_name_original: 'लश्कर पूर्व',
    lgd_code: null,
    city: 'Gwalior',
    state: 'Madhya Pradesh',
    country: 'India',
    ulb_name: 'Gwalior Municipal Corporation',
    ulb_lgd_code: null,
    latitude: 26.21,
    longitude: 78.17,
    boundary_geojson: null,
  },
] as unknown as WardRecord[];

const mockWorkers: DemoUserRecord[] = [
  {
    id: 'worker-1',
    role: 'worker',
    display_name: 'Ramesh Kumar',
    ward_id: 'GWL-W-012',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'worker-2',
    role: 'worker',
    display_name: 'Suresh Singh',
    ward_id: 'GWL-W-012',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockComplaints: ComplaintWithDetails[] = [
  {
    id: 'cmp-1',
    complaint_code: 'GMC-2026-0001',
    category: 'garbage_dump',
    priority: 'high',
    status: 'under_review',
    description: 'Piles of solid waste overflowing near main market gate.',
    location_description: 'Near Morar Market Gate #2',
    latitude: 26.2235,
    longitude: 78.1891,
    location_accuracy_m: 5,
    location_source: 'gps',
    ward_id: 'GWL-W-012',
    reporter_id: 'citizen-1',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
    ward: mockWards[0],
    images: [
      {
        id: 'photo-1',
        complaint_id: 'cmp-1',
        image_type: 'before',
        bucket_name: 'complaint-originals',
        object_path: 'before/cmp-1.jpg',
        content_type: 'image/jpeg',
        file_size_bytes: 1024,
        uploaded_by: 'citizen-1',
        signed_url: '/test-before.jpg',
        created_at: new Date().toISOString(),
      },
      {
        id: 'photo-2',
        complaint_id: 'cmp-1',
        image_type: 'after',
        bucket_name: 'cleanup-evidence',
        object_path: 'after/cmp-1.jpg',
        content_type: 'image/jpeg',
        file_size_bytes: 1024,
        uploaded_by: 'worker-1',
        signed_url: '/test-after.jpg',
        created_at: new Date().toISOString(),
      },
    ],
    ai_verification: {
      id: 'v-1',
      complaint_id: 'cmp-1',
      before_image_id: 'photo-1',
      after_image_id: 'photo-2',
      processing_status: 'completed',
      model_name: 'gemini-3.8-flash',
      model_version: '1.0',
      waste_reduction_percentage: 95,
      processing_error: null,
      processed_at: new Date().toISOString(),
      human_review_status: 'pending',
      reviewed_by: null,
      review_remarks: null,
      reviewed_at: null,
      metrics: {
        evaluation: {
          confidenceLevel: 'high',
          cleanupSatisfactory: true,
          wasteReductionEstimatePercentage: 95,
        },
        findings: {
          beforeAnalysis: 'Heavy accumulation of household garbage.',
          afterAnalysis: 'Ground swept clean, waste removed completely.',
          residualWasteDetected: false,
          residualWasteObservations: 'None',
        },
        officerSummary: 'Cleanup verified successfully. Visual evidence shows 95% reduction in solid waste.',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'cmp-2',
    complaint_code: 'GMC-2026-0002',
    category: 'drain_blockage',
    priority: 'normal',
    status: 'submitted',
    description: 'Open storm drain blocked by plastic debris.',
    location_description: 'Near Lashkar East Chowk',
    latitude: 26.21,
    longitude: 78.17,
    location_accuracy_m: 10,
    location_source: 'manual',
    ward_id: 'GWL-W-013',
    reporter_id: 'citizen-2',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date().toISOString(),
    ward: mockWards[1],
    images: [],
  },
];

// ============================================================================
// 1. OFFICER METRICS BAR TESTS
// ============================================================================

test('OfficerMetricsBar: renders designation, scope banner, and 4 metric counts', () => {
  const html = renderToStaticMarkup(
    React.createElement(OfficerMetricsBar, {
      designation: 'Sanitation Superintendent',
      totalCount: 42,
      underReviewCount: 7,
      inProgressCount: 15,
      resolvedCount: 20,
    })
  );

  assert.ok(html.includes('Sanitation Superintendent'), 'Renders officer designation');
  assert.ok(html.includes('Total Grievances'), 'Renders total count label');
  assert.ok(html.includes('42'), 'Renders total count value');
  assert.ok(html.includes('Needs Review'), 'Renders needs review label');
  assert.ok(html.includes('7'), 'Renders under review count');
  assert.ok(html.includes('Active In Progress'), 'Renders in progress label');
  assert.ok(html.includes('15'), 'Renders in progress count');
  assert.ok(html.includes('Resolved'), 'Renders resolved label');
  assert.ok(html.includes('20'), 'Renders resolved count');
});

// ============================================================================
// 2. OFFICER CHART PANEL TESTS
// ============================================================================

test('OfficerChartPanel: renders #analytics anchor ID, title, and timeframe options', () => {
  const html = renderToStaticMarkup(
    React.createElement(OfficerChartPanel, {
      timeframe: 'Last 30 days',
      setTimeframe: () => {},
      complaints: mockComplaints,
    })
  );

  assert.ok(html.includes('id="analytics"'), 'Must have id="analytics" anchor');
  assert.ok(html.includes('City-Wide Complaint Metrics'), 'Title rendered');
  assert.ok(html.includes('Last 7 days'), 'Timeframe option 7 days');
  assert.ok(html.includes('Last 30 days'), 'Timeframe option 30 days');
  assert.ok(html.includes('This Quarter'), 'Timeframe option quarter');
});

// ============================================================================
// 3. OFFICER FILTER TOOLBAR TESTS
// ============================================================================

test('OfficerFilterToolbar: renders status tabs, counts, and search input', () => {
  const html = renderToStaticMarkup(
    React.createElement(OfficerFilterToolbar, {
      filteredCount: 2,
      totalCount: 10,
      underReviewCount: 1,
      unassignedCount: 1,
      inProgressCount: 0,
      statusFilter: 'all',
      setStatusFilter: () => {},
      wardFilter: 'all',
      setWardFilter: () => {},
      categoryFilter: 'all',
      setCategoryFilter: () => {},
      searchQuery: '',
      setSearchQuery: () => {},
      wards: mockWards,
    })
  );

  assert.ok(html.includes('Officer Complaint Queue'), 'Header rendered');
  assert.ok(html.includes('Under Review'), 'Under review tab rendered');
  assert.ok(html.includes('Unassigned'), 'Unassigned tab rendered');
  assert.ok(html.includes('Morar Central'), 'Ward option rendered');
  assert.ok(html.includes('Search code, landmark...'), 'Search placeholder rendered');
});

// ============================================================================
// 4. OFFICER QUEUE TABLE TESTS
// ============================================================================

test('OfficerQueueTable: renders complaint items and appropriate action triggers', () => {
  const html = renderToStaticMarkup(
    React.createElement(OfficerQueueTable, {
      complaints: mockComplaints,
      onInspect: () => {},
      onAssign: () => {},
      onReview: () => {},
      onResetFilters: () => {},
    })
  );

  assert.ok(html.includes('GMC-2026-0001'), 'Renders complaint code 1');
  assert.ok(html.includes('GMC-2026-0002'), 'Renders complaint code 2');
  assert.ok(html.includes('Review &amp; Verify') || html.includes('Review & Verify'), 'Renders review action for under_review complaint');
  assert.ok(html.includes('Assign'), 'Renders assign action for submitted complaint');
  assert.ok(html.includes('Inspect'), 'Renders inspect action button');
});

test('OfficerQueueTable: renders empty state when complaints list is empty', () => {
  const html = renderToStaticMarkup(
    React.createElement(OfficerQueueTable, {
      complaints: [],
      onInspect: () => {},
      onAssign: () => {},
      onReview: () => {},
      onResetFilters: () => {},
    })
  );

  assert.ok(html.includes('No complaints match active filters'), 'Renders empty state title');
  assert.ok(html.includes('Reset All Filters'), 'Renders reset filters action');
});

// ============================================================================
// 5. OFFICER VERIFICATION CARD TESTS
// ============================================================================

test('OfficerVerificationCard: renders Gemini Vision advisory summary and metrics', () => {
  const html = renderToStaticMarkup(
    React.createElement(OfficerVerificationCard, {
      complaint: mockComplaints[0],
      isVerifying: false,
      verifyError: null,
      onTriggerVerification: () => {},
    })
  );

  assert.ok(html.includes('AI Cleanliness Verification Analysis'), 'Renders AI title');
  assert.ok(html.includes('gemini-3.8-flash'), 'Renders model name');
  assert.ok(html.includes('95%'), 'Renders 95% waste reduction');
  assert.ok(html.includes('Cleanup verified successfully'), 'Renders summary note');
  assert.ok(html.includes('Advisory Notice:'), 'Renders advisory notice disclaimer');
});

// ============================================================================
// 6. OFFICER ASSIGN MODAL & REVIEW DIALOG TESTS
// ============================================================================

test('OfficerAssignModal: renders worker options and dispatch fields', () => {
  const html = renderToStaticMarkup(
    React.createElement(OfficerAssignModal, {
      complaint: mockComplaints[1],
      workers: mockWorkers,
      selectedWorkerId: 'worker-1',
      onSelectWorkerId: () => {},
      assignmentNotes: '',
      onChangeAssignmentNotes: () => {},
      isAssigning: false,
      assignError: null,
      onSubmit: () => {},
      onClose: () => {},
    })
  );

  assert.ok(html.includes('Dispatch Sanitation Field Worker'), 'Renders modal heading');
  assert.ok(html.includes('Ramesh Kumar'), 'Renders worker 1 option');
  assert.ok(html.includes('Suresh Singh'), 'Renders worker 2 option');
  assert.ok(html.includes('Confirm Task Allocation'), 'Renders submit button');
});

test('OfficerReviewDialog: renders decision choices and mandatory remarks textarea', () => {
  const html = renderToStaticMarkup(
    React.createElement(OfficerReviewDialog, {
      complaint: mockComplaints[0],
      reviewAction: 'approve',
      onChangeReviewAction: () => {},
      reviewRemarks: 'All debris removed properly.',
      onChangeReviewRemarks: () => {},
      isReviewing: false,
      reviewError: null,
      onSubmit: () => {},
      onClose: () => {},
    })
  );

  assert.ok(html.includes('Review &amp; Verify Cleanup Operations') || html.includes('Review & Verify Cleanup Operations'), 'Heading');
  assert.ok(html.includes('Approve'), 'Approve decision option');
  assert.ok(html.includes('Rework'), 'Rework decision option');
  assert.ok(html.includes('Reject'), 'Reject decision option');
  assert.ok(html.includes('Submit Review Decision'), 'Submit button');
});

// ============================================================================
// 7. OFFICER PHOTO MODAL TESTS
// ============================================================================

test('OfficerPhotoModal: renders full preview when preview photo is provided', () => {
  const html = renderToStaticMarkup(
    React.createElement(OfficerPhotoModal, {
      previewPhoto: {
        url: '/test-cleanup.jpg',
        title: 'Before Cleanup Photograph',
        subtitle: 'Uploaded by Citizen',
      },
      onClose: () => {},
    })
  );

  assert.ok(html.includes('Before Cleanup Photograph'), 'Photo title rendered');
  assert.ok(html.includes('Uploaded by Citizen'), 'Photo subtitle rendered');
  assert.ok(html.includes('Close Inspector'), 'Close inspector button rendered');
});

// ============================================================================
// 8. OFFICER VIEW RE-EXPORT & INTEGRATION TEST
// ============================================================================

test('OfficerView: top-level orchestrator renders complete dashboard hierarchy', () => {
  const html = renderToStaticMarkup(
    React.createElement(OfficerView, {
      session: mockSession,
      initialComplaints: mockComplaints,
      wards: mockWards,
      workers: mockWorkers,
    })
  );

  assert.ok(html.includes('Municipal Officer Operations'), 'Renders dashboard title');
  assert.ok(html.includes('id="analytics"'), 'Renders analytics section');
  assert.ok(html.includes('id="queue"'), 'Renders queue section');
  assert.ok(html.includes('GMC-2026-0001'), 'Renders complaint item in table');
});
