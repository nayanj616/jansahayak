import type {
  RagChunk,
  RagChunkDataset,
  RagChunkTopic,
  RetrievedChunk,
  CivicSourceMetadata,
  CivicRetrievalResult,
  CivicSufficiencyStatus,
  SchemeRecord,
} from '@/types/schemes';

import rawRagChunks from '@/research/schemes/codex-output/data/rag-chunks.json';
import {
  getAllSchemes,
  getSourceById,
  getAllSearchTerms,
} from './data';

// Static type-safe datasets
const ragDataset = rawRagChunks as unknown as RagChunkDataset;
const allChunks: RagChunk[] = ragDataset.chunks;

/**
 * Common bilingual transliterations mapping colloquial and Devanagari representations
 * to standard normalized tokens for deterministic matching.
 */
const BILINGUAL_TRANSLITERATIONS: Record<string, string> = {
  // Atal Pension transliterations (M-1)
  'अटल पेंशन': 'atal pension',
  'अटल': 'atal',

  // Common Devanagari scheme acronyms and abbreviations
  'एपीवाई': 'apy',
  'सीएसएसएस': 'csss',
  'मनरेगा': 'mgnrega',
  'नरेगा': 'nrega',
  'केसीसी': 'kcc',
  'पीएम-एसवाईएम': 'pm sym',
  'पीएम सिम': 'pm sym',
  'पीएम-यूएसपी': 'pm usp',
  'पीएमएवाई अर्बन': 'pmay urban',
  'पीएमएवाई': 'pmay',
  'पीएम-जेएवाई': 'pm jay',
  'पीएमजेडीवाई': 'pmjdy',
  'पीएमजेजेबीवाई': 'pmjjby',
  'पीएमएसबीवाई': 'pmsby',
  'पीएमईजीपी': 'pmegp',
  'पीएमएफबीवाई': 'pmfby',
  'पीएमयूवाई': 'pmuy',
  'एमएमवीवाई': 'mmvy',
  'एनएफबीएस': 'nfbs',
  'पीएम-केएमवाई': 'pm kmy',
  'पीएम': 'pm',
  'सीएम': 'cm',

  // Common Hindi scheme names and phrases
  'प्रधानमंत्री': 'pradhan mantri',
  'मुख्यमंत्री': 'mukhyamantri',
  'मातृ वंदना': 'matru vandana',
  'मातृत्व लाभ': 'maternity benefit',
  'किसान कल्याण': 'kisan kalyan',
  'किसान क्रेडिट कार्ड': 'kisan credit card',
  'किसान मानधन': 'kisan maandhan',
  'किसान': 'kisan',
  'फसल बीमा': 'fasal bima',
  'गाँव की बेटी': 'gaon ki beti',
  'गांव की बेटी': 'gaon ki beti',
  'लाड़ली बहना': 'ladli behna',
  'लाडली बहना': 'ladli behna',
  'लाड़ली लक्ष्मी': 'ladli laxmi',
  'लाडली लक्ष्मी': 'ladli laxmi',
  'कल्याणी सहायता': 'kalyani sahayata',
  'कल्याणी विवाह': 'kalyani vivah',
  'कन्या विवाह': 'kanya vivah',
  'कन्या अभिभावक': 'kanya abhibhavak',
  'निकाह योजना': 'nikah yojana',
  'निकाह': 'nikah',
  'मेधावी विद्यार्थी': 'medhavi vidyarthi',
  'प्रतिभा किरण': 'pratibha kiran',
  'उद्यम क्रांति': 'udyam kranti',
  'अंत्येष्टि सहायता': 'antyeshti sahayata',
  'अंत्येष्टि': 'antyeshti',
  'आयुष्मान भारत': 'ayushman bharat',
  'जन धन': 'jan dhan',
  'श्रम योगी': 'shram yogi',
  'सूर्य घर': 'surya ghar',
  'विश्वकर्मा': 'vishwakarma',
  'उज्ज्वला': 'ujjwala',
  'समग्र पेंशन': 'samagra pension',
  'समग्र': 'samagra',
  'विद्यालक्ष्मी': 'vidyalaxmi',
  'विद्यार्थी कल्याण': 'vidyarthi kalyan',
  'दिव्यांगजन': 'disability',
  'दिव्यांग': 'disability',
  'अविवाहिता': 'unmarried',

  // Common education terms
  'एसटी पोस्ट मैट्रिक': 'st post matric',
  'एसटी प्री मैट्रिक': 'st pre matric',
  'पोस्ट मैट्रिक': 'post matric',
  'प्री मैट्रिक': 'pre matric',
  'छात्रवृत्ति': 'scholarship',
  'एसटी': 'st',
  'एससी': 'sc',

  // Common housing & urban terms
  'शहरी आवास': 'urban housing',
  'ग्रामीण आवास': 'rural housing',
  'शहरी': 'urban',
  'ग्रामीण': 'rural',
  'आवास': 'awas',

  // Common agriculture & farming terms
  'कृषि': 'agriculture',
  'खेती': 'agriculture farming',
  'farmers': 'farmer',
  'farming': 'farmer',

  // Common Latin Romanized informal spellings
  'vishvakarma': 'vishwakarma',
  'fasal bima': 'fasal bima',
  'fasal beema': 'fasal bima',
  'ladli behna': 'ladli behna',
  'ladli laxmi': 'ladli laxmi',
  'ujjwala': 'ujjwala',
  'samagra': 'samagra',
  'vidyalaxmi': 'vidyalaxmi',
  'vidyalakshmi': 'vidyalaxmi',
  'kanya vivah': 'kanya vivah',
  'kalyani vivah': 'kalyani vivah',
  'kanya abhibhavak': 'kanya abhibhavak',
  'udyam kranti': 'udyam kranti',
  'antyeshti': 'antyeshti',
  'gaon ki beti': 'gaon ki beti',
  'pratibha kiran': 'pratibha kiran',
};

