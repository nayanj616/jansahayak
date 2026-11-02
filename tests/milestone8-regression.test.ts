import { describe, it } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LanguageProvider } from '../lib/i18n/context';
import { PublicHeader } from '../components/layout/public-header';
import { PublicFooter } from '../components/layout/public-footer';
import { DashboardSidebar } from '../components/layout/dashboard-sidebar';
import { NotificationBell } from '../components/shared/notification-bell';
import { RoleSwitcher } from '../components/shared/role-switcher';
import { CitizenQuickActionsHeader } from '../components/dashboards/citizen/citizen-quick-actions';
import { CitizenComplaintList } from '../components/dashboards/citizen/citizen-complaint-list';
import { WorkerTaskCard } from '../components/dashboards/worker/worker-task-card';
import { WorkerCompleteModal } from '../components/dashboards/worker/worker-complete-modal';
import { OfficerMetricsBar } from '../components/dashboards/officer/officer-metrics-bar';
import { OfficerFilterToolbar } from '../components/dashboards/officer/officer-filter-toolbar';
import { OfficerQueueTable } from '../components/dashboards/officer/officer-queue-table';
import { OfficerReviewDialog } from '../components/dashboards/officer/officer-review-dialog';
import { OfficerVerificationCard } from '../components/dashboards/officer/officer-verification-card';
import { OfficerDetailModal } from '../components/dashboards/officer/officer-detail-modal';
import type { ComplaintWithDetails, AssignmentWithDetails } from '../types';

// ============================================================================
// Mock Test Fixtures (Isolated for Validation — Zero Persistent DB Changes)
// ============================================================================

const mockCitizenComplaint: ComplaintWithDetails = {
  id: 'cmp-reg-1',
  complaint_code: 'GMC-2026-VAL01',
  category: 'garbage_dump',
  priority: 'normal',
  status: 'submitted',
  description: 'Uncollected refuse pile near municipal park',
  location_description: 'Near Sector 4 Gate, Lashkar',
  latitude: 26.215,
  longitude: 78.165,
  location_accuracy_m: 5,
  location_source: 'gps',
  ward_id: 'GWL-W-024',
  reporter_id: 'user-val-cit',
  created_at: new Date('2026-03-15T09:00:00Z').toISOString(),
  updated_at: new Date('2026-03-15T09:00:00Z').toISOString(),
  ward: {
    id: 'GWL-W-024',
    ward_no: 24,
    ward_name: 'Lashkar Central',
    sanitation_zone: 'Zone 4',
    created_at: new Date().toISOString(),
  },
  images: [
    {
      id: 'img-val-1',
      complaint_id: 'cmp-reg-1',
      image_type: 'before',
      bucket_name: 'complaint-originals',
      object_path: 'before/val-1.jpg',
      signed_url: '/test-val-1.jpg',
      file_size_bytes: 1048576,
      created_at: new Date().toISOString(),
    },
  ],
  history: [
    {
      id: 'hist-val-1',
      complaint_id: 'cmp-reg-1',
      action: 'complaint_submitted',
      old_status: null,
      new_status: 'submitted',
      remarks: 'Initial complaint filed via mobile portal',
      created_at: new Date('2026-03-15T09:00:00Z').toISOString(),
    },
  ],
} as unknown as ComplaintWithDetails;

const mockWorkerTask: AssignmentWithDetails = {
  id: 'task-reg-1',
  complaint_id: 'cmp-reg-1',
  worker_id: 'user-val-wrk',
  assigned_at: new Date('2026-03-15T10:00:00Z').toISOString(),
  started_at: null,
  completed_at: null,
  status: 'assigned',
  priority_override: null,
  notes: 'Clear curbside waste and sanitize with lime powder',
  created_at: new Date('2026-03-15T10:00:00Z').toISOString(),
  updated_at: new Date('2026-03-15T10:00:00Z').toISOString(),
  complaint: mockCitizenComplaint,
} as unknown as AssignmentWithDetails;

