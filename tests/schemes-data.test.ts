import test from 'node:test';
import assert from 'node:assert';
import {
  getAllSchemes,
  getSchemeById,
  getAllSources,
  getSourceById,
  getCitizenContent,
  getSchemeFaqs,
  getSearchTermsItem,
  getSchemeServiceLinks,
  getSchemeGrievanceLinks,
  getCategoryCounts,
  getSchemeLevelCounts,
  getSchemeDisplaySummary,
  getVerifiedApplicationPortal,
  getSchemeScopeBadge,
} from '@/lib/schemes/data';
import { evaluateSchemeEligibility } from '@/lib/schemes/eligibility';
import { searchSchemes } from '@/lib/schemes/search';
import type { SchemeRecord } from '@/types/schemes';

// ============================================================================
// 1. DATASET INTEGRATION & REFERENTIAL INTEGRITY TESTS
// ============================================================================

test('Schemes Data: Loads all 50 unique researched schemes', () => {
  const schemes = getAllSchemes();
  assert.strictEqual(schemes.length, 50, 'Expected exactly 50 schemes in dataset');

  const ids = new Set<string>();
  for (const s of schemes) {
    assert.ok(s.scheme_id, 'Scheme must have scheme_id');
    assert.ok(!ids.has(s.scheme_id), `Duplicate scheme_id found: ${s.scheme_id}`);
    ids.add(s.scheme_id);

    assert.ok(s.official_name, `Scheme ${s.scheme_id} missing official_name`);
    assert.ok(s.category, `Scheme ${s.scheme_id} missing category`);
    assert.ok(s.scheme_level, `Scheme ${s.scheme_id} missing scheme_level`);
  }
});

test('Schemes Data: Loads all 82 official source records and verifies integrity', () => {
  const sources = getAllSources();
  assert.strictEqual(sources.length, 82, 'Expected exactly 82 official sources');

  const sourceIds = new Set(sources.map((s) => s.source_id));
  assert.strictEqual(sourceIds.size, 82, 'Expected 82 unique source IDs');

  for (const sid of sourceIds) {
    const src = getSourceById(sid);
    assert.ok(src, `getSourceById failed for ${sid}`);
    assert.strictEqual(src?.source_id, sid);
  }

  // Verify all schemes reference valid source_ids
  const schemes = getAllSchemes();
  for (const s of schemes) {
    if (Array.isArray(s.sources)) {
      for (const sid of s.sources) {
        assert.ok(sourceIds.has(sid), `Scheme ${s.scheme_id} references non-existent source_id: ${sid}`);
      }
    }
  }
});

test('Schemes Data: Category and scheme level aggregations are accurate', () => {
  const catCounts = getCategoryCounts();
  assert.ok(catCounts.length > 0, 'Category counts should have entries');
  const totalCats = catCounts.reduce((acc, curr) => acc + curr.count, 0);
  assert.strictEqual(totalCats, 50, 'Total categorized schemes should equal 50');

  const levelCounts = getSchemeLevelCounts();
  const totalLevels = levelCounts.reduce((acc, curr) => acc + curr.count, 0);
  assert.strictEqual(totalLevels, 50, 'Total level counts should equal 50');

  assert.ok(levelCounts.some((l) => l.level === 'state' && l.count > 0), 'State schemes must exist');
  assert.ok(levelCounts.some((l) => l.level === 'central' && l.count > 0), 'Central schemes must exist');
});

test('Schemes Data: Citizen content and search terms map 100% of schemes', () => {
  const schemes = getAllSchemes();
  for (const s of schemes) {
    const cc = getCitizenContent(s.scheme_id);
    assert.ok(cc, `Missing citizen content for ${s.scheme_id}`);
    assert.ok(cc.content_en?.short_summary?.[0]?.text, `Missing EN short summary for ${s.scheme_id}`);

    const st = getSearchTermsItem(s.scheme_id);
    assert.ok(st, `Missing search terms for ${s.scheme_id}`);
    assert.ok(st.search_terms.length > 0, `Search terms array cannot be empty for ${s.scheme_id}`);
  }
});

