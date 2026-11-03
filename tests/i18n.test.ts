import test from 'node:test';
import assert from 'node:assert';
import { enDictionary } from '@/lib/i18n/dictionaries/en';
import { hiDictionary } from '@/lib/i18n/dictionaries/hi';
import type { TranslationDictionary } from '@/lib/i18n/types';
import {
  formatFrontendError,
  classifyFrontendError,
  VISION_ERROR_MESSAGES,
  COMMON_ERROR_MESSAGES,
  containsTechnicalLeakage,
} from '@/lib/errors';
import { getLatestAiVerification } from '@/lib/verifications';
import type { AiVerificationRecord } from '@/types';

// ============================================================================
// 1. DICTIONARY STRUCTURE & KEY PARITY TESTS
// ============================================================================

test('i18n: English and Hindi dictionaries have parity for all required sections', () => {
  const sections: (keyof TranslationDictionary)[] = ['common', 'nav', 'schemeExploration'];
  for (const sec of sections) {
    assert.ok(enDictionary[sec], `English dictionary missing section: ${sec}`);
    assert.ok(hiDictionary[sec], `Hindi dictionary missing section: ${sec}`);
  }
});

test('i18n: All five Scheme Exploration tabs are defined in both English and Hindi', () => {
  const requiredTabs = ['finder', 'assistant', 'grievances', 'services', 'verification'] as const;

  for (const tab of requiredTabs) {
    assert.ok(
      enDictionary.schemeExploration.tabs[tab],
      `English dictionary missing tab label: ${tab}`
    );
    assert.ok(
      hiDictionary.schemeExploration.tabs[tab],
      `Hindi dictionary missing tab label: ${tab}`
    );
    assert.ok(
      enDictionary.schemeExploration.tabDescriptions[tab],
      `English dictionary missing tab description: ${tab}`
    );
    assert.ok(
      hiDictionary.schemeExploration.tabDescriptions[tab],
      `Hindi dictionary missing tab description: ${tab}`
    );
  }
});

test('i18n: All placeholder section content keys exist in both English and Hindi', () => {
  const enKeys = Object.keys(enDictionary.schemeExploration.placeholders);
  const hiKeys = Object.keys(hiDictionary.schemeExploration.placeholders);

  assert.strictEqual(
    hiKeys.length,
    enKeys.length,
    `Placeholder keys mismatch: English has ${enKeys.length}, Hindi has ${hiKeys.length}`
  );

  for (const key of enKeys) {
    assert.ok(
      key in hiDictionary.schemeExploration.placeholders,
      `Hindi placeholders missing key: ${key}`
    );
    const hiValue =
      hiDictionary.schemeExploration.placeholders[
        key as keyof typeof hiDictionary.schemeExploration.placeholders
      ];
    assert.ok(
      typeof hiValue === 'string' && hiValue.trim().length > 0,
      `Hindi placeholder key '${key}' cannot be empty`
    );
  }
});

test('i18n: All Civic Assistant content keys exist with parity in both English and Hindi', () => {
  const enKeys = Object.keys(enDictionary.schemeExploration.assistant);
  const hiKeys = Object.keys(hiDictionary.schemeExploration.assistant);

  assert.strictEqual(
    hiKeys.length,
    enKeys.length,
    `Assistant keys mismatch: English has ${enKeys.length}, Hindi has ${hiKeys.length}`
  );

  for (const key of enKeys) {
    assert.ok(
      key in hiDictionary.schemeExploration.assistant,
      `Hindi assistant missing key: ${key}`
    );
    const hiVal =
      hiDictionary.schemeExploration.assistant[
        key as keyof typeof hiDictionary.schemeExploration.assistant
      ];
    assert.ok(hiVal !== undefined && hiVal !== null, `Hindi assistant key '${key}' cannot be null`);
  }
});

// ============================================================================
// 2. HINDI FALLBACK DECISION BEHAVIOR TESTS
// ============================================================================

function simulateFallback(
  lang: 'en' | 'hi',
  hindiText?: string | null,
  englishText?: string | null
): string {
  const en = englishText ? englishText.trim() : '';
  const hi = hindiText ? hindiText.trim() : '';

  if (lang === 'hi') {
    if (hi.length > 0) {
      return hi;
    }
    if (en.length > 0) {
      return `${en} (उपलब्ध हिन्दी अनुवाद नहीं है)`;
    }
    return '(उपलब्ध हिन्दी अनुवाद नहीं है)';
  }

  return en;
}

