import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { PublicHeader } from '../components/layout/public-header';
import { PublicFooter } from '../components/layout/public-footer';
import { LanguageSwitcher } from '../components/shared/language-switcher';
import { DashboardHeader } from '../components/layout/dashboard-header';
import { DashboardSidebar } from '../components/layout/dashboard-sidebar';
import { DashboardShell } from '../components/layout/dashboard-shell';
import { RoleSwitcher } from '../components/shared/role-switcher';
import { NotificationBell } from '../components/shared/notification-bell';
import { LanguageProvider } from '../lib/i18n';

// Helper to wrap components with LanguageProvider
function renderWithLanguage(ui: React.ReactElement): string {
  return renderToStaticMarkup(
    React.createElement(LanguageProvider, null, ui)
  );
}

// ============================================================================
// 1. PUBLIC HEADER TESTS
// ============================================================================

test('PublicHeader: renders municipal branding and all core public routes', () => {
  const html = renderWithLanguage(React.createElement(PublicHeader));

  // Branding
  assert.ok(html.includes('JanSahayak'), 'Must render JanSahayak brand');
  assert.ok(html.includes('Gwalior, Madhya Pradesh'), 'Must render Gwalior MP jurisdiction');

  // Core public routes
  assert.ok(html.includes('href="/"'), 'Must link to Home');
  assert.ok(html.includes('href="/swachh-gwalior"'), 'Must link to Swachh Gwalior');
  assert.ok(html.includes('href="/scheme-exploration"'), 'Must link to Scheme Exploration');
  assert.ok(html.includes('href="/about"'), 'Must link to About');
  assert.ok(html.includes('href="/demo-role"'), 'Must link to Demo Roles hub');

  // Mobile menu toggle
  assert.ok(
    html.includes('aria-label="Toggle navigation menu"'),
    'Must include accessible mobile menu toggle button'
  );
});

// ============================================================================
// 2. PUBLIC FOOTER TESTS
// ============================================================================

test('PublicFooter: renders academic notice, core links, and demo portals', () => {
  const html = renderToStaticMarkup(React.createElement(PublicFooter));

  // Academic Demonstration Notice
  assert.ok(
    html.includes('Academic Demonstration Notice:'),
    'Must explicitly state academic demonstration notice'
  );
  assert.ok(
    html.includes('not an official portal of Gwalior Municipal Corporation'),
    'Must explicitly disclaim official endorsement'
  );

  // Core navigation links
  assert.ok(html.includes('href="/swachh-gwalior"'));
  assert.ok(html.includes('href="/scheme-exploration"'));
  assert.ok(html.includes('href="/demo-role"'));
  assert.ok(html.includes('href="/about"'));

  // Operational portal links
  assert.ok(html.includes('href="/citizen"'));
  assert.ok(html.includes('href="/worker"'));
  assert.ok(html.includes('href="/officer"'));
});

// ============================================================================
// 3. LANGUAGE SWITCHER TESTS
// ============================================================================

test('LanguageSwitcher: renders accessible group with EN and Devanagari options', () => {
  const html = renderWithLanguage(React.createElement(LanguageSwitcher));

  assert.ok(html.includes('role="group"'), 'Must have role="group"');
  assert.ok(
    html.includes('aria-label="Language selector / भाषा चयन"'),
    'Must include bilingual aria-label'
  );
  assert.ok(html.includes('EN'), 'Must include English option');
  assert.ok(html.includes('हिन्दी'), 'Must include Devanagari Hindi option');
  assert.ok(html.includes('aria-pressed="true"'), 'Active language must have aria-pressed="true"');
});

// ============================================================================
// 4. DASHBOARD SIDEBAR TESTS — VERIFYING ZERO BROKEN LINKS
// ============================================================================

test('DashboardSidebar: Citizen navigation items point only to functional destinations', () => {
  const html = renderWithLanguage(
    React.createElement(DashboardSidebar, {
      role: 'citizen',
      isOpen: true,
      onClose: () => {},
    })
  );

  assert.ok(html.includes('Citizen Portal'), 'Role badge for citizen');
  assert.ok(html.includes('href="/citizen"'), 'Must link to citizen dashboard');
  assert.ok(html.includes('href="/swachh-gwalior"'), 'Must link to swachh-gwalior');
  assert.ok(html.includes('href="/scheme-exploration#finder"'), 'Must link to scheme finder tab');
  assert.ok(html.includes('href="/scheme-exploration#assistant"'), 'Must link to AI assistant tab');
  assert.ok(html.includes('href="/scheme-exploration#grievances"'), 'Must link to grievances tab');
  assert.ok(html.includes('href="/scheme-exploration#services"'), 'Must link to civic services tab');

  // Verify broken anchors are NOT present
  assert.ok(!html.includes('href="/citizen#report"'), 'Must NOT have broken #report anchor');
  assert.ok(!html.includes('href="/citizen#complaints"'), 'Must NOT have unanchored #complaints');
});

