import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CitizenQuickActionsHeader, CitizenScopeBanner, CitizenExplorationCards } from '../components/dashboards/citizen/citizen-quick-actions';
import { CitizenComplaintList } from '../components/dashboards/citizen/citizen-complaint-list';
import { CitizenReportModal } from '../components/dashboards/citizen/citizen-report-modal';
import { CitizenHistoryModal } from '../components/dashboards/citizen/citizen-history-modal';
import { CitizenView } from '../components/dashboards/citizen-view';
import { LanguageProvider } from '../lib/i18n/context';
import type { ComplaintWithDetails, DemoSessionPayload, WardRecord } from '../types';

const mockCitizenSession: DemoSessionPayload = {
  user: {
    role: 'citizen',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    designation: 'Citizen Resident',
    ward: 'Ward 24: Maharaj Bada',
    zone: 'Lashkar Zone',
    avatarInitials: 'AS',
    dbUserId: 'user-citizen-1',
  },
  issuedAt: Date.now(),
  expiresAt: Date.now() + 86400000,
};

const mockWards = [
  {
    ward_id: 'GWL-W-024',
    ward_no: 24,
    ward_name: 'Maharaj Bada',
    ward_name_original: 'महाराज बाड़ा',
    lgd_code: null,
    city: 'Gwalior',
    state: 'Madhya Pradesh',
    country: 'India',
    ulb_name: 'Gwalior Municipal Corporation',
    ulb_lgd_code: null,
    latitude: 26.21,
    longitude: 78.16,
    boundary_geojson: null,
  },
] as unknown as WardRecord[];

const mockCitizenComplaints: ComplaintWithDetails[] = [
  {
    id: 'cmp-cit-1',
    complaint_code: 'GMC-2026-0099',
    category: 'overflowing_bin',
    priority: 'high',
    status: 'assigned',
    description: 'Community dustbin overflowing with wet waste.',
    location_description: 'Near Sarafa Bazaar main intersection',
    latitude: 26.215,
    longitude: 78.165,
    location_accuracy_m: 8,
    location_source: 'gps',
    ward_id: 'GWL-W-024',
    reporter_id: 'user-citizen-1',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
    ward: mockWards[0],
    images: [
      {
        id: 'img-1',
        complaint_id: 'cmp-cit-1',
        image_type: 'before',
        bucket_name: 'complaint-originals',
        object_path: 'before/cmp-1.jpg',
        content_type: 'image/jpeg',
        file_size_bytes: 2048,
        uploaded_by: 'user-citizen-1',
        signed_url: '/test-bin.jpg',
        created_at: new Date().toISOString(),
      },
    ],
    history: [
      {
        id: 'hist-1',
        complaint_id: 'cmp-cit-1',
        action: 'complaint_filed',
        old_status: null,
        new_status: 'submitted',
        actor_id: 'user-citizen-1',
        remarks: 'Complaint filed via citizen portal',
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'hist-2',
        complaint_id: 'cmp-cit-1',
        action: 'worker_assigned',
        old_status: 'submitted',
        new_status: 'assigned',
        actor_id: 'officer-1',
        remarks: 'Sanitation field staff allocated',
        created_at: new Date(Date.now() - 1800000).toISOString(),
      },
    ],
  },
];

function renderWithLang(element: React.ReactElement) {
  return renderToStaticMarkup(
    React.createElement(LanguageProvider, null, element)
  );
}

// ============================================================================
// 1. CITIZEN QUICK ACTIONS & BANNER TESTS
// ============================================================================

test('CitizenQuickActionsHeader: renders English by default', () => {
  const html = renderToStaticMarkup(
    React.createElement(CitizenQuickActionsHeader, {
      onOpenReportModal: () => {},
      language: 'en',
    })
  );

  assert.ok(html.includes('Citizen Dashboard'), 'English title');
  assert.ok(html.includes('Report a New Complaint'), 'CTA button');
});

test('CitizenQuickActionsHeader: renders Hindi when language is hi', () => {
  const html = renderToStaticMarkup(
    React.createElement(CitizenQuickActionsHeader, {
      onOpenReportModal: () => {},
      language: 'hi',
    })
  );

  assert.ok(html.includes('नागरिक डैशबोर्ड'), 'Hindi title');
  assert.ok(html.includes('नई शिकायत दर्ज करें'), 'Hindi CTA button');
});