/**
 * Stopwords excluded from distinctive token boosting to prevent over-matching on generic words.
 * Expanded in Phase 4B.1 Correction Pass (H-1) to cover English function words, prepositions,
 * auxiliary verbs, and generic terms that cause false-positive alias matches.
 */
const COMMON_STOPWORDS = new Set([
  // English prepositions, conjunctions, and function words
  'a',
  'an',
  'the',
  'to',
  'for',
  'in',
  'at',
  'on',
  'of',
  'with',
  'by',
  'from',
  'about',
  'into',
  'through',
  'after',
  'before',
  'between',
  'under',
  'above',
  'and',
  'or',
  'but',
  'if',
  'as',
  'so',
  'than',
  'too',
  'very',
  'just',
  'not',
  'no',
  'any',
  'some',
  'all',

  // Auxiliary verbs & pronouns
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'can',
  'could',
  'will',
  'would',
  'shall',
  'should',
  'may',
  'might',
  'must',
  'do',
  'does',
  'did',
  'have',
  'has',
  'had',
  'how',
  'where',
  'what',
  'when',
  'why',
  'which',
  'who',
  'whom',
  'whose',
  'this',
  'that',
  'these',
  'those',
  'there',
  'here',
  'it',
  'its',
  'my',
  'your',
  'his',
  'her',
  'their',
  'our',
  'me',
  'you',
  'him',
  'us',
  'them',

  // Generic conversational and category words
  'make',
  'renew',
  'license',
  'driving',
  'home',
  'budget',
  'allocation',
  'give',
  'get',
  'take',
  'need',
  'tell',
  'know',
  'help',
  'loan',
  'credit',
  'card',

  // Hindi stopwords & generic scheme terms
  'yojana',
  'yojna',
  'scheme',
  'pradhan',
  'mantri',
  'mukhyamantri',
  'state',
  'central',
  'govt',
  'government',
  'madhya',
  'pradesh',
  'mp',
  'yojanaen',
  'aur',
  'mein',
  'kya',
  'hai',
  'hain',
  'kaise',
  'kaun',
  'wali',
  'wale',
  'wala',
  'chahiye',
  'ki',
  'ke',
  'ko',
  'se',
  'par',
  'bhi',
  'ek',
  'kare',
  'karein',
  'hoga',
  'hogi',
  'tha',
  'thi',
  'the',
  'apna',
  'apne',
  'apni',
  'kuch',
  'sab',
  'sabhi',
  'kisko',
  'kisse',
  'bataye',
  'batao',
  'diya',
  'diye',
]);