test('Schemes Data: Preserves unknown and null distinctions without coercion', () => {
  const schemes = getAllSchemes();

  // Find schemes with null values
  const hasNullAge = schemes.some((s) => s.age_min === null && s.age_max === null);
  const hasNullGender = schemes.some((s) => s.gender_eligibility === null);
  const hasNullIncome = schemes.some((s) => s.income_limit === null);
  const hasNullBpl = schemes.some((s) => s.bpl_required === null);
  const hasNullDisability = schemes.some((s) => s.disability_eligibility === null);

  assert.ok(hasNullAge, 'Dataset must preserve null for unrecorded age');
  assert.ok(hasNullGender, 'Dataset must preserve null for unrecorded gender');
  assert.ok(hasNullIncome, 'Dataset must preserve null for unrecorded income limit');
  assert.ok(hasNullBpl, 'Dataset must preserve null for unrecorded BPL status');
  assert.ok(hasNullDisability, 'Dataset must preserve null for unrecorded disability status');
});

test('Schemes Data: Relationships and FAQs resolve properly', () => {
  // Ladli Behna scheme relationships
  const lbScheme = getSchemeById('mp_ladli_behna');
  assert.ok(lbScheme, 'Ladli Behna scheme should exist');

  const faqs = getSchemeFaqs('mp_ladli_behna');
  assert.ok(faqs.length > 0, 'Ladli Behna should have FAQs');

  // Verify service and grievance links
  const serviceLinks = getSchemeServiceLinks('mp_ladli_behna');
  assert.ok(Array.isArray(serviceLinks), 'Service links must be an array');

  const grievanceLinks = getSchemeGrievanceLinks('mp_ladli_behna');
  assert.ok(Array.isArray(grievanceLinks), 'Grievance links must be an array');
});

// ============================================================================
// 2. SEARCH ENGINE TESTS
// ============================================================================

test('Scheme Search: English official name search', () => {
  const results = searchSchemes({ query: 'Atal Pension' });
  assert.ok(results.length > 0, 'Should return results for Atal Pension');
  assert.strictEqual(results[0].scheme.scheme_id, 'atal_pension');
});

test('Scheme Search: Hindi search terms return correct scheme', () => {
  const results = searchSchemes({ query: 'पेंशन' });
  assert.ok(results.length > 0, 'Should return results for Hindi query पेंशन');
  const found = results.some((r) => r.scheme.scheme_id === 'atal_pension');
  assert.ok(found, 'Atal Pension should be found via Hindi search term पेंशन');
});

test('Scheme Search: Acronym and alias search', () => {
  const apyResults = searchSchemes({ query: 'APY' });
  assert.ok(apyResults.length > 0, 'Should find APY by alias');
  assert.strictEqual(apyResults[0].scheme.scheme_id, 'atal_pension');

  const pmayResults = searchSchemes({ query: 'PMAY' });
  assert.ok(pmayResults.length > 0, 'Should find PMAY by alias');
});

test('Scheme Search: Empty query returns all 50 schemes', () => {
  const results = searchSchemes({ query: '' });
  assert.strictEqual(results.length, 50, 'Empty query must return all schemes');
});

test('Scheme Search: Nonsense query returns empty array', () => {
  const results = searchSchemes({ query: 'xyz987nonexistentterm123' });
  assert.strictEqual(results.length, 0, 'Unmatched query should return 0 results');
});

// ============================================================================
// 3. FILTERING TESTS
// ============================================================================

test('Scheme Filter: Filter by scheme level', () => {
  const stateSchemes = searchSchemes({ schemeLevel: 'state' });
  assert.strictEqual(stateSchemes.length, 21, 'Expected 21 state schemes');
  for (const r of stateSchemes) {
    assert.strictEqual(r.scheme.scheme_level, 'state');
  }

  const centralSchemes = searchSchemes({ schemeLevel: 'central' });
  assert.strictEqual(centralSchemes.length, 16, 'Expected 16 central schemes');

  const jointSchemes = searchSchemes({ schemeLevel: 'central_state' });
  assert.strictEqual(jointSchemes.length, 13, 'Expected 13 central_state schemes');
});