test('CitizenScopeBanner: renders demonstration ward and session info', () => {
  const html = renderToStaticMarkup(
    React.createElement(CitizenScopeBanner, {
      session: mockCitizenSession,
      language: 'en',
    })
  );

  assert.ok(html.includes('Demonstration Area:'), 'Scope banner label');
  assert.ok(html.includes('Maharaj Bada'), 'Ward name');
});

test('CitizenExplorationCards: renders scheme directory and AI assistant links', () => {
  const html = renderToStaticMarkup(
    React.createElement(CitizenExplorationCards, { language: 'en' })
  );

  assert.ok(html.includes('Explore Government Schemes'), 'Scheme card title');
  assert.ok(html.includes('AI Civic Assistant'), 'Assistant card title');
  assert.ok(html.includes('href="/scheme-exploration"'), 'Link to schemes');
  assert.ok(html.includes('href="/scheme-exploration#assistant"'), 'Link to assistant');
});

// ============================================================================
// 2. CITIZEN COMPLAINT LIST TESTS
// ============================================================================

test('CitizenComplaintList: renders complaint items and timeline action', () => {
  const html = renderToStaticMarkup(
    React.createElement(CitizenComplaintList, {
      complaints: mockCitizenComplaints,
      onOpenReportModal: () => {},
      onOpenTimeline: () => {},
      onPreviewPhoto: () => {},
      language: 'en',
    })
  );

  assert.ok(html.includes('GMC-2026-0099'), 'Complaint code');
  assert.ok(html.includes('Overflowing Dustbin'), 'Category label');
  assert.ok(html.includes('Sarafa Bazaar'), 'Location text');
  assert.ok(html.includes('Timeline'), 'Timeline button');
});

test('CitizenComplaintList: renders empty state when no complaints exist', () => {
  const html = renderToStaticMarkup(
    React.createElement(CitizenComplaintList, {
      complaints: [],
      onOpenReportModal: () => {},
      onOpenTimeline: () => {},
      onPreviewPhoto: () => {},
      language: 'en',
    })
  );

  assert.ok(html.includes('No complaints yet'), 'Empty title');
  assert.ok(html.includes('File First Complaint'), 'First complaint CTA');
});

// ============================================================================
// 3. CITIZEN REPORT MODAL & HISTORY MODAL TESTS
// ============================================================================

test('CitizenReportModal: renders categories, wards, and GPS geo-tagging section', () => {
  const html = renderToStaticMarkup(
    React.createElement(CitizenReportModal, {
      isOpen: true,
      onClose: () => {},
      wards: mockWards,
      onSubmitSuccess: () => {},
      language: 'en',
    })
  );

  assert.ok(html.includes('Report Sanitation Issue'), 'Modal heading');
  assert.ok(html.includes('Open Garbage Dump'), 'Category option');
  assert.ok(html.includes('Maharaj Bada'), 'Ward option');
  assert.ok(html.includes('GPS Geo-Tagging'), 'GPS section');
  assert.ok(html.includes('Original Complaint Photograph'), 'Photo upload input');
  assert.ok(html.includes('Submit Complaint'), 'Submit button');
});

test('CitizenHistoryModal: renders audit timeline events and status transitions', () => {
  const html = renderToStaticMarkup(
    React.createElement(CitizenHistoryModal, {
      complaint: mockCitizenComplaints[0],
      onClose: () => {},
      language: 'en',
    })
  );

  assert.ok(html.includes('Complaint Timeline: GMC-2026-0099'), 'Modal title');
  assert.ok(html.includes('Complaint filed via citizen portal'), 'Audit remarks 1');
  assert.ok(html.includes('Sanitation field staff allocated'), 'Audit remarks 2');
  assert.ok(html.includes('Close Timeline'), 'Close button');
});

// ============================================================================
// 4. CITIZEN VIEW ORCHESTRATOR INTEGRATION TEST
// ============================================================================

test('CitizenView: renders complete citizen dashboard hierarchy', () => {
  const html = renderWithLang(
    React.createElement(CitizenView, {
      session: mockCitizenSession,
      initialComplaints: mockCitizenComplaints,
      wards: mockWards,
    })
  );

  assert.ok(html.includes('Citizen Dashboard') || html.includes('नागरिक डैशबोर्ड'), 'Dashboard title');
  assert.ok(html.includes('My Recent Complaints') || html.includes('मेरी हालिया शिकायतें'), 'Complaints section');
  assert.ok(html.includes('GMC-2026-0099'), 'Rendered complaint code');
});