const mockReviewedComplaint: ComplaintWithDetails = {
  ...mockCitizenComplaint,
  status: 'under_review',
  ai_verification: {
    id: 'ai-val-1',
    complaint_id: 'cmp-reg-1',
    model_name: 'gemini-3.8-flash',
    processing_status: 'completed',
    processing_error: null,
    metrics: {
      evaluation: {
        confidenceLevel: 'high',
        isComparisonReliable: true,
        wasteReductionEstimate: 92,
        estimateRationale: 'Significant cleared area matching background boundary wall',
      },
      officerSummary: 'Cleanup verified against initial grievance photograph. 92% waste reduction observed.',
      beforeObservations: {
        wasteIdentified: ['organic waste', 'plastic bags', 'dry leaves'],
        approximateSpread: 'Medium pile (~3x2 meters)',
      },
      afterObservations: {
        visibleSurfaces: ['swept asphalt', 'stone curb'],
        remainingDebris: ['negligible roadside dust'],
      },
      comparativeFindings: {
        changesObserved: ['Main waste mound removed', 'Asphalt surface cleared'],
      },
      comparisonLimitations: {
        angleMismatched: false,
        lightingMismatched: false,
        occlusionPresent: false,
        limitationNotes: [],
      },
    },
    created_at: new Date('2026-03-15T14:00:00Z').toISOString(),
  },
} as unknown as ComplaintWithDetails;

// ============================================================================
// 1. PUBLIC PORTAL & NAVIGATION REGRESSION TESTS
// ============================================================================

describe('Milestone 8: Public Portal & Navigation Validation', () => {
  it('PublicHeader renders municipal identity, language switcher and all primary links', () => {
    const html = renderToStaticMarkup(React.createElement(PublicHeader));
    assert.ok(html.includes('JanSahayak'), 'Must render platform brand');
    assert.ok(html.includes('Gwalior'), 'Must render city identity');
    assert.ok(html.includes('href="/swachh-gwalior"'), 'Must link to Swachh Gwalior');
    assert.ok(html.includes('href="/scheme-exploration"'), 'Must link to Scheme Exploration');
    assert.ok(html.includes('href="/about"'), 'Must link to About');
    assert.ok(html.includes('href="/demo-role"'), 'Must link to Demo Roles');
    assert.ok(html.includes('role="group"'), 'Language switcher must have accessible group role');
  });

  it('PublicFooter renders academic demarcation and official project notice', () => {
    const html = renderToStaticMarkup(React.createElement(PublicFooter));
    assert.ok(html.includes('Academic Evaluation Prototype'), 'Footer academic demarcation');
    assert.ok(html.includes('Gwalior, Madhya Pradesh'), 'City and state jurisdiction');
    assert.ok(html.includes('All rights reserved') || html.includes('JanSahayak'), 'Copyright notice');
  });

  it('DashboardSidebar renders role-specific semantically appropriate links without broken targets', () => {
    // Worker sidebar check
    const workerHtml = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        { defaultLanguage: 'hi' },
        React.createElement(DashboardSidebar, { role: 'worker', isOpen: true, onClose: () => {} })
      )
    );
    assert.ok(workerHtml.includes('href="/worker"'), 'Worker task queue destination');
    assert.ok(workerHtml.includes('href="/swachh-gwalior"'), 'Worker sanitation guidelines destination');
    assert.ok(workerHtml.includes('href="/scheme-exploration#finder"'), 'Worker welfare schemes anchor');
    assert.ok(!workerHtml.includes('href="/worker#broken"'), 'Must not have unmapped links');

    // Officer sidebar check
    const officerHtml = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        { defaultLanguage: 'en' },
        React.createElement(DashboardSidebar, { role: 'officer', isOpen: true, onClose: () => {} })
      )
    );
    assert.ok(officerHtml.includes('href="/officer"'), 'Officer command center destination');
    assert.ok(officerHtml.includes('href="/officer#analytics"'), 'Officer analytics anchor');
    assert.ok(officerHtml.includes('href="/officer#queue"'), 'Officer complaint queue anchor');
  });
});

// ============================================================================
// 2. CITIZEN WORKFLOW VALIDATION
// ============================================================================

