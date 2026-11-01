import type {
  SchemeRecord,
  SchemeLevel,
  UserEligibilityProfile,
  SchemeEligibilityEvaluation,
} from '@/types/schemes';
import {
  getAllSchemes,
  getSearchTermsItem,
  getCitizenContent,
} from './data';
import { evaluateSchemeEligibility } from './eligibility';

export interface SchemeFilterOptions {
  query?: string;
  schemeLevel?: SchemeLevel | 'all';
  category?: string | 'all';
  eligibilityProfile?: UserEligibilityProfile;
  eligibilityFilterStatus?: 'all' | 'meets' | 'does_not_meet' | 'cannot_determine';
  mpPriority?: boolean;
}

export interface SchemeSearchResultItem {
  scheme: SchemeRecord;
  eligibility?: SchemeEligibilityEvaluation;
  score: number;
}

/**
 * Normalizes query string for robust bilingual search
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u0900-\u097F]/gi, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Searches and filters schemes purely locally without external APIs.
 * Preserves deterministic ordering and Madhya Pradesh prominence.
 */
export function searchSchemes(options: SchemeFilterOptions = {}): SchemeSearchResultItem[] {
  const {
    query = '',
    schemeLevel = 'all',
    category = 'all',
    eligibilityProfile,
    eligibilityFilterStatus = 'all',
    mpPriority = true,
  } = options;

  const allSchemes = getAllSchemes();
  const trimmedQuery = query.trim();
  const normalizedQuery = normalizeText(trimmedQuery);
  const queryTokens = normalizedQuery.split(' ').filter((t) => t.length > 0);

  const results: SchemeSearchResultItem[] = [];

  for (const scheme of allSchemes) {
    // 1. Level Filter
    if (schemeLevel !== 'all' && scheme.scheme_level !== schemeLevel) {
      continue;
    }

    // 2. Category Filter
    if (category !== 'all' && scheme.category !== category) {
      continue;
    }

    // 3. Search Matching & Scoring
    let matchScore = 0;
    if (queryTokens.length > 0) {
      const searchTermsData = getSearchTermsItem(scheme.scheme_id);
      const citizenContent = getCitizenContent(scheme.scheme_id);

      const officialNameNorm = normalizeText(scheme.official_name);
      const shortNameNorm = normalizeText(scheme.short_name);
      const descNorm = normalizeText(scheme.description || '');

      const aliasesNorm = (scheme.aliases || []).map(normalizeText);
      const keywordsNorm = (scheme.assistant_keywords || []).map(normalizeText);
      const searchTermsNorm = (searchTermsData?.search_terms || []).map(normalizeText);

      const hiSummaryText = citizenContent?.content_hi?.short_summary?.[0]?.text || '';
      const hiSummaryNorm = normalizeText(hiSummaryText);

      let allMatched = true;

      for (const token of queryTokens) {
        let tokenScore = 0;

        // Exact official name match
        if (officialNameNorm.includes(token)) {
          tokenScore += 10;
        }

        // Short name / alias match
        if (shortNameNorm === token) {
          tokenScore += 12;
        } else if (shortNameNorm.includes(token)) {
          tokenScore += 8;
        }

        if (aliasesNorm.some((a) => a === token || a.includes(token))) {
          tokenScore += 8;
        }

        // Search terms dataset match (covers citizen colloquial terms and Hindi terms)
        if (searchTermsNorm.some((t) => t === token || t.includes(token))) {
          tokenScore += 9;
        }

        // Hindi citizen summary match
        if (hiSummaryNorm.includes(token)) {
          tokenScore += 7;
        }

        // Description / assistant keywords match
        if (keywordsNorm.some((k) => k.includes(token))) {
          tokenScore += 5;
        } else if (descNorm.includes(token)) {
          tokenScore += 3;
        }

        if (tokenScore === 0) {
          allMatched = false;
          break;
        }

        matchScore += tokenScore;
      }

      if (!allMatched) {
        continue;
      }
    } else {
      // Default score when no search query
      matchScore = 1;
    }

    // 4. Eligibility Evaluation (if user profile is active)
    let eligibilityEval: SchemeEligibilityEvaluation | undefined;
    if (eligibilityProfile && Object.values(eligibilityProfile).some((v) => v !== null && v !== undefined)) {
      eligibilityEval = evaluateSchemeEligibility(scheme, eligibilityProfile);

      // Apply eligibility filter status if selected
      if (eligibilityFilterStatus !== 'all' && eligibilityEval.overallStatus !== eligibilityFilterStatus) {
        continue;
      }
    }

    // 5. Madhya Pradesh prominence boost
    // MP state schemes or MP-specific central-state schemes receive priority
    if (mpPriority) {
      if (scheme.scheme_level === 'state' || scheme.jurisdiction === 'Madhya Pradesh') {
        matchScore += 4;
      } else if (scheme.jurisdiction.includes('Madhya Pradesh')) {
        matchScore += 2;
      }
    }

    results.push({
      scheme,
      eligibility: eligibilityEval,
      score: matchScore,
    });
  }

  // Sort by score descending, then by official_name ascending
  results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.scheme.official_name.localeCompare(b.scheme.official_name);
  });

  return results;
}