test('i18n: Hindi fallback displays English text with indicator when Hindi is missing', () => {
  const result = simulateFallback('hi', null, 'National Pension Scheme');
  assert.strictEqual(
    result,
    'National Pension Scheme (उपलब्ध हिन्दी अनुवाद नहीं है)',
    'Missing Hindi translation must display English accompanied by indicator'
  );
});

test('i18n: Hindi fallback returns Hindi directly when translation is available', () => {
  const result = simulateFallback('hi', 'अटल पेंशन योजना', 'Atal Pension Yojana');
  assert.strictEqual(
    result,
    'अटल पेंशन योजना',
    'Available Hindi translation must not include fallback indicator'
  );
});

test('i18n: English mode returns English text directly', () => {
  const result = simulateFallback('en', 'अटल पेंशन योजना', 'Atal Pension Yojana');
  assert.strictEqual(result, 'Atal Pension Yojana');
});

// ============================================================================
// 3. COMMON & NAV TRANSLATION COMPLETENESS
// ============================================================================

test('i18n: Navigation translations are present and non-empty in both languages', () => {
  const navKeys = Object.keys(enDictionary.nav);
  for (const k of navKeys) {
    const enVal = enDictionary.nav[k as keyof typeof enDictionary.nav];
    const hiVal = hiDictionary.nav[k as keyof typeof hiDictionary.nav];
    assert.ok(enVal && enVal.trim().length > 0, `English nav key '${k}' is empty`);
    assert.ok(hiVal && hiVal.trim().length > 0, `Hindi nav key '${k}' is empty`);
  }
});

test('i18n: Common translations contain essential system constants', () => {
  assert.strictEqual(enDictionary.common.english, 'English');
  assert.strictEqual(hiDictionary.common.english, 'English');
  assert.strictEqual(enDictionary.common.hindi, 'हिन्दी');
  assert.strictEqual(hiDictionary.common.hindi, 'हिन्दी');
  assert.ok(enDictionary.common.academicDisclaimer.includes('academic demonstration'));
  assert.ok(hiDictionary.common.academicDisclaimer.includes('अकादमिक प्रदर्शन'));
});

// ============================================================================
// 4. COMPLETE RECURSIVE KEY PARITY ACROSS ALL SECTIONS
// ============================================================================

function getLeafKeys(obj: unknown, prefix = ''): string[] {
  let keys: string[] = [];
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return [prefix];
  }
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(getLeafKeys(v, full));
    } else {
      keys.push(full);
    }
  }
  return keys;
}

test('i18n: 100% recursive leaf key parity between English and Hindi dictionaries', () => {
  const enKeys = new Set(getLeafKeys(enDictionary));
  const hiKeys = new Set(getLeafKeys(hiDictionary));

  assert.strictEqual(
    hiKeys.size,
    enKeys.size,
    `Total key count mismatch: EN has ${enKeys.size}, HI has ${hiKeys.size}`
  );

  const missingInHi: string[] = [];
  for (const k of enKeys) {
    if (!hiKeys.has(k)) {
      missingInHi.push(k);
    }
  }
  assert.deepStrictEqual(missingInHi, [], `Keys present in EN but missing in HI: ${missingInHi.join(', ')}`);

  const missingInEn: string[] = [];
  for (const k of hiKeys) {
    if (!enKeys.has(k)) {
      missingInEn.push(k);
    }
  }
  assert.deepStrictEqual(missingInEn, [], `Keys present in HI but missing in EN: ${missingInEn.join(', ')}`);
});

// ============================================================================
// 5. CONCEPTUAL SEPARATION OF COMPLAINT AND ASSIGNMENT STATUSES
// ============================================================================