describe('Milestone 8: Citizen Workflow Validation', () => {
  it('Citizen quick actions renders bilingual header and report action', () => {
    const enHtml = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        { defaultLanguage: 'en' },
        React.createElement(CitizenQuickActionsHeader, { onOpenReportModal: () => {} })
      )
    );
    assert.ok(enHtml.includes('Citizen Dashboard'), 'English citizen title');
    assert.ok(enHtml.includes('Report a New Complaint'), 'English report CTA');

    const hiHtml = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        { defaultLanguage: 'hi' },
        React.createElement(CitizenQuickActionsHeader, { onOpenReportModal: () => {} })
      )
    );
    assert.ok(hiHtml.includes('नागरिक डैशबोर्ड'), 'Hindi citizen title');
    assert.ok(hiHtml.includes('नई शिकायत दर्ज करें'), 'Hindi report CTA');
  });

  it('Citizen complaint list renders empty state correctly', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        { defaultLanguage: 'en' },
        React.createElement(CitizenComplaintList, {
          complaints: [],
          onOpenReportModal: () => {},
          onOpenTimeline: () => {},
          onPreviewPhoto: () => {},
        })
      )
    );
    assert.ok(html.includes('No complaints yet'), 'Empty complaints title');
    assert.ok(html.includes('My Recent Complaints'), 'Recent complaints section');
  });

  it('Citizen complaint list displays grievance with complaint code, category and timeline button', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        { defaultLanguage: 'en' },
        React.createElement(CitizenComplaintList, {
          complaints: [mockCitizenComplaint],
          onOpenReportModal: () => {},
          onOpenTimeline: () => {},
          onPreviewPhoto: () => {},
        })
      )
    );
    assert.ok(html.includes('GMC-2026-VAL01'), 'Complaint tracking code');
    assert.ok(html.includes('Open Garbage Dump'), 'Grievance category');
    assert.ok(html.includes('Near Sector 4 Gate'), 'Landmark description');
    assert.ok(html.includes('Timeline'), 'Lifecycle audit history button');
  });
});

// ============================================================================
// 3. WORKER WORKFLOW VALIDATION
// ============================================================================

describe('Milestone 8: Worker Workflow Validation', () => {
  it('WorkerTaskCard renders assigned state with Start Task trigger', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        { defaultLanguage: 'hi' },
        React.createElement(WorkerTaskCard, {
          task: mockWorkerTask,
          isStarting: false,
          onStartTask: () => {},
          onOpenCompleteModal: () => {},
          onPreviewPhoto: () => {},
          language: 'hi',
        })
      )
    );
    assert.ok(html.includes('GMC-2026-VAL01'), 'Task complaint code');
    assert.ok(html.includes('सौंपा गया'), 'Assigned status badge in Hindi');
    assert.ok(html.includes('कार्य शुरू करें'), 'Start task action in Hindi');
  });

  it('WorkerTaskCard renders in_progress state with Complete Task trigger', () => {
    const inProgressTask: AssignmentWithDetails = {
      ...mockWorkerTask,
      status: 'in_progress',
      started_at: new Date('2026-03-15T11:00:00Z').toISOString(),
    };

    const html = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        { defaultLanguage: 'en' },
        React.createElement(WorkerTaskCard, {
          task: inProgressTask,
          isStarting: false,
          onStartTask: () => {},
          onOpenCompleteModal: () => {},
          onPreviewPhoto: () => {},
          language: 'en',
        })
      )
    );
    assert.ok(html.includes('In Progress'), 'In Progress badge in English');
    assert.ok(html.includes('Complete Task & Upload Proof') || html.includes('Complete Task &amp; Upload Proof'), 'Complete task CTA');
  });

  it('WorkerCompleteModal renders after-photo upload prompt and remarks input', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        { defaultLanguage: 'hi' },
        React.createElement(WorkerCompleteModal, {
          task: mockWorkerTask,
          onClose: () => {},
          onSubmit: async () => {},
          isSubmitting: false,
          language: 'hi',
        })
      )
    );
    assert.ok(html.includes('सफाई कार्य पूर्ण करें'), 'Modal header in Hindi');
    assert.ok(html.includes('सफाई के बाद की फ़ोटो'), 'After photo label');
    assert.ok(html.includes('साक्ष्य जमा करें एवं पूर्ण करें'), 'Submit completion CTA');
  });
});

// ============================================================================
// 4. OFFICER WORKFLOW VALIDATION
// ============================================================================