test('DashboardSidebar: Worker navigation items point only to functional destinations', () => {
  const html = renderWithLanguage(
    React.createElement(DashboardSidebar, {
      role: 'worker',
      isOpen: false,
      onClose: () => {},
    })
  );

  assert.ok(html.includes('Field Worker Portal'), 'Role badge for worker');
  assert.ok(html.includes('href="/worker"'), 'Must link to worker dashboard');
  assert.ok(html.includes('href="/swachh-gwalior"'), 'Must link to field guidelines');
  assert.ok(html.includes('href="/scheme-exploration#finder"'), 'Must link to worker welfare schemes');
  assert.ok(html.includes('href="/scheme-exploration#assistant"'), 'Must link to AI assistant');

  // Verify broken anchors are NOT present
  assert.ok(!html.includes('href="/worker#assignments"'), 'Must NOT have broken #assignments anchor');
  assert.ok(!html.includes('href="/worker#status"'), 'Must NOT have broken #status anchor');
  assert.ok(!html.includes('href="/worker#photos"'), 'Must NOT have broken #photos anchor');
  assert.ok(!html.includes('href="/worker#profile"'), 'Must NOT have broken #profile anchor');
});

test('DashboardSidebar: Officer navigation items point only to functional destinations', () => {
  const html = renderWithLanguage(
    React.createElement(DashboardSidebar, {
      role: 'officer',
      isOpen: true,
      onClose: () => {},
    })
  );

  assert.ok(html.includes('Officer Command'), 'Role badge for officer');
  assert.ok(html.includes('href="/officer"'), 'Must link to officer dashboard');
  assert.ok(html.includes('href="/officer#analytics"'), 'Must link to officer analytics chart');
  assert.ok(html.includes('href="/officer#queue"'), 'Must link to officer complaint queue');
  assert.ok(html.includes('href="/scheme-exploration"'), 'Must link to scheme directory');
  assert.ok(html.includes('href="/swachh-gwalior"'), 'Must link to sanitation guidelines');
  assert.ok(html.includes('href="/about"'), 'Must link to platform architecture');

  // Verify broken anchors are NOT present
  assert.ok(!html.includes('href="/officer#complaints"'), 'Must NOT have broken #complaints');
  assert.ok(!html.includes('href="/officer#assignments"'), 'Must NOT have broken #assignments');
  assert.ok(!html.includes('href="/officer#ai-verification"'), 'Must NOT have broken #ai-verification');
  assert.ok(!html.includes('href="/officer#ward-view"'), 'Must NOT have broken #ward-view');
});

// ============================================================================
// 5. DASHBOARD HEADER & ROLE SWITCHER TESTS
// ============================================================================

test('DashboardHeader: renders role greeting and mobile-visible language switcher', () => {
  const html = renderWithLanguage(
    React.createElement(DashboardHeader, {
      role: 'citizen',
      userName: 'Aarav Sharma',
      onOpenSidebar: () => {},
    })
  );

  assert.ok(html.includes('Welcome, Citizen') || html.includes('Dashboard'), 'Renders greeting');
  assert.ok(html.includes('aria-label="Open sidebar navigation"'), 'Renders mobile sidebar button');
  // Language switcher is rendered in both desktop and mobile containers
  assert.ok(html.includes('role="group"'), 'Language switcher must be present in header');
  assert.ok(html.includes('aria-label="Language selector / भाषा चयन"'));
  // Notification bell is present in header
  assert.ok(html.includes('aria-label="Notifications"'), 'Notification bell must be present in header');
});

test('NotificationBell: renders accessible trigger button in isolation', () => {
  const html = renderToStaticMarkup(React.createElement(NotificationBell));
  assert.ok(html.includes('aria-label="Notifications"'), 'Must have aria-label="Notifications"');
  assert.ok(html.includes('aria-haspopup="true"'), 'Must have aria-haspopup="true"');
  assert.ok(html.includes('aria-expanded="false"'), 'Must have aria-expanded="false"');
});

test('RoleSwitcher: renders accessible trigger and persona initial', () => {
  const html = renderToStaticMarkup(
    React.createElement(RoleSwitcher, {
      currentRole: 'officer',
      userName: 'Dr. R. K. Verma',
    })
  );

  assert.ok(html.includes('aria-haspopup="true"'), 'Must have aria-haspopup="true"');
  assert.ok(html.includes('aria-expanded="false"'), 'Initial state aria-expanded="false"');
  assert.ok(html.includes('Municipal Officer'), 'Renders current role label');
  assert.ok(html.includes('>O<'), 'Renders Officer initial avatar');
});

// ============================================================================
// 6. DASHBOARD SHELL INTEGRATION TEST
// ============================================================================

test('DashboardShell: renders complete shell with disclosure banner and main container', () => {
  const html = renderWithLanguage(
    React.createElement(
      DashboardShell,
      { role: 'worker', userName: 'Ramesh Kumar' },
      React.createElement('div', { id: 'test-content' }, 'Active Worker Tasks')
    )
  );

  assert.ok(html.includes('id="main-content"'), 'Must include main-content landmark');
  assert.ok(html.includes('Demonstration Mode'), 'Must include demo mode disclosure banner');
  assert.ok(html.includes('Active Worker Tasks'), 'Must render dashboard child view');
});