/**
 * Topic intent keywords mapping citizen queries to candidate RAG chunk topics.
 */
const TOPIC_INTENTS: Record<RagChunkTopic, string[]> = {
  benefits: [
    'benefit', 'benefits', 'amount', 'pension', 'scholarship', 'loan', 'subsidy', 'cover',
    'assistance', 'financial', 'how much', 'rate', 'payment', 'slab', 'stage',
    'सहायता', 'राशि', 'छात्रवृत्ति', 'लाभ', 'बीमा', 'पेंशन', 'अनुदान', 'कितना', 'कितनी',
    'मिलता', 'मिलती', 'मिलेगी', 'मिलेगा', 'भुगतान',
    'kitna', 'kitni', 'milta', 'milti', 'milega', 'milegi', 'sahayata', 'rashi', 'amount',
  ],
  eligibility: [
    'eligible', 'eligibility', 'age', 'qualification', 'criteria', 'condition', 'conditions',
    'limit', 'income', 'bpl', 'caste', 'who can', 'minimum age', 'maximum age', 'residence',
    'पात्रता', 'कौन', 'पात्र', 'उम्र', 'आयु', 'शर्त', 'नियम', 'सीमा', 'आय', 'योग्यता',
    'हकदार', 'किसे',
    'kaun', 'eligible', 'patra', 'umar', 'aayu', 'shart', 'yogyata', 'income limit',
  ],
  documents: [
    'document', 'documents', 'doc', 'docs', 'certificate', 'proof', 'aadhaar', 'id', 'card',
    'checklist', 'papers',
    'दस्तावेज़', 'दस्तावेज', 'प्रमाण', 'आधार', 'कार्ड', 'कागजात', 'चाहिए', 'प्रमाणपत्र',
    'dastavez', 'dastawez', 'kagaz', 'kagazaat',
  ],
  application: [
    'apply', 'application', 'portal', 'register', 'registration', 'enrol', 'enrollment',
    'process', 'steps', 'form', 'how to apply', 'where to apply', 'office',
    'नामांकन', 'आवेदन', 'प्रक्रिया', 'पोर्टल', 'खोलें', 'माँगूँ', 'फॉर्म', 'कहाँ', 'कैसे करें',
    'पंजीकरण',
    'apply kaise', 'kaise kare', 'kaise karein', 'portal', 'aavedan', 'namankan', 'kahan apply',
  ],
  deadlines: [
    'deadline', 'deadlines', 'last date', 'date', 'period', 'timing', 'open', 'when',
    'schedule', 'window', '2026', '2027', 'current',
    'तारीख', 'तिथि', 'अंतिम', 'अंतिम तिथि', 'खुला', 'कब', 'अवधि', 'समय',
    'tarikh', 'antim tithi', 'khula', 'kab', 'samay', 'deadline',
  ],
  status: [
    'status', 'track', 'tracking', 'check status', 'progress',
    'स्थिति', 'जाँच', 'ट्रैक',
    'status kaise', 'sthiti', 'track kaise',
  ],
  overview: [
    'what is', 'about', 'overview', 'summary', 'difference', 'compare', 'distinction',
    'ek hi scheme', 'purpose', 'objective',
    'क्या है', 'अंतर', 'विवरण', 'जानकारी', 'किसलिए', 'उद्देश्य',
    'kya hai', 'kisliye', 'antar', 'difference',
  ],
  selection: [
    'selection', 'approval', 'scrutiny', 'processing',
    'चयन', 'स्वीकृति', 'प्रक्रिया',
  ],
  conditions: [
    'rules', 'mandatory', 'exclusion', 'terms',
    'नियम', 'शर्तें', 'बहिष्कार',
  ],
};

/**
 * Normalizes query string for bilingual matching without destroying Hindi Devanagari text.
 */