test('Scheme Filter: Filter by category', () => {
  const agriSchemes = searchSchemes({ category: 'agriculture_farmers' });
  assert.strictEqual(agriSchemes.length, 5, 'Expected 5 agriculture_farmers schemes');

  const pensionSchemes = searchSchemes({ category: 'social_security_pensions' });
  assert.strictEqual(pensionSchemes.length, 17, 'Expected 17 social_security_pensions schemes');
});

test('Scheme Filter: Combined search query and category filter', () => {
  const results = searchSchemes({
    query: 'Pension',
    category: 'social_security_pensions',
    schemeLevel: 'central',
  });
  assert.ok(results.length > 0, 'Expected results for combined central pension search');
  for (const r of results) {
    assert.strictEqual(r.scheme.scheme_level, 'central');
    assert.strictEqual(r.scheme.category, 'social_security_pensions');
  }
});

// ============================================================================
// 4. THREE-STATE ELIGIBILITY EVALUATION TESTS
// ============================================================================

test('Eligibility: Evaluates meets known condition', () => {
  const atalPension = getSchemeById('atal_pension') as SchemeRecord;
  assert.ok(atalPension, 'atal_pension must exist');

  // APY has age_min: 18, age_max: 40
  const eval30 = evaluateSchemeEligibility(atalPension, { age: 30 });
  assert.strictEqual(eval30.criteria.age.status, 'meets');
  assert.strictEqual(eval30.overallStatus, 'meets');
});

test('Eligibility: Evaluates does not meet known condition', () => {
  const atalPension = getSchemeById('atal_pension') as SchemeRecord;
  // Age 50 > max 40
  const eval50 = evaluateSchemeEligibility(atalPension, { age: 50 });
  assert.strictEqual(eval50.criteria.age.status, 'does_not_meet');
  assert.strictEqual(eval50.overallStatus, 'does_not_meet');
});

test('Eligibility: Strict cannot_determine preservation for unrecorded criteria', () => {
  // Find a scheme with null age
  const allSchemes = getAllSchemes();
  const nullAgeScheme = allSchemes.find((s) => s.age_min === null && s.age_max === null) as SchemeRecord;
  assert.ok(nullAgeScheme, 'At least one scheme must have null age');

  const evalNull = evaluateSchemeEligibility(nullAgeScheme, { age: 35 });
  assert.strictEqual(
    evalNull.criteria.age.status,
    'cannot_determine',
    'Null criteria must produce cannot_determine, NEVER does_not_meet or meets'
  );
  assert.strictEqual(evalNull.overallStatus, 'cannot_determine');
  assert.ok(evalNull.criteria.age.reasonEn.includes('unrecorded'));
  assert.ok(evalNull.criteria.age.reasonHi.includes('डेटासेट'));
});

test('Eligibility: Gender criteria distinction (women targeting)', () => {
  const lbScheme = getSchemeById('mp_ladli_behna') as SchemeRecord;
  assert.ok(lbScheme, 'mp_ladli_behna must exist');

  const evalWomen = evaluateSchemeEligibility(lbScheme, { gender: 'women' });
  assert.strictEqual(evalWomen.criteria.gender.status, 'meets');

  const evalMen = evaluateSchemeEligibility(lbScheme, { gender: 'men' });
  assert.strictEqual(evalMen.criteria.gender.status, 'does_not_meet');
});

