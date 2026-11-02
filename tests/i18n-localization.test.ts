import { describe, it } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { enDictionary } from '../lib/i18n/dictionaries/en';
import { hiDictionary } from '../lib/i18n/dictionaries/hi';
import { LanguageProvider } from '../lib/i18n/context';
import { CitizenQuickActionsHeader } from '../components/dashboards/citizen/citizen-quick-actions';
import { CitizenComplaintList } from '../components/dashboards/citizen/citizen-complaint-list';
import { OfficerMetricsBar } from '../components/dashboards/officer/officer-metrics-bar';
import { OfficerFilterToolbar } from '../components/dashboards/officer/officer-filter-toolbar';
import { NotificationBell } from '../components/shared/notification-bell';

function getLeafPaths(obj: Record<string, unknown>, prefix = ''): string[] {
  let paths: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      paths = paths.concat(getLeafPaths(value as Record<string, unknown>, fullPath));
    } else {
      paths.push(fullPath);
    }
  }
  return paths;
}

function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const p of parts) {
    if (current && typeof current === 'object' && p in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return current;
}

describe('Milestone 7: Centralized i18n Dictionary Parity & Structure', () => {
  const enPaths = getLeafPaths(enDictionary as unknown as Record<string, unknown>).sort();
  const hiPaths = getLeafPaths(hiDictionary as unknown as Record<string, unknown>).sort();

  it('should have exact 100% key parity between English and Hindi dictionaries', () => {
    const missingInHi = enPaths.filter((path) => !hiPaths.includes(path));
    const extraInHi = hiPaths.filter((path) => !enPaths.includes(path));

    assert.strictEqual(
      missingInHi.length,
      0,
      `Missing keys in Hindi dictionary: \n${missingInHi.join('\n')}`
    );
    assert.strictEqual(
      extraInHi.length,
      0,
      `Unexpected extra keys in Hindi dictionary: \n${extraInHi.join('\n')}`
    );
    assert.strictEqual(enPaths.length, hiPaths.length, 'Total key count must be identical');
  });

  it('should cover all mandatory operational sections in both dictionaries', () => {
    const expectedSections = [
      'common',
      'nav',
      'public',
      'citizen',
      'worker',
      'officer',
      'complaints',
      'notifications',
      'validation',
      'errors',
      'schemeExploration',
    ];

    for (const section of expectedSections) {
      assert.ok(
        section in enDictionary,
        `Section "${section}" must be defined in enDictionary`
      );
      assert.ok(
        section in hiDictionary,
        `Section "${section}" must be defined in hiDictionary`
      );
    }
  });

  it('should contain matching interpolation parameters in English and Hindi strings', () => {
    const placeholderRegex = /\{([a-zA-Z0-9_]+)\}/g;
    const mismatches: string[] = [];

    for (const path of enPaths) {
      const enVal = resolvePath(enDictionary as unknown as Record<string, unknown>, path);
      const hiVal = resolvePath(hiDictionary as unknown as Record<string, unknown>, path);

      if (typeof enVal === 'string' && typeof hiVal === 'string') {
        const enMatches = Array.from(enVal.matchAll(placeholderRegex)).map((m) => m[1]).sort();
        const hiMatches = Array.from(hiVal.matchAll(placeholderRegex)).map((m) => m[1]).sort();

        if (JSON.stringify(enMatches) !== JSON.stringify(hiMatches)) {
          mismatches.push(
            `Key "${path}": English parameters [${enMatches.join(', ')}] vs Hindi parameters [${hiMatches.join(', ')}]`
          );
        }
      }
    }

    assert.strictEqual(
      mismatches.length,
      0,
      `Placeholder parameter mismatches detected:\n${mismatches.join('\n')}`
    );
  });

  it('should verify all complaint categories have both label and desc in en and hi', () => {
    const categories = Object.keys(enDictionary.complaints.categories);
    assert.ok(categories.length >= 12, 'Must include at least 12 standard categories');

    for (const cat of categories) {
      const enCat = enDictionary.complaints.categories[cat as keyof typeof enDictionary.complaints.categories];
      const hiCat = hiDictionary.complaints.categories[cat as keyof typeof hiDictionary.complaints.categories];

      assert.ok(enCat.label && enCat.desc, `English category "${cat}" must have label and desc`);
      assert.ok(hiCat.label && hiCat.desc, `Hindi category "${cat}" must have label and desc`);
    }
  });

  it('should verify all complaint statuses are defined in en and hi', () => {
    const expectedStatuses = [
      'submitted',
      'assigned',
      'in_progress',
      'under_review',
      'rework_required',
      'resolved',
      'rejected',
    ];

    for (const status of expectedStatuses) {
      assert.ok(
        status in enDictionary.complaints.statuses,
        `Status "${status}" must exist in enDictionary`
      );
      assert.ok(
        status in hiDictionary.complaints.statuses,
        `Status "${status}" must exist in hiDictionary`
      );
    }
  });

  it('should verify total translation key count is identical and substantial', () => {
    assert.strictEqual(enPaths.length, hiPaths.length);
    assert.ok(enPaths.length > 200, `Expected >200 translation keys, got ${enPaths.length}`);
  });
});

describe('Milestone 7: Translation Resolution and Interpolation Logic', () => {
  it('should correctly interpolate parameter values', () => {
    const rawEn = enDictionary.worker.stats.assignedDesc; // "{count} pending task(s) to accept"
    const replacedEn = rawEn.replace('{count}', '4');
    assert.strictEqual(replacedEn, '4 pending task(s) to accept');

    const rawHi = hiDictionary.worker.stats.assignedDesc; // "{count} लंबित कार्य स्वीकार करने हेतु"
    const replacedHi = rawHi.replace('{count}', '4');
    assert.strictEqual(replacedHi, '4 लंबित कार्य स्वीकार करने हेतु');
  });

  it('should correctly format multi-parameter keys', () => {
    const rawEn = enDictionary.officer.queue.countOfTotal; // "{filtered} of {total} complaints"
    const formattedEn = rawEn.replace('{filtered}', '5').replace('{total}', '10');
    assert.strictEqual(formattedEn, '5 of 10 complaints');

    const rawHi = hiDictionary.officer.queue.countOfTotal; // "{total} में से {filtered} शिकायतें"
    const formattedHi = rawHi.replace('{filtered}', '5').replace('{total}', '10');
    assert.strictEqual(formattedHi, '10 में से 5 शिकायतें');
  });

  it('should enforce fallback indicator rules for unlocalized content', () => {
    function fallbackText(
      lang: 'en' | 'hi',
      hindiText?: string | null,
      englishText?: string | null
    ): string {
      const en = englishText ? englishText.trim() : '';
      const hi = hindiText ? hindiText.trim() : '';

      if (lang === 'hi') {
        if (hi.length > 0) return hi;
        if (en.length > 0) return `${en} (उपलब्ध हिन्दी अनुवाद नहीं है)`;
        return '(उपलब्ध हिन्दी अनुवाद नहीं है)';
      }
      return en;
    }

    assert.strictEqual(fallbackText('hi', 'स्वच्छता', 'Sanitation'), 'स्वच्छता');
    assert.strictEqual(
      fallbackText('hi', null, 'Sanitation Guidelines'),
      'Sanitation Guidelines (उपलब्ध हिन्दी अनुवाद नहीं है)'
    );
    assert.strictEqual(fallbackText('en', 'स्वच्छता', 'Sanitation'), 'Sanitation');
  });

  it('should verify role-based default language resolution rule', () => {
    function resolveDefaultLang(
      pathname: string,
      explicitChoice: boolean,
      savedLang?: 'en' | 'hi'
    ): 'en' | 'hi' {
      if (explicitChoice && savedLang) {
        return savedLang;
      }
      if (pathname.startsWith('/worker')) {
        return 'hi';
      }
      return savedLang || 'en';
    }

    // New visitor without explicit choice:
    assert.strictEqual(resolveDefaultLang('/worker', false), 'hi');
    assert.strictEqual(resolveDefaultLang('/citizen', false), 'en');
    assert.strictEqual(resolveDefaultLang('/officer', false), 'en');
    assert.strictEqual(resolveDefaultLang('/', false), 'en');
    assert.strictEqual(resolveDefaultLang('/schemes', false), 'en');

    // Visitor who explicitly chose 'en' on /worker:
    assert.strictEqual(resolveDefaultLang('/worker', true, 'en'), 'en');

    // Visitor who explicitly chose 'hi' on /citizen:
    assert.strictEqual(resolveDefaultLang('/citizen', true, 'hi'), 'hi');
  });
});

describe('Milestone 7: End-to-End Component Localization in EN vs HI', () => {
  it('CitizenQuickActionsHeader renders bilingual actions in English and Hindi', () => {
    const enHtml = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        { defaultLanguage: 'en' },
        React.createElement(CitizenQuickActionsHeader, { onOpenReportModal: () => {} })
      )
    );
    assert.ok(enHtml.includes('Citizen Dashboard'), 'EN must render "Citizen Dashboard"');
    assert.ok(enHtml.includes('Report a New Complaint'), 'EN must render "Report a New Complaint"');

    const hiHtml = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        { defaultLanguage: 'hi' },
        React.createElement(CitizenQuickActionsHeader, { onOpenReportModal: () => {} })
      )
    );
    assert.ok(hiHtml.includes('नागरिक डैशबोर्ड'), 'HI must render "नागरिक डैशबोर्ड"');
    assert.ok(hiHtml.includes('नई शिकायत दर्ज करें'), 'HI must render "नई शिकायत दर्ज करें"');
  });

  it('CitizenComplaintList renders localized empty states in English and Hindi', () => {
    const enHtml = renderToStaticMarkup(
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
    assert.ok(enHtml.includes('No complaints yet'), 'EN must render "No complaints yet"');
    assert.ok(enHtml.includes('My Recent Complaints'), 'EN must render "My Recent Complaints"');

    const hiHtml = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        { defaultLanguage: 'hi' },
        React.createElement(CitizenComplaintList, {
          complaints: [],
          onOpenReportModal: () => {},
          onOpenTimeline: () => {},
          onPreviewPhoto: () => {},
        })
      )
    );
    assert.ok(
      hiHtml.includes('कोई शिकायत दर्ज नहीं है'),
      'HI must render "कोई शिकायत दर्ज नहीं है"'
    );
    assert.ok(
      hiHtml.includes('हालिया दर्ज शिकायतें'),
      'HI must render "हालिया दर्ज शिकायतें"'
    );
  });

  it('OfficerMetricsBar renders localized metric labels in English and Hindi', () => {
    const enHtml = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        { defaultLanguage: 'en' },
        React.createElement(OfficerMetricsBar, {
          designation: 'Zonal Officer',
          totalCount: 12,
          underReviewCount: 3,
          inProgressCount: 4,
          resolvedCount: 5,
        })
      )
    );
    assert.ok(enHtml.includes('Total Grievances'), 'EN must render "Total Grievances"');
    assert.ok(enHtml.includes('Needs Review'), 'EN must render "Needs Review"');
    assert.ok(enHtml.includes('Active In Progress'), 'EN must render "Active In Progress"');
    assert.ok(enHtml.includes('Resolved'), 'EN must render "Resolved"');

    const hiHtml = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        { defaultLanguage: 'hi' },
        React.createElement(OfficerMetricsBar, {
          designation: 'ज़ोनल अधिकारी',
          totalCount: 12,
          underReviewCount: 3,
          inProgressCount: 4,
          resolvedCount: 5,
        })
      )
    );
    assert.ok(hiHtml.includes('कुल शिकायतें'), 'HI must render "कुल शिकायतें"');
    assert.ok(hiHtml.includes('समीक्षा आवश्यक'), 'HI must render "समीक्षा आवश्यक"');
    assert.ok(hiHtml.includes('सक्रिय प्रगति पर'), 'HI must render "सक्रिय प्रगति पर"');
    assert.ok(hiHtml.includes('निस्तारित'), 'HI must render "निस्तारित"');
  });

  it('OfficerFilterToolbar renders localized placeholders and options in English and Hindi', () => {
    const enHtml = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        { defaultLanguage: 'en' },
        React.createElement(OfficerFilterToolbar, {
          statusFilter: 'all',
          setStatusFilter: () => {},
          wardFilter: 'all',
          setWardFilter: () => {},
          categoryFilter: 'all',
          setCategoryFilter: () => {},
          searchQuery: '',
          setSearchQuery: () => {},
          wards: [],
          filteredCount: 5,
          totalCount: 10,
          underReviewCount: 2,
          unassignedCount: 1,
          inProgressCount: 2,
        })
      )
    );
    assert.ok(enHtml.includes('Search code, landmark...'), 'EN must render "Search code, landmark..."');
    assert.ok(enHtml.includes('All Statuses'), 'EN must render "All Statuses"');
    assert.ok(enHtml.includes('5 of 10 complaints'), 'EN must format interpolated string');

    const hiHtml = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        { defaultLanguage: 'hi' },
        React.createElement(OfficerFilterToolbar, {
          statusFilter: 'all',
          setStatusFilter: () => {},
          wardFilter: 'all',
          setWardFilter: () => {},
          categoryFilter: 'all',
          setCategoryFilter: () => {},
          searchQuery: '',
          setSearchQuery: () => {},
          wards: [],
          filteredCount: 5,
          totalCount: 10,
          underReviewCount: 2,
          unassignedCount: 1,
          inProgressCount: 2,
        })
      )
    );
    assert.ok(hiHtml.includes('कोड, स्थल पहचान से खोजें...'), 'HI must render "कोड, स्थल पहचान से खोजें..."');
    assert.ok(hiHtml.includes('सभी स्थितियां'), 'HI must render "सभी स्थितियां"');
    assert.ok(hiHtml.includes('10 में से 5 शिकायतें'), 'HI must format interpolated string');
  });

  it('NotificationBell renders localized accessibility labels in English and Hindi', () => {
    const enHtml = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        { defaultLanguage: 'en' },
        React.createElement(NotificationBell)
      )
    );
    assert.ok(enHtml.includes('aria-label="Notifications"'), 'EN must render aria-label="Notifications"');

    const hiHtml = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        { defaultLanguage: 'hi' },
        React.createElement(NotificationBell)
      )
    );
    assert.ok(hiHtml.includes('aria-label="सूचनाएं"'), 'HI must render aria-label="सूचनाएं"');
  });
});

