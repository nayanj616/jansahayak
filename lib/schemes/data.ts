import type {
  SchemeRecord,
  SourceRecord,
  CitizenContentRecord,
  SchemeFAQ,
  SearchTermsItem,
  CivicServiceItem,
  SchemeServiceLink,
  GrievanceChannelItem,
  SchemeGrievanceLink,
  SchemeLevel,
} from '@/types/schemes';

import rawSchemes from '@/data/schemes/schemes.json';
import rawSources from '@/data/schemes/sources.json';
import rawCitizenContent from '@/data/schemes/citizen-content.json';
import rawFaqs from '@/data/schemes/scheme-faqs.json';
import rawSearchTerms from '@/data/schemes/search-terms.json';
import rawServiceLinks from '@/data/schemes/scheme-service-links.json';
import rawGrievanceLinks from '@/data/schemes/scheme-grievance-links.json';

// Type-safe static datasets
const schemes: SchemeRecord[] = rawSchemes as unknown as SchemeRecord[];
const sources: SourceRecord[] = rawSources as unknown as SourceRecord[];
const citizenContentList: CitizenContentRecord[] = (
  rawCitizenContent as unknown as { schemes: CitizenContentRecord[] }
).schemes;
const faqsList: SchemeFAQ[] = (rawFaqs as unknown as { faqs: SchemeFAQ[] }).faqs;
const searchTermsList: SearchTermsItem[] = (
  rawSearchTerms as unknown as { search_terms: SearchTermsItem[] }
).search_terms;

const serviceLinksData = rawServiceLinks as unknown as {
  services: CivicServiceItem[];
  links: SchemeServiceLink[];
};
const grievanceLinksData = rawGrievanceLinks as unknown as {
  channels: GrievanceChannelItem[];
  links: SchemeGrievanceLink[];
};

// Fast index maps
const schemesById = new Map<string, SchemeRecord>();
for (const s of schemes) {
  schemesById.set(s.scheme_id, s);
}

const sourcesById = new Map<string, SourceRecord>();
for (const src of sources) {
  sourcesById.set(src.source_id, src);
}

const citizenContentById = new Map<string, CitizenContentRecord>();
for (const cc of citizenContentList) {
  citizenContentById.set(cc.scheme_id, cc);
}

const faqsBySchemeId = new Map<string, SchemeFAQ[]>();
for (const faq of faqsList) {
  const existing = faqsBySchemeId.get(faq.scheme_id) || [];
  existing.push(faq);
  faqsBySchemeId.set(faq.scheme_id, existing);
}

const searchTermsBySchemeId = new Map<string, SearchTermsItem>();
for (const st of searchTermsList) {
  searchTermsBySchemeId.set(st.scheme_id, st);
}

const servicesById = new Map<string, CivicServiceItem>();
for (const s of serviceLinksData.services) {
  servicesById.set(s.service_id, s);
}

const channelsById = new Map<string, GrievanceChannelItem>();
for (const c of grievanceLinksData.channels) {
  channelsById.set(c.channel_id, c);
}

// Public Accessors

export function getAllSchemes(): SchemeRecord[] {
  return schemes;
}

export function getSchemeById(id: string): SchemeRecord | undefined {
  return schemesById.get(id);
}

export function getAllSources(): SourceRecord[] {
  return sources;
}

export function getSourceById(id: string): SourceRecord | undefined {
  return sourcesById.get(id);
}

export function getCitizenContent(schemeId: string): CitizenContentRecord | undefined {
  return citizenContentById.get(schemeId);
}

export function getSchemeFaqs(schemeId: string): SchemeFAQ[] {
  return faqsBySchemeId.get(schemeId) || [];
}

export function getSearchTermsItem(schemeId: string): SearchTermsItem | undefined {
  return searchTermsBySchemeId.get(schemeId);
}

export function getAllSearchTerms(): SearchTermsItem[] {
  return searchTermsList;
}

export function getSchemeServiceLinks(schemeId: string): {
  service: CivicServiceItem;
  link: SchemeServiceLink;
}[] {
  const links = serviceLinksData.links.filter((l) => l.scheme_id === schemeId);
  return links
    .map((link) => {
      const service = servicesById.get(link.service_id);
      return service ? { service, link } : null;
    })
    .filter((item): item is { service: CivicServiceItem; link: SchemeServiceLink } => item !== null);
}

export function getSchemeGrievanceLinks(schemeId: string): {
  channel: GrievanceChannelItem;
  link: SchemeGrievanceLink;
}[] {
  const links = grievanceLinksData.links.filter((l) => l.scheme_id === schemeId);
  return links
    .map((link) => {
      const channel = channelsById.get(link.channel_id);
      return channel ? { channel, link } : null;
    })
    .filter((item): item is { channel: GrievanceChannelItem; link: SchemeGrievanceLink } => item !== null);
}

export function getCategoryCounts(): { category: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const s of schemes) {
    counts.set(s.category, (counts.get(s.category) || 0) + 1);
  }
  return Array.from(counts.entries()).map(([category, count]) => ({
    category,
    count,
  }));
}