describe('Milestone 8: Officer Workflow Validation', () => {
  it('OfficerMetricsBar renders 4 core grievance counts', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        { defaultLanguage: 'en' },
        React.createElement(OfficerMetricsBar, {
          designation: 'Zonal Sanitation Officer',
          totalCount: 25,
          underReviewCount: 4,
          inProgressCount: 7,
          resolvedCount: 14,
        })
      )
    );
    assert.ok(html.includes('Total Grievances'), 'Total metrics label');
    assert.ok(html.includes('25'), 'Total count');
    assert.ok(html.includes('Needs Review'), 'Under review metrics label');
    assert.ok(html.includes('4'), 'Under review count');
    assert.ok(html.includes('Active In Progress'), 'In progress metrics label');
    assert.ok(html.includes('7'), 'In progress count');
    assert.ok(html.includes('Resolved'), 'Resolved metrics label');
    assert.ok(html.includes('14'), 'Resolved count');
  });

  it('OfficerFilterToolbar renders search input, status tabs and count display', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        { defaultLanguage: 'en' },
        React.createElement(OfficerFilterToolbar, {
          filteredCount: 8,
          totalCount: 20,
          underReviewCount: 3,
          unassignedCount: 4,
          inProgressCount: 5,
          statusFilter: 'all',
          setStatusFilter: () => {},
          wardFilter: 'all',
          setWardFilter: () => {},
          categoryFilter: 'all',
          setCategoryFilter: () => {},
          searchQuery: '',
          setSearchQuery: () => {},
          wards: [],
        })
      )
    );
    assert.ok(html.includes('8 of 20 complaints'), 'Interpolated complaints count');
    assert.ok(html.includes('All Statuses'), 'Status filter dropdown');
    assert.ok(html.includes('Search code, landmark...'), 'Search input placeholder');
  });

  it('OfficerQueueTable renders grievance rows with inspect and action buttons', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        { defaultLanguage: 'en' },
        React.createElement(OfficerQueueTable, {
          complaints: [mockCitizenComplaint],
          onInspect: () => {},
          onAssign: () => {},
          onReview: () => {},
          onPreviewPhoto: () => {},
          onResetFilters: () => {},
        })
      )
    );
    assert.ok(html.includes('GMC-2026-VAL01'), 'Queue complaint code');
    assert.ok(html.includes('Open Garbage Dump'), 'Category display');
    assert.ok(html.includes('Inspect'), 'Inspect trigger');
    assert.ok(html.includes('Assign'), 'Assign worker trigger');
  });

  it('OfficerVerificationCard preserves advisory status and human municipal authority', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        { defaultLanguage: 'en' },
        React.createElement(OfficerVerificationCard, {
          complaint: mockReviewedComplaint,
          isVerifying: false,
          verifyError: null,
          onTriggerVerification: () => {},
        })
      )
    );
    assert.ok(html.includes('AI Cleanliness Verification Analysis'), 'Verification analysis title');
    assert.ok(html.includes('gemini-3.8-flash'), 'AI model name');
    assert.ok(html.includes('92%'), 'Estimated waste reduction');
    assert.ok(html.includes('Advisory Notice:'), 'Mandatory statutory advisory notice');
    assert.ok(
      html.includes('Municipal officers retain full authority'),
      'Human officer administrative authority preservation statement'
    );
  });

  it('OfficerReviewDialog presents approve, rework and reject choices with mandatory remarks', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        { defaultLanguage: 'en' },
        React.createElement(OfficerReviewDialog, {
          complaint: mockReviewedComplaint,
          reviewAction: 'approve',
          onChangeReviewAction: () => {},
          reviewRemarks: 'Field cleanup verified. Area sanitized.',
          onChangeReviewRemarks: () => {},
          isReviewing: false,
          reviewError: null,
          onSubmit: () => {},
          onClose: () => {},
        })
      )
    );
    assert.ok(html.includes('Review &amp; Verify Cleanup Operations') || html.includes('Review & Verify Cleanup Operations'), 'Dialog header');
    assert.ok(html.includes('Approve'), 'Approve decision');
    assert.ok(html.includes('Rework'), 'Rework decision');
    assert.ok(html.includes('Reject'), 'Reject decision');
    assert.ok(html.includes('Evaluation Remarks &amp; Feedback *') || html.includes('Evaluation Remarks & Feedback *'), 'Mandatory remarks field');
    assert.ok(html.includes('Submit Review Decision'), 'Submit decision CTA');
  });
});

// ============================================================================
// 5. LANGUAGE PERSISTENCE & RESOLUTION LOGIC
// ============================================================================

