import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ComplaintTrackingView } from '../components/complaints/complaint-tracking-view';
import { LanguageProvider } from '../lib/i18n/context';
import type { ComplaintWithDetails } from '../types';

const mockComplaintFixture = ({
  id: 'c1111111-1111-4000-8000-111111111111',
  complaint_code: 'GWL-2026-9999',
  category: 'overflowing_bin',
  status: 'under_review',
  priority: 'high',
  description: 'Overflowing community bin near Morar market gate.',
  location_description: 'Near Morar Subzi Mandi main gate',
  reporter_id: 'citizen-001',
  ward_id: 'ward-01',
  latitude: 26.2235,
  longitude: 78.1792,
  location_accuracy_m: 10,
  location_source: 'gps',
  created_at: '2026-11-01T10:00:00Z',
  updated_at: '2026-11-01T12:00:00Z',
  ward: {
    id: 'w-01',
    ward_id: 'ward-01',
    ward_no: 1,
    ward_name: 'Morar Central',
    zone_no: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  reporter: {
    id: 'citizen-001',
    display_name: 'Aarav Sharma',
    role: 'citizen',
    ward_id: 'ward-01',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  current_or_latest_assignment: {
    id: 'asg-01',
    complaint_id: 'c1111111-1111-4000-8000-111111111111',
    worker_id: 'worker-001',
    assigned_by: 'officer-001',
    status: 'completed',
    notes: 'Clear the bin and sanitize perimeter.',
    assigned_at: '2026-11-01T10:30:00Z',
    started_at: '2026-11-01T11:00:00Z',
    completed_at: '2026-11-01T11:45:00Z',
    cancelled_at: null,
    created_at: '2026-11-01T10:30:00Z',
    updated_at: '2026-11-01T11:45:00Z',
    worker: {
      id: 'worker-001',
      display_name: 'Rajesh Kumar',
      role: 'worker',
      ward_id: 'ward-01',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  },
  images: [
    {
      id: 'img-before-01',
      complaint_id: 'c1111111-1111-4000-8000-111111111111',
      image_type: 'before',
      bucket_name: 'complaint-originals',
      object_path: 'c1111111-1111-4000-8000-111111111111/before.jpg',
      content_type: 'image/jpeg',
      file_size_bytes: 204800,
      uploaded_by: 'citizen-001',
      created_at: '2026-11-01T10:00:00Z',
      signed_url: '/test-before.jpg',
    },
    {
      id: 'img-after-01',
      complaint_id: 'c1111111-1111-4000-8000-111111111111',
      image_type: 'after',
      bucket_name: 'cleanup-evidence',
      object_path: 'c1111111-1111-4000-8000-111111111111/after.jpg',
      content_type: 'image/jpeg',
      file_size_bytes: 215000,
      uploaded_by: 'worker-001',
      created_at: '2026-11-01T11:45:00Z',
      signed_url: '/test-after.jpg',
    },
  ],
  ai_verification: {
    id: 'verif-01',
    complaint_id: 'c1111111-1111-4000-8000-111111111111',
    before_image_id: 'img-before-01',
    after_image_id: 'img-after-01',
    model_name: 'gemini-2.5-flash',
    model_version: '2026-03-preview',
    processing_status: 'completed',
    processing_error: null,
    waste_reduction_percentage: 95,
    metrics: {
      beforeObservations: {
        wasteIdentified: ['Overflowing municipal plastic bin', 'scattered vegetable leaves'],
        approximateSpread: '2 meters surrounding bin',
        obstructionsOrHazards: ['Pedestrian path partially blocked'],
      },
      afterObservations: {
        visibleSurfaces: ['Swept pavement', 'Empty bin with closed lid'],
        remainingDebris: [],
        cleanlinessApparent: true,
      },
      comparativeFindings: {
        primaryWasteRemoved: true,
        siteConsistent: true,
        changesObserved: ['Bin has been emptied and swept around perimeter.'],
      },
      comparisonLimitations: {
        angleMismatched: false,
        lightingMismatched: false,
        occlusionPresent: false,
        limitationNotes: [],
      },
      evaluation: {
        confidenceLevel: 'high',
        isComparisonReliable: true,
        wasteReductionEstimate: 95,
        estimateRationale: 'Total clearing of surrounding refuse and emptied bin.',
      },
      officerSummary: 'Visual analysis indicates comprehensive cleanup. Bin emptied and paved area swept clean.',
      disclaimer: 'Advisory notice: JanSahayak demonstration verification.',
    },
    created_at: '2026-11-01T11:50:00Z',
  },
  history: [
    {
      id: 'h-01',
      complaint_id: 'c1111111-1111-4000-8000-111111111111',
      actor_id: 'citizen-001',
      old_status: null,
      new_status: 'submitted',
      action: 'submitted',
      remarks: 'Initial grievance submission by citizen.',
      created_at: '2026-11-01T10:00:00Z',
    },
    {
      id: 'h-02',
      complaint_id: 'c1111111-1111-4000-8000-111111111111',
      actor_id: 'officer-001',
      old_status: 'submitted',
      new_status: 'assigned',
      action: 'assigned',
      remarks: 'Dispatched to sanitation worker Rajesh Kumar.',
      created_at: '2026-11-01T10:30:00Z',
    },
  ],
} as unknown) as ComplaintWithDetails;

test('Complaint Tracking View: renders grievance code, status, and photographic evidence in English', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      LanguageProvider,
      { defaultLanguage: 'en' },
      React.createElement(ComplaintTrackingView, {
        complaint: mockComplaintFixture,
        currentRole: 'officer',
      })
    )
  );

  // Must render complaint code and key info
  assert.ok(html.includes('GWL-2026-9999'), 'Must render complaint code');
  assert.ok(html.includes('Morar Central'), 'Must render ward name');
  assert.ok(html.includes('Rajesh Kumar'), 'Must render assigned worker name');

  // Must render Gemini Vision verified metrics
  assert.ok(html.includes('gemini-2.5-flash'), 'Must render model name');
  assert.ok(html.includes('95%'), 'Must render waste reduction percentage');
  assert.ok(html.includes('high'), 'Must render high confidence level');

  // Must render Advisory Notice emphasizing human authority
  assert.ok(html.includes('Advisory Notice:'), 'Must include advisory notice');
  assert.ok(html.includes('Municipal officers retain sole authority'), 'Must emphasize officer authority');

  // Regression check: NO raw translation keys
  assert.ok(!html.includes('common.filter'), 'Must not render raw common.filter key');
  assert.ok(!html.includes('complaints.statuses.completed'), 'Must not render raw complaints.statuses.completed key');
});