export function getSchemeLevelCounts(): { level: SchemeLevel; count: number }[] {
  const counts = new Map<SchemeLevel, number>();
  for (const s of schemes) {
    counts.set(s.scheme_level, (counts.get(s.scheme_level) || 0) + 1);
  }
  return Array.from(counts.entries()).map(([level, count]) => ({
    level,
    count,
  }));
}

/**
 * Helper to retrieve localized display content for a scheme.
 * Follows strict Phase 1 fallback convention:
 * When Hindi content is unavailable, English text is provided along with fallback flag.
 * NEVER substitutes generic search keywords as official scheme names.
 */
export function getSchemeDisplaySummary(
  scheme: SchemeRecord,
  lang: 'en' | 'hi'
): {
  title: string;
  isTitleFallback: boolean;
  summary: string;
  isSummaryFallback: boolean;
  benefitsPreview: string;
} {
  const cc = citizenContentById.get(scheme.scheme_id);
  const enSummaryText =
    cc?.content_en?.short_summary?.[0]?.text ||
    scheme.description ||
    '';

  const hiSummaryText = cc?.content_hi?.short_summary?.[0]?.text || null;

  // Title localization: Only use genuine recorded Devanagari alias from scheme.aliases
  // Never substitute generic search query keywords (e.g. "महिला सहायता" or "पेंशन")
  const genuineHindiAlias = (scheme.aliases || []).find((a) => /[\u0900-\u097F]/.test(a));

  if (lang === 'hi') {
    return {
      title: genuineHindiAlias || scheme.official_name,
      isTitleFallback: !genuineHindiAlias,
      summary: hiSummaryText || enSummaryText,
      isSummaryFallback: !hiSummaryText,
      benefitsPreview: scheme.benefit_amount
        ? `${scheme.benefit_amount} (${scheme.benefit_frequency || 'नियम अनुसार'})`
        : Array.isArray(scheme.benefits)
          ? scheme.benefits[0]
          : scheme.benefits || 'पात्रता अनुसार शासकीय लाभ',
    };
  }

  return {
    title: scheme.official_name,
    isTitleFallback: false,
    summary: enSummaryText,
    isSummaryFallback: false,
    benefitsPreview: scheme.benefit_amount
      ? `${scheme.benefit_amount} (${scheme.benefit_frequency || 'as per rules'})`
      : Array.isArray(scheme.benefits)
        ? scheme.benefits[0]
        : scheme.benefits || 'Official government welfare benefit',
  };
}

/**
 * Validates whether a scheme has an established direct online application portal route.
 * Filters out general department root homepages (like socialjustice.mp.gov.in)
 * and survey/offline workflows where no direct self-service application form exists.
 */
export function getVerifiedApplicationPortal(
  scheme: SchemeRecord
): { url: string; isDirectPortal: boolean } | null {
  if (!scheme.application_portal) {
    return null;
  }

  const portal = scheme.application_portal.trim();

  // General department root portals where application is strictly offline/local authority
  const genericDepartmentHomepages = [
    'https://socialjustice.mp.gov.in/',
    'https://socialjustice.mp.gov.in',
  ];

  if (genericDepartmentHomepages.includes(portal)) {
    return null;
  }

  // Schemes where dataset notes state portal is not a standalone application page
  if (scheme.scheme_id === 'mp_student_welfare_st' || scheme.scheme_id === 'pmay_g') {
    return null;
  }

  return {
    url: portal,
    isDirectPortal: true,
  };
}

/**
 * Returns accurate geographic/administrative scope badge.
 * Only displays Gwalior-specific relevance if the dataset record actually establishes it.
 * Otherwise returns appropriate Madhya Pradesh state or national scope.
 */
export function getSchemeScopeBadge(
  scheme: SchemeRecord,
  lang: 'en' | 'hi'
): { label: string; variant: 'blue' | 'emerald' | 'purple' | 'amber' } {
  const jsonStr = (scheme.jurisdiction + ' ' + (scheme.description || '')).toLowerCase();

  // Only assign Gwalior badge if explicitly supported in record
  if (jsonStr.includes('gwalior')) {
    return {
      label: lang === 'hi' ? 'ग्वालियर नगर निगम दायरा' : 'Gwalior Municipal Scope',
      variant: 'amber',
    };
  }

  if (scheme.scheme_level === 'state') {
    return {
      label: lang === 'hi' ? 'मध्य प्रदेश शासन दायरा' : 'Madhya Pradesh State Scope',
      variant: 'emerald',
    };
  }

  if (scheme.scheme_level === 'central_state') {
    return {
      label:
        lang === 'hi'
          ? 'संयुक्त क्रियान्वयन (म.प्र. एवं केंद्र)'
          : 'Joint Implementation (MP & Centre)',
      variant: 'purple',
    };
  }

  return {
    label: lang === 'hi' ? 'अखिल भारतीय केंद्रीय दायरा' : 'National Central Scope',
    variant: 'blue',
  };
}