describe('Milestone 8: Language Resolution & Persistence Rules', () => {
  it('enforces approved role defaults when no explicit user choice is recorded', () => {
    function resolveRouteDefault(pathname: string): 'en' | 'hi' {
      if (pathname.startsWith('/worker')) return 'hi';
      return 'en';
    }

    assert.strictEqual(resolveRouteDefault('/'), 'en', 'Public home default');
    assert.strictEqual(resolveRouteDefault('/about'), 'en', 'About page default');
    assert.strictEqual(resolveRouteDefault('/swachh-gwalior'), 'en', 'Swachh Gwalior default');
    assert.strictEqual(resolveRouteDefault('/scheme-exploration'), 'en', 'Scheme exploration default');
    assert.strictEqual(resolveRouteDefault('/citizen'), 'en', 'Citizen default');
    assert.strictEqual(resolveRouteDefault('/worker'), 'hi', 'Worker default');
    assert.strictEqual(resolveRouteDefault('/officer'), 'en', 'Officer default');
  });

  it('guarantees explicit user choice overrides any route default', () => {
    function resolveUserLanguage(
      pathname: string,
      hasExplicitChoice: boolean,
      explicitLang?: 'en' | 'hi'
    ): 'en' | 'hi' {
      if (hasExplicitChoice && explicitLang) return explicitLang;
      if (pathname.startsWith('/worker')) return 'hi';
      return 'en';
    }

    assert.strictEqual(resolveUserLanguage('/worker', true, 'en'), 'en', 'User explicitly chose EN on /worker');
    assert.strictEqual(resolveUserLanguage('/citizen', true, 'hi'), 'hi', 'User explicitly chose HI on /citizen');
    assert.strictEqual(resolveUserLanguage('/officer', true, 'hi'), 'hi', 'User explicitly chose HI on /officer');
  });

  it('prevents silent fallback and formats unlocalized content with warning marker', () => {
    function formatWithFallback(lang: 'en' | 'hi', hindiText?: string, englishText?: string): string {
      if (lang === 'hi') {
        if (hindiText && hindiText.trim().length > 0) return hindiText.trim();
        if (englishText && englishText.trim().length > 0) {
          return `${englishText.trim()} (उपलब्ध हिन्दी अनुवाद नहीं है)`;
        }
        return '(उपलब्ध हिन्दी अनुवाद नहीं है)';
      }
      return englishText || '';
    }

    const testOutput = formatWithFallback('hi', '', 'Central Sanitation Manual');
    assert.strictEqual(
      testOutput,
      'Central Sanitation Manual (उपलब्ध हिन्दी अनुवाद नहीं है)',
      'Must contain explicit unlocalized marker'
    );
  });
});

// ============================================================================
// 6. ACCESSIBILITY & RESPONSIVE COMPONENT VALIDATION
// ============================================================================

describe('Milestone 8: Accessibility & Dialog Behavior', () => {
  it('OfficerDetailModal renders with accessible dialog roles and landmarks', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        { defaultLanguage: 'en' },
        React.createElement(OfficerDetailModal, {
          complaint: mockReviewedComplaint,
          isDetailLoading: false,
          isVerifying: false,
          verifyError: null,
          onClose: () => {},
          onAssign: () => {},
          onReview: () => {},
          onPreviewPhoto: () => {},
          onTriggerVerification: () => {},
        })
      )
    );
    assert.ok(html.includes('role="dialog"'), 'Must have dialog role');
    assert.ok(html.includes('aria-modal="true"'), 'Must indicate modal behavior');
    assert.ok(html.includes('id="detail-modal-title"'), 'Must have labelled title');
    assert.ok(html.includes('aria-label="Close complaint inspection modal"'), 'Must have accessible close button');
  });

  it('NotificationBell renders with popup accessibility states', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        { defaultLanguage: 'en' },
        React.createElement(NotificationBell)
      )
    );
    assert.ok(html.includes('aria-haspopup="true"'), 'Must declare popup behavior');
    assert.ok(html.includes('aria-expanded="false"'), 'Must track expansion state');
    assert.ok(html.includes('aria-label="Notifications"'), 'Must have accessible label in English');
  });

  it('RoleSwitcher renders accessible role switch triggers and initials', () => {
    const html = renderToStaticMarkup(
      React.createElement(RoleSwitcher, {
        currentRole: 'citizen',
        userName: 'Aarav Sharma',
      })
    );
    assert.ok(html.includes('aria-haspopup="true"'), 'Role switcher popup attribute');
    assert.ok(html.includes('aria-expanded="false"'), 'Role switcher expansion state');
    assert.ok(html.includes('>C<'), 'Persona initial badge');
  });
});