test('Complaint Tracking View: renders bilingual Devanagari in Hindi without raw keys', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      LanguageProvider,
      { defaultLanguage: 'hi' },
      React.createElement(ComplaintTrackingView, {
        complaint: mockComplaintFixture,
        currentRole: 'citizen',
      })
    )
  );

  // Must render Devanagari headings
  assert.ok(html.includes('GWL-2026-9999'), 'Must render complaint code');
  assert.ok(html.includes('समीक्षाधीन'), 'Must render Hindi status for under_review');
  assert.ok(html.includes('सफ़ाई दल'), 'Must render Hindi sanitation team header');
  assert.ok(html.includes('जेमिनी विज़न एआई सत्यापन'), 'Must render Hindi AI verification header');
  assert.ok(html.includes('सलाहकारी सूचना:'), 'Must render Hindi advisory notice');

  // Regression check: NO raw translation keys
  assert.ok(!html.includes('common.filter'), 'Must not render raw common.filter in Hindi');
  assert.ok(!html.includes('common.refresh'), 'Must not render raw common.refresh in Hindi');
  assert.ok(!html.includes('complaints.statuses.completed'), 'Must not render raw complaints.statuses.completed in Hindi');
});

test('Complaint Tracking View: handles unverified complaint without fabricating AI results', () => {
  const unverifiedComplaint: ComplaintWithDetails = {
    ...mockComplaintFixture,
    status: 'submitted',
    ai_verification: null,
  };

  const html = renderToStaticMarkup(
    React.createElement(
      LanguageProvider,
      { defaultLanguage: 'en' },
      React.createElement(ComplaintTrackingView, {
        complaint: unverifiedComplaint,
        currentRole: 'citizen',
      })
    )
  );

  // Must clearly indicate verification is not yet triggered
  assert.ok(html.includes('Visual Analysis Not Yet Triggered'), 'Must show not yet triggered banner');
  assert.ok(!html.includes('95%'), 'Must not fabricate 95% reduction');
});