test('Eligibility: BPL criteria distinction (mandatory vs not required)', () => {
  const allSchemes = getAllSchemes();
  const bplRequiredScheme = allSchemes.find((s) => s.bpl_required === true);
  if (bplRequiredScheme) {
    const evalNoBpl = evaluateSchemeEligibility(bplRequiredScheme, { isBpl: false });
    assert.strictEqual(evalNoBpl.criteria.bpl.status, 'does_not_meet');

    const evalWithBpl = evaluateSchemeEligibility(bplRequiredScheme, { isBpl: true });
    assert.strictEqual(evalWithBpl.criteria.bpl.status, 'meets');
  }

  const bplNullScheme = allSchemes.find((s) => s.bpl_required === null);
  if (bplNullScheme) {
    const evalNullBpl = evaluateSchemeEligibility(bplNullScheme, { isBpl: false });
    assert.strictEqual(evalNullBpl.criteria.bpl.status, 'cannot_determine');
  }
});

// ============================================================================
// 5. PHASE 2 REVIEW: ACCURACY, INTEGRITY & BILINGUAL QUALITY TESTS
// ============================================================================

test('Review Quality: Preserves official scheme names and prohibits generic search term substitution', () => {
  const lbScheme = getSchemeById('mp_ladli_behna') as SchemeRecord;
  assert.ok(lbScheme, 'mp_ladli_behna must exist');

  // Ladli Behna in Hindi must preserve official scheme name with fallback flag
  // It must NOT substitute the generic search keyword "महिला सहायता"
  const lbDisplayHi = getSchemeDisplaySummary(lbScheme, 'hi');
  assert.strictEqual(
    lbDisplayHi.title,
    'Mukhyamantri Ladli Behna Yojana',
    'Ladli Behna title in Hindi must preserve official name, not generic search keywords'
  );
  assert.strictEqual(lbDisplayHi.isTitleFallback, true, 'isTitleFallback must be true when preserving official name in Hindi');
  assert.notStrictEqual(lbDisplayHi.title, 'महिला सहायता', 'Must NEVER substitute generic keyword as scheme name');

  // Antyeshti Sahayata in Hindi must preserve official name, not generic search keyword "पेंशन"
  const antyeshti = getSchemeById('mp_antyeshti') as SchemeRecord;
  assert.ok(antyeshti, 'mp_antyeshti must exist');
  const antyeshtiDisplayHi = getSchemeDisplaySummary(antyeshti, 'hi');
  assert.strictEqual(antyeshtiDisplayHi.title, 'Antyeshti Sahayata Yojana');
  assert.strictEqual(antyeshtiDisplayHi.isTitleFallback, true);
  assert.notStrictEqual(antyeshtiDisplayHi.title, 'पेंशन');

  // Schemes with genuine recorded Devanagari aliases must display the authentic Hindi alias without fallback
  const gaonKiBeti = getSchemeById('mp_gaon_ki_beti') as SchemeRecord;
  assert.ok(gaonKiBeti, 'mp_gaon_ki_beti must exist');
  const gkbDisplayHi = getSchemeDisplaySummary(gaonKiBeti, 'hi');
  assert.strictEqual(gkbDisplayHi.title, 'गाँव की बेटी योजना');
  assert.strictEqual(gkbDisplayHi.isTitleFallback, false);
});