test('i18n: Assignment statuses and Complaint statuses are strictly separated', () => {
  assert.ok(enDictionary.assignments?.statuses, 'English dictionary must have assignments.statuses');
  assert.ok(hiDictionary.assignments?.statuses, 'Hindi dictionary must have assignments.statuses');

  const requiredAssignmentStatuses = ['assigned', 'in_progress', 'completed', 'cancelled'] as const;
  for (const st of requiredAssignmentStatuses) {
    assert.ok(enDictionary.assignments.statuses[st], `Missing EN assignment status: ${st}`);
    assert.ok(hiDictionary.assignments.statuses[st], `Missing HI assignment status: ${st}`);
  }

  const requiredComplaintStatuses = [
    'submitted',
    'assigned',
    'in_progress',
    'under_review',
    'rework_required',
    'resolved',
    'rejected',
  ] as const;
  for (const st of requiredComplaintStatuses) {
    assert.ok(enDictionary.complaints.statuses[st], `Missing EN complaint status: ${st}`);
    assert.ok(hiDictionary.complaints.statuses[st], `Missing HI complaint status: ${st}`);
  }
});

// ============================================================================
// 6. ERROR MAPPING & BACKEND RAW ERROR SUPPRESSION TESTS
// ============================================================================

test('Frontend Errors: Gemini Vision 503 maps to exact localized messages', () => {
  const raw503 = 'The AI Vision service is temporarily experiencing high upstream demand (HTTP 503). Please retry in a few moments.';
  const enMsg = formatFrontendError(raw503, 'en');
  const hiMsg = formatFrontendError(raw503, 'hi');

  assert.strictEqual(enMsg, VISION_ERROR_MESSAGES.unavailable503.en);
  assert.strictEqual(hiMsg, VISION_ERROR_MESSAGES.unavailable503.hi);
  assert.ok(!enMsg.includes('503'), 'User message must not include raw HTTP status code');
  assert.ok(!hiMsg.includes('503'), 'User message must not include raw HTTP status code');
});

test('Frontend Errors: Gemini Vision 429 rate limit maps to exact localized messages', () => {
  const raw429 = 'The AI Vision service is experiencing temporary rate limiting (HTTP 429). Please retry after a short delay.';
  const enMsg = formatFrontendError(raw429, 'en');
  const hiMsg = formatFrontendError(raw429, 'hi');

  assert.strictEqual(enMsg, VISION_ERROR_MESSAGES.rateLimit429.en);
  assert.strictEqual(hiMsg, VISION_ERROR_MESSAGES.rateLimit429.hi);
  assert.ok(!enMsg.includes('429'));
});

test('Frontend Errors: Gemini Vision exhausted quota maps to exact localized messages', () => {
  const rawQuota = 'The AI Vision service quota has been exhausted. Please contact the project administrator.';
  const enMsg = formatFrontendError(rawQuota, 'en');
  const hiMsg = formatFrontendError(rawQuota, 'hi');

  assert.strictEqual(enMsg, VISION_ERROR_MESSAGES.quotaExhausted.en);
  assert.strictEqual(hiMsg, VISION_ERROR_MESSAGES.quotaExhausted.hi);
});

test('Frontend Errors: Gemini Vision 401/403 auth failure maps to exact localized messages', () => {
  const rawAuth = 'Gemini Vision authentication failed. Check your API credentials.';
  const enMsg = formatFrontendError(rawAuth, 'en');
  const hiMsg = formatFrontendError(rawAuth, 'hi');

  assert.strictEqual(enMsg, VISION_ERROR_MESSAGES.authFailure.en);
  assert.strictEqual(hiMsg, VISION_ERROR_MESSAGES.authFailure.hi);
});

test('Frontend Errors: Gemini Vision 400/404 invalid request maps to exact localized messages', () => {
  const rawInvalid = 'Invalid Gemini Vision request or model not found (HTTP 404).';
  const enMsg = formatFrontendError(rawInvalid, 'en');
  const hiMsg = formatFrontendError(rawInvalid, 'hi');

  assert.strictEqual(enMsg, VISION_ERROR_MESSAGES.invalidRequest.en);
  assert.strictEqual(hiMsg, VISION_ERROR_MESSAGES.invalidRequest.hi);
});

test('Frontend Errors: Unknown Vision error maps to generic vision failure message', () => {
  const rawUnknown = 'Vision model unexpected stream termination';
  const enMsg = formatFrontendError(rawUnknown, 'en');
  const hiMsg = formatFrontendError(rawUnknown, 'hi');

  assert.strictEqual(enMsg, VISION_ERROR_MESSAGES.genericFailure.en);
  assert.strictEqual(hiMsg, VISION_ERROR_MESSAGES.genericFailure.hi);
});