export function normalizeCivicQuery(text: string): string {
  if (!text) return '';
  let normalized = text.toLowerCase().trim();

  // 1. Substitute bilingual transliterations safely
  for (const [key, replacement] of Object.entries(BILINGUAL_TRANSLITERATIONS)) {
    const lowerKey = key.toLowerCase();
    if (normalized.includes(lowerKey)) {
      normalized = normalized.split(lowerKey).join(` ${replacement} `);
    }
  }

  // 2. Normalize whitespace and remove non-word symbols while preserving Devanagari (\u0900-\u097F)
  normalized = normalized
    .replace(/[^\w\s\u0900-\u097F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized;
}

/**
 * Detects question topics from normalized text.
 */
export function detectQueryTopics(normalizedQuery: string): RagChunkTopic[] {
  const matchedTopics: RagChunkTopic[] = [];

  for (const [topic, keywords] of Object.entries(TOPIC_INTENTS) as [RagChunkTopic, string[]][]) {
    for (const kw of keywords) {
      const lowerKw = kw.toLowerCase();
      // Match whole word or exact substring
      if (
        normalizedQuery === lowerKw ||
        normalizedQuery.includes(` ${lowerKw} `) ||
        normalizedQuery.startsWith(`${lowerKw} `) ||
        normalizedQuery.endsWith(` ${lowerKw}`)
      ) {
        if (!matchedTopics.includes(topic)) {
          matchedTopics.push(topic);
        }
        break;
      }
    }
  }

  return matchedTopics.length > 0 ? matchedTopics : ['overview'];
}

const ALLOWED_SHORT_ACRONYMS = new Set([
  'st',
  'sc',
  'ug',
  'pg',
  'kcc',
  'apy',
  'bpl',
]);

/**
 * Scores a scheme candidate against the normalized query using deterministic transparent weights.
 */
function scoreSchemeCandidate(
  scheme: SchemeRecord,
  normalizedQuery: string,
  searchTermsMap: Map<string, string[]>
): number {
  let score = 0;
  const shortNorm = normalizeCivicQuery(scheme.short_name);
  const officialNorm = normalizeCivicQuery(scheme.official_name);
  const aliasesNorm = (scheme.aliases || []).map(normalizeCivicQuery);
  const searchTermsNorm = searchTermsMap.get(scheme.scheme_id) || [];
  const keywordsNorm = (scheme.assistant_keywords || []).map(normalizeCivicQuery);

  // Exact phrase match in short name (e.g. "KCC", "APY", "Ladli Behna", "PM-SYM")
  if (
    shortNorm.length > 2 &&
    (normalizedQuery === shortNorm ||
      normalizedQuery.split(' ').includes(shortNorm) ||
      (shortNorm.length >= 4 && normalizedQuery.includes(shortNorm)))
  ) {
    score += 55;
  }

  // Exact phrase match in official name
  if (officialNorm.length > 3 && normalizedQuery.includes(officialNorm)) {
    score += 65;
  }

  // Exact match in aliases
  for (const a of aliasesNorm) {
    if (
      (a.length > 2 || ALLOWED_SHORT_ACRONYMS.has(a)) &&
      (normalizedQuery === a ||
        normalizedQuery.split(' ').includes(a) ||
        (a.length >= 4 && normalizedQuery.includes(a)))
    ) {
      score += 45;
    }
  }

  // Exact match in search terms
  for (const st of searchTermsNorm) {
    if (st.length > 2 && normalizedQuery.includes(st)) {
      score += 20;
    }
  }

  // Exact match in assistant keywords
  for (const kw of keywordsNorm) {
    if (kw.length > 2 && normalizedQuery.includes(kw)) {
      score += 15;
    }
  }

  // Distinctive token match in short name or aliases
  const queryTokens = normalizedQuery.split(' ').filter((w) => w.length > 1);
  for (const token of queryTokens) {
    if (COMMON_STOPWORDS.has(token)) continue;
    if (token.length <= 2 && !ALLOWED_SHORT_ACRONYMS.has(token)) continue;

    // Direct token in short name
    if (shortNorm.split(' ').includes(token)) {
      score += 25;
    }
    // Direct token in alias
    if (aliasesNorm.some((a) => a.split(' ').includes(token))) {
      score += 20;
    }
    // Direct token in official name
    if (officialNorm.split(' ').includes(token)) {
      score += 10;
    }
  }

  // Contextual cross-scheme signals (e.g. "city house" or "urban" with PMAY)
  if (
    scheme.scheme_id === 'pmay_u2' &&
    (normalizedQuery.includes('city house') ||
      normalizedQuery.includes('urban house') ||
      normalizedQuery.includes('urban') ||
      normalizedQuery.includes('city'))
  ) {
    score += 30;
  }

  // Contextual agricultural credit & crop loan signals for Kisan Credit Card (KCC)
  if (scheme.scheme_id === 'kisan_credit_card') {
    const hasAgriTerm =
      normalizedQuery.includes('farmer') ||
      normalizedQuery.includes('kisan') ||
      normalizedQuery.includes('crop') ||
      normalizedQuery.includes('agriculture') ||
      normalizedQuery.includes('cultivation');

    const hasCreditTerm =
      normalizedQuery.includes('loan') ||
      normalizedQuery.includes('credit');

    if (hasAgriTerm && hasCreditTerm) {
      score += 45;
    }
  }

  return score;
}

/**
 * Checks if a scheme record has known unestablished/null fields matching the requested topics.
 * Missing fields unrelated to the citizen's requested topics do not make the result partial.
 */
function checkFieldUnestablished(
  scheme: SchemeRecord,
  topics: RagChunkTopic[],
  normalizedQuery: string
): string[] {
  const gaps: string[] = [];

  if (topics.includes('deadlines')) {
    if (!scheme.deadlines && !scheme.application_period) {
      gaps.push(`${scheme.scheme_id}.deadlines`);
      gaps.push(`${scheme.scheme_id}.application_period`);
    }
  }

  if (topics.includes('eligibility')) {
    // Check if the citizen specifically inquired about age criteria
    const asksAboutAge =
      normalizedQuery.includes('age') ||
      normalizedQuery.includes('umar') ||
      normalizedQuery.includes('aayu') ||
      normalizedQuery.includes('उम्र') ||
      normalizedQuery.includes('आयु');

    if (asksAboutAge && scheme.age_min === null && scheme.age_max === null) {
      gaps.push(`${scheme.scheme_id}.age_min`);
      gaps.push(`${scheme.scheme_id}.age_max`);
    }

    // Check if the citizen specifically inquired about income limits
    const asksAboutIncome =
      normalizedQuery.includes('income') ||
      normalizedQuery.includes('aay') ||
      normalizedQuery.includes('आय');

    if (asksAboutIncome && scheme.income_limit === null) {
      gaps.push(`${scheme.scheme_id}.income_limit`);
    }
  }

  if (topics.includes('documents')) {
    if (
      (!scheme.mandatory_documents || scheme.mandatory_documents.length === 0) &&
      !scheme.document_notes
    ) {
      gaps.push(`${scheme.scheme_id}.mandatory_documents`);
    }
  }

  if (topics.includes('status')) {
    if (!scheme.how_to_check_status) {
      gaps.push(`${scheme.scheme_id}.how_to_check_status`);
    }
  }

  return gaps;
}

export interface RetrievalOptions {
  maxChunks?: number;
  minScoreThreshold?: number;
}

/**
 * Deterministic, source-grounded retrieval layer for Civic Assistant.
 * Fully testable offline without Gemini credentials.
 */
export function retrieveCivicEvidence(
  query: string,
  options: RetrievalOptions = {}
): CivicRetrievalResult {
  const { maxChunks = 4, minScoreThreshold = 15 } = options;

  const rawQuery = (query || '').trim();
  if (!rawQuery) {
    return {
      query: rawQuery,
      normalizedQuery: '',
      detectedTopics: ['overview'],
      matchedSchemeIds: [],
      chunks: [],
      sources: [],
      isSufficient: false,
      sufficiencyStatus: 'insufficient',
      supportedTopics: [],
      unsupportedTopics: ['overview'],
      uncertaintyReason: 'Empty query provided',
    };
  }

  const normalizedQuery = normalizeCivicQuery(rawQuery);
  const detectedTopics = detectQueryTopics(normalizedQuery);

  const allSchemes = getAllSchemes();
  const allSearchTermsList = getAllSearchTerms();

  // Fast map of normalized search terms per scheme
  const searchTermsMap = new Map<string, string[]>();
  for (const item of allSearchTermsList) {
    searchTermsMap.set(
      item.scheme_id,
      (item.search_terms || []).map(normalizeCivicQuery)
    );
  }

  // 1. Score all schemes
  const scoredSchemes = allSchemes
    .map((scheme) => ({
      scheme,
      score: scoreSchemeCandidate(scheme, normalizedQuery, searchTermsMap),
    }))
    .filter((s) => s.score >= minScoreThreshold)
    .sort((a, b) => b.score - a.score);

  if (scoredSchemes.length === 0) {
    return {
      query: rawQuery,
      normalizedQuery,
      detectedTopics,
      matchedSchemeIds: [],
      chunks: [],
      sources: [],
      isSufficient: false,
      sufficiencyStatus: 'insufficient',
      supportedTopics: [],
      unsupportedTopics: detectedTopics,
      uncertaintyReason:
        'No matching government scheme records were retrieved from the verified 50-scheme dataset.',
    };
  }

  // 2. Select top candidate schemes (support multiple schemes for comparative queries)
  const topScore = scoredSchemes[0].score;
  const targetSchemes = scoredSchemes
    .filter((s) => s.score >= Math.max(minScoreThreshold, topScore * 0.4))
    .slice(0, 3);

  const matchedSchemeIds = targetSchemes.map((s) => s.scheme.scheme_id);

  // 3. Find candidate chunks for the matched schemes
  const candidateChunks = allChunks.filter((chunk) =>
    matchedSchemeIds.includes(chunk.scheme_id)
  );

  // 4. Score chunks based on topic intent, lexical overlap, and scheme priority
  const queryTokens = normalizedQuery.split(' ').filter((w) => w.length > 2);
  const schemePriorityMap = new Map<string, number>();
  targetSchemes.forEach((s, idx) => {
    schemePriorityMap.set(s.scheme.scheme_id, (targetSchemes.length - idx) * 15);
  });

  const scoredChunks = candidateChunks.map((chunk) => {
    let chunkScore = schemePriorityMap.get(chunk.scheme_id) || 0;

    // Topic alignment boost
    if (detectedTopics.includes(chunk.topic)) {
      chunkScore += 40;
    }

    // Lexical match between chunk text and query
    const chunkTokens = normalizeCivicQuery(chunk.text).split(' ');
    for (const qt of queryTokens) {
      if (chunkTokens.includes(qt)) {
        chunkScore += 4;
      }
    }

    return { chunk, score: chunkScore };
  });

  scoredChunks.sort((a, b) => b.score - a.score);

  // 5. Select bounded unique chunks
  const selectedChunksMap = new Map<string, RagChunk>();
  for (const sc of scoredChunks) {
    if (selectedChunksMap.size >= maxChunks) break;
    if (!selectedChunksMap.has(sc.chunk.chunk_id)) {
      selectedChunksMap.set(sc.chunk.chunk_id, sc.chunk);
    }
  }

  // 6. Map chunks to RetrievedChunk with scheme display names
  const schemesById = new Map<string, SchemeRecord>();
  for (const s of allSchemes) {
    schemesById.set(s.scheme_id, s);
  }

  const retrievedChunks: RetrievedChunk[] = Array.from(selectedChunksMap.values()).map(
    (chunk) => {
      const scheme = schemesById.get(chunk.scheme_id);
      return {
        chunkId: chunk.chunk_id,
        schemeId: chunk.scheme_id,
        schemeOfficialName: scheme?.official_name || chunk.scheme_id,
        schemeShortName: scheme?.short_name || chunk.scheme_id,
        topic: chunk.topic,
        text: chunk.text,
        sourceIds: chunk.source_ids || [],
        evidenceRefs: chunk.evidence_refs || [],
      };
    }
  );

  // 7. Resolve official sources and extract provenance metadata
  const sourceMetadataMap = new Map<string, CivicSourceMetadata>();
  for (const chunk of retrievedChunks) {
    for (const ref of chunk.evidenceRefs) {
      if (!ref.source_id) continue;
      const existing = sourceMetadataMap.get(ref.source_id);
      const locators = existing?.locators || [];
      const summaries = existing?.evidenceSummaries || [];

      if (ref.locator && !locators.includes(ref.locator)) {
        locators.push(ref.locator);
      }
      if (ref.evidence_summary && !summaries.includes(ref.evidence_summary)) {
        summaries.push(ref.evidence_summary);
      }

      const officialSource = getSourceById(ref.source_id);

      sourceMetadataMap.set(ref.source_id, {
        sourceId: ref.source_id,
        title: officialSource?.title || ref.source_authority || ref.source_id,
        issuingAuthority:
          officialSource?.issuing_authority || ref.source_authority || 'Government of India / Madhya Pradesh',
        url: officialSource?.url || ref.url || '',
        sourceType: officialSource?.source_type || ref.source_type || 'official_government_primary',
        checkedDate: officialSource?.checked_date,
        scopeNote: officialSource?.scope_note,
        locators,
        evidenceSummaries: summaries,
      });
    }

    // Also handle chunks that list source_ids without direct evidence_refs
    for (const sid of chunk.sourceIds) {
      if (!sourceMetadataMap.has(sid)) {
        const officialSource = getSourceById(sid);
        if (officialSource) {
          sourceMetadataMap.set(sid, {
            sourceId: sid,
            title: officialSource.title,
            issuingAuthority: officialSource.issuing_authority,
            url: officialSource.url,
            sourceType: officialSource.source_type,
            checkedDate: officialSource.checked_date,
            scopeNote: officialSource.scope_note,
            locators: [],
            evidenceSummaries: [],
          });
        }
      }
    }
  }

  // 8. Sufficiency and Gap Analysis
  const unestablishedFields: string[] = [];
  for (const s of targetSchemes) {
    const gaps = checkFieldUnestablished(s.scheme, detectedTopics, normalizedQuery);
    unestablishedFields.push(...gaps);
  }

  // Determine supported vs unsupported topics
  const supportedTopics: RagChunkTopic[] = [];
  const unsupportedTopics: RagChunkTopic[] = [];

  for (const topic of detectedTopics) {
    const hasChunk = retrievedChunks.some(
      (c) => c.topic === topic || (topic === 'overview' && retrievedChunks.length > 0)
    );
    const topicGaps = targetSchemes.flatMap((s) =>
      checkFieldUnestablished(s.scheme, [topic], normalizedQuery)
    );

    if (hasChunk && topicGaps.length === 0) {
      supportedTopics.push(topic);
    } else {
      unsupportedTopics.push(topic);
    }
  }

  let sufficiencyStatus: CivicSufficiencyStatus;
  if (retrievedChunks.length === 0 || supportedTopics.length === 0) {
    sufficiencyStatus = 'insufficient';
  } else if (unsupportedTopics.length > 0 || unestablishedFields.length > 0) {
    sufficiencyStatus = 'partial';
  } else {
    sufficiencyStatus = 'sufficient';
  }

  const isSufficient = sufficiencyStatus === 'sufficient';

  let uncertaintyReason: string | undefined;
  if (sufficiencyStatus === 'insufficient') {
    uncertaintyReason =
      retrievedChunks.length === 0
        ? 'No matching government scheme records were retrieved from the verified 50-scheme dataset.'
        : `No verified evidence was found for requested topic(s): ${unsupportedTopics.join(', ')}.`;
  } else if (sufficiencyStatus === 'partial') {
    uncertaintyReason = `Verified evidence was found for ${supportedTopics.join(', ')}, but information for ${unsupportedTopics.join(', ')}${
      unestablishedFields.length > 0 ? ` (${unestablishedFields.join(', ')})` : ''
    } is unestablished in the dataset.`;
  }

  return {
    query: rawQuery,
    normalizedQuery,
    detectedTopics,
    matchedSchemeIds,
    chunks: retrievedChunks,
    sources: Array.from(sourceMetadataMap.values()),
    isSufficient,
    sufficiencyStatus,
    supportedTopics,
    unsupportedTopics: unsupportedTopics.length > 0 ? unsupportedTopics : undefined,
    unestablishedFields: unestablishedFields.length > 0 ? unestablishedFields : undefined,
    uncertaintyReason,
  };
}
