import test from 'node:test';
import assert from 'node:assert';
import { enDictionary } from '@/lib/i18n/dictionaries/en';
import { hiDictionary } from '@/lib/i18n/dictionaries/hi';
import type { TranslationDictionary } from '@/lib/i18n/types';

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