test('Frontend Errors: Network errors map to localized network connection advice', () => {
  const rawNetwork = new TypeError('Failed to fetch');
  const enMsg = formatFrontendError(rawNetwork, 'en');
  const hiMsg = formatFrontendError(rawNetwork, 'hi');

  assert.strictEqual(enMsg, COMMON_ERROR_MESSAGES.network.en);
  assert.strictEqual(hiMsg, COMMON_ERROR_MESSAGES.network.hi);
});

test('Frontend Errors: Suppresses API keys, stack traces, and SQL leakage', () => {
  const leakedKey = 'Provider failure with AIzaSyFakeSecretKey1234567890 at internal/genai.ts:42:10';
  const leakedSql = 'PostgREST error: select * from complaints where id = $1';
  const leakedToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired';

  assert.ok(containsTechnicalLeakage(leakedKey));
  assert.ok(containsTechnicalLeakage(leakedSql));
  assert.ok(containsTechnicalLeakage(leakedToken));

  const safeEn = formatFrontendError(leakedKey, 'en');
  assert.strictEqual(safeEn, COMMON_ERROR_MESSAGES.server.en);
  assert.ok(!safeEn.includes('AIzaSy'));
  assert.ok(!safeEn.includes('genai.ts'));
});

test('Frontend Errors: Internal translation keys (e.g. errors.generic) are never echoed raw', () => {
  const enMsg = formatFrontendError('errors.generic', 'en');
  const hiMsg = formatFrontendError('errors.generic', 'hi');

  assert.notStrictEqual(enMsg, 'errors.generic');
  assert.notStrictEqual(hiMsg, 'errors.generic');
  assert.strictEqual(enMsg, COMMON_ERROR_MESSAGES.generic.en);
  assert.strictEqual(hiMsg, COMMON_ERROR_MESSAGES.generic.hi);
});

test('Frontend Errors: classifyFrontendError accurately categorizes error sources and retry flags', () => {
  const vision503 = classifyFrontendError(new Error('AI Vision verification failed: 503 upstream demand'));
  assert.strictEqual(vision503.source, 'vision');
  assert.strictEqual(vision503.httpStatus, 503);
  assert.strictEqual(vision503.isRetriable, true);

  const authErr = classifyFrontendError({ status: 401, message: '401 Unauthorized' });
  assert.strictEqual(authErr.source, 'unauthorized');
  assert.strictEqual(authErr.httpStatus, 401);
  assert.strictEqual(authErr.isRetriable, false);

  const netErr = classifyFrontendError(new Error('Failed to fetch'));
  assert.strictEqual(netErr.source, 'network');
  assert.strictEqual(netErr.isRetriable, true);
});

// ============================================================================
// 7. LATEST AI VERIFICATION SELECTOR TESTS
// ============================================================================

test('Verification History: getLatestAiVerification selects latest record by timestamp', () => {
  const oldest = {
    id: 'v1',
    complaint_id: 'c1',
    model_name: 'gemini-2.5-flash',
    processing_status: 'failed',
    processing_error: '503 timeout',
    metrics: null,
    waste_reduction_percentage: null,
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-11-01T10:00:00Z',
  } as unknown as AiVerificationRecord;

  const latest = {
    id: 'v2',
    complaint_id: 'c1',
    model_name: 'gemini-2.5-flash',
    processing_status: 'completed',
    processing_error: null,
    metrics: { evaluation: { confidenceLevel: 'high' } },
    waste_reduction_percentage: 85,
    created_at: '2026-11-02T15:30:00Z',
    updated_at: '2026-11-02T15:30:00Z',
  } as unknown as AiVerificationRecord;

  // Irrespective of array ordering, latest timestamp is chosen
  assert.strictEqual(getLatestAiVerification([oldest, latest])?.id, 'v2');
  assert.strictEqual(getLatestAiVerification([latest, oldest])?.id, 'v2');

  // Single record
  assert.strictEqual(getLatestAiVerification(latest)?.id, 'v2');

  // Null / empty array
  assert.strictEqual(getLatestAiVerification(null), null);
  assert.strictEqual(getLatestAiVerification([]), null);
});