test('Review Quality: Citizen summaries are citizen-friendly and free of raw template artifacts', () => {
  const schemes = getAllSchemes();
  for (const s of schemes) {
    const cc = getCitizenContent(s.scheme_id);
    assert.ok(cc, `Missing citizen content for ${s.scheme_id}`);

    const enShort = cc.content_en?.short_summary?.[0]?.text;
    assert.ok(enShort, `Missing EN short summary for ${s.scheme_id}`);
    assert.ok(enShort.length >= 25, `Summary too short for ${s.scheme_id}: ${enShort}`);

    // Must not contain raw template residue
    assert.ok(
      !enShort.includes('. Intended audience noted in the scheme record'),
      `EN short summary for ${s.scheme_id} contains raw template residue`
    );

    // Hindi short summary must be valid Devanagari text
    const hiShort = cc.content_hi?.short_summary?.[0]?.text;
    assert.ok(hiShort, `Missing HI short summary for ${s.scheme_id}`);
    assert.ok(/[\u0900-\u097F]/.test(hiShort), `HI summary must contain Devanagari script for ${s.scheme_id}`);
  }

  // Explicit check for Antyeshti Sahayata: awkward research wording removed
  const antyeshtiCC = getCitizenContent('mp_antyeshti');
  const antyeshtiEn = antyeshtiCC?.content_en?.short_summary?.[0]?.text || '';
  assert.ok(
    !antyeshtiEn.includes('in a narrow case involving'),
    'Antyeshti Sahayata must remove awkward research wording "in a narrow case involving"'
  );

  // Explicit check for Ladli Behna: descriptive summary, not terse 4-word stub
  const lbCC = getCitizenContent('mp_ladli_behna');
  const lbEn = lbCC?.content_en?.short_summary?.[0]?.text || '';
  assert.ok(lbEn.length > 50, 'Ladli Behna summary must be descriptive and complete');
});

test('Review Quality: Application portal link validation and offline channel distinction', () => {
  // Verified schemes with direct online portal routes
  const verifiedIds = ['mp_ladli_behna', 'pm_kisan', 'mp_mmvy', 'pm_surya_ghar', 'csss_cus'];
  for (const id of verifiedIds) {
    const s = getSchemeById(id) as SchemeRecord;
    assert.ok(s, `Scheme ${id} must exist`);
    const portal = getVerifiedApplicationPortal(s);
    assert.ok(portal, `Scheme ${id} must have verified portal`);
    assert.ok(portal.url.startsWith('https://'), `Portal URL must start with https:// for ${id}`);
    assert.strictEqual(portal.isDirectPortal, true);
  }

  // Offline / general department homepage schemes must return null (hidden portal button)
  const offlineIds = ['mp_antyeshti', 'mp_kanya_vivah', 'mp_student_welfare_st', 'pmay_g', 'atal_pension'];
  for (const id of offlineIds) {
    const s = getSchemeById(id) as SchemeRecord;
    assert.ok(s, `Scheme ${id} must exist`);
    const portal = getVerifiedApplicationPortal(s);
    assert.strictEqual(
      portal,
      null,
      `Scheme ${id} should NOT have a direct application portal button (processed offline or via survey)`
    );
  }
});

test('Review Quality: Scope badge accuracy without blanket Gwalior claims', () => {
  const schemes = getAllSchemes();

  for (const s of schemes) {
    const enBadge = getSchemeScopeBadge(s, 'en');
    const hiBadge = getSchemeScopeBadge(s, 'hi');

    assert.ok(enBadge.label, `EN scope badge required for ${s.scheme_id}`);
    assert.ok(hiBadge.label, `HI scope badge required for ${s.scheme_id}`);

    // Dataset schemes have state or central level applicability, not a Gwalior carve-out
    assert.ok(
      !enBadge.label.includes('Gwalior'),
      `Scheme ${s.scheme_id} must not claim Gwalior-specific scope without dataset evidence`
    );

    if (s.scheme_level === 'state') {
      assert.strictEqual(enBadge.label, 'Madhya Pradesh State Scope');
      assert.strictEqual(hiBadge.label, 'मध्य प्रदेश शासन दायरा');
      assert.strictEqual(enBadge.variant, 'emerald');
    } else if (s.scheme_level === 'central_state') {
      assert.strictEqual(enBadge.label, 'Joint Implementation (MP & Centre)');
      assert.strictEqual(hiBadge.label, 'संयुक्त क्रियान्वयन (म.प्र. एवं केंद्र)');
      assert.strictEqual(enBadge.variant, 'purple');
    } else if (s.scheme_level === 'central') {
      assert.strictEqual(enBadge.label, 'National Central Scope');
      assert.strictEqual(hiBadge.label, 'अखिल भारतीय केंद्रीय दायरा');
      assert.strictEqual(enBadge.variant, 'blue');
    }
  }
});
