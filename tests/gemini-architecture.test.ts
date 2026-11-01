import test from 'node:test';
import assert from 'node:assert';
import {
  getChatbotClient,
  getVisionClient,
  getChatbotModel,
  getVisionModel,
  isChatbotConfigured,
  isVisionConfigured,
  resetGeminiClients,
  DEFAULT_GEMINI_CHATBOT_MODEL,
  DEFAULT_GEMINI_VISION_MODEL,
} from '@/lib/gemini/client';
import {
  getGeminiClient,
  getGeminiStatus,
  answerCivicQuestion,
  analyzeCleanliness,
} from '@/lib/gemini/service';

// Capture and restore process.env to guarantee complete test isolation
const ORIGINAL_ENV = { ...process.env };

function restoreEnv() {
  process.env = { ...ORIGINAL_ENV };
  resetGeminiClients();
}

// ============================================================================
// 1. KEY ISOLATION & INDEPENDENT FAILURE TESTS
// ============================================================================

test('Gemini Architecture: Chatbot client fails when its own key is missing, even if vision key exists', () => {
  restoreEnv();
  delete process.env.GEMINI_CHATBOT_API_KEY;
  process.env.GEMINI_VISION_API_KEY = 'test-vision-key-only';

  // Chatbot must fail
  assert.throws(
    () => getChatbotClient(),
    (err: Error) => {
      assert.ok(err.message.includes('GEMINI_CHATBOT_API_KEY is not configured'));
      // Never fall back to or mention vision key in chatbot error
      assert.ok(!err.message.includes('test-vision-key-only'));
      assert.ok(!err.message.includes('GEMINI_VISION_API_KEY'));
      return true;
    }
  );

  // Vision client must succeed with its own key
  const visionClient = getVisionClient();
  assert.ok(visionClient);
  restoreEnv();
});

test('Gemini Architecture: Vision client fails when its own key is missing, even if chatbot key exists', () => {
  restoreEnv();
  process.env.GEMINI_CHATBOT_API_KEY = 'test-chatbot-key-only';
  delete process.env.GEMINI_VISION_API_KEY;

  // Vision must fail
  assert.throws(
    () => getVisionClient(),
    (err: Error) => {
      assert.ok(err.message.includes('GEMINI_VISION_API_KEY is not configured'));
      // Never fall back to or mention chatbot key in vision error
      assert.ok(!err.message.includes('test-chatbot-key-only'));
      assert.ok(!err.message.includes('GEMINI_CHATBOT_API_KEY'));
      return true;
    }
  );

  // Chatbot client must succeed with its own key
  const chatbotClient = getChatbotClient();
  assert.ok(chatbotClient);
  restoreEnv();
});

test('Gemini Architecture: Both clients can be constructed via dependency injection options', () => {
  restoreEnv();
  delete process.env.GEMINI_CHATBOT_API_KEY;
  delete process.env.GEMINI_VISION_API_KEY;

  const clientA = getChatbotClient({ apiKey: 'custom-injection-key-a' });
  const clientB = getVisionClient({ apiKey: 'custom-injection-key-b' });

  assert.ok(clientA);
  assert.ok(clientB);
  assert.notStrictEqual(clientA, clientB, 'Clients must be distinct instances');
  restoreEnv();
});

test('Gemini Architecture: Dependency injection options cannot contaminate or replace production singleton clients', () => {
  restoreEnv();
  process.env.GEMINI_CHATBOT_API_KEY = 'production-chatbot-key';
  process.env.GEMINI_VISION_API_KEY = 'production-vision-key';

  const prodChatbot = getChatbotClient();
  const prodVision = getVisionClient();

  // Call with injected custom options
  const customChatbot = getChatbotClient({ apiKey: 'custom-injection-key-a' });
  const customVision = getVisionClient({ apiKey: 'custom-injection-key-b' });

  assert.notStrictEqual(customChatbot, prodChatbot, 'Injected client must not equal production singleton');
  assert.notStrictEqual(customVision, prodVision, 'Injected client must not equal production singleton');

  // Verify production singletons remain intact and uncontaminated
  const prodChatbotAgain = getChatbotClient();
  const prodVisionAgain = getVisionClient();
  assert.strictEqual(prodChatbotAgain, prodChatbot, 'Production singleton must not be replaced');
  assert.strictEqual(prodVisionAgain, prodVision, 'Production singleton must not be replaced');

  restoreEnv();
});

// ============================================================================
// 2. INSTANCE DISTINCTNESS & SINGLETON MEMOIZATION
// ============================================================================

test('Gemini Architecture: Chatbot and Vision clients are distinct instances', () => {
  restoreEnv();
  process.env.GEMINI_CHATBOT_API_KEY = 'valid-test-chatbot-key';
  process.env.GEMINI_VISION_API_KEY = 'valid-test-vision-key';

  const chatbotClient = getChatbotClient();
  const visionClient = getVisionClient();

  assert.ok(chatbotClient);
  assert.ok(visionClient);
  assert.notStrictEqual(chatbotClient, visionClient, 'Chatbot and Vision clients must be distinct instances');

  // Verify memoization
  const chatbotClient2 = getChatbotClient();
  assert.strictEqual(chatbotClient, chatbotClient2, 'Same client must be returned within memoized session');

  restoreEnv();
});

// ============================================================================
// 3. INDEPENDENT MODEL CONFIGURATION
// ============================================================================

test('Gemini Architecture: Each model getter returns its own configured model or approved default', () => {
  restoreEnv();
  delete process.env.GEMINI_CHATBOT_MODEL;
  delete process.env.GEMINI_VISION_MODEL;

  // Defaults
  assert.strictEqual(getChatbotModel(), DEFAULT_GEMINI_CHATBOT_MODEL);
  assert.strictEqual(getVisionModel(), DEFAULT_GEMINI_VISION_MODEL);

  // Custom environment models
  process.env.GEMINI_CHATBOT_MODEL = 'gemini-3.5-flash-lite';
  process.env.GEMINI_VISION_MODEL = 'gemini-3.8-flash';

  assert.strictEqual(getChatbotModel(), 'gemini-3.5-flash-lite');
  assert.strictEqual(getVisionModel(), 'gemini-3.8-flash');
  assert.notStrictEqual(getChatbotModel(), getVisionModel());

  restoreEnv();
});

// ============================================================================
// 4. INDEPENDENT STATUS REPORTING & REDACTION OF CREDENTIALS
// ============================================================================

test('Gemini Architecture: Configuration status reports independently without leaking credentials', () => {
  restoreEnv();
  const secretChatbotKey = 'AIzaSyTopSecretChatbotKeyValue123';
  process.env.GEMINI_CHATBOT_API_KEY = secretChatbotKey;
  delete process.env.GEMINI_VISION_API_KEY;

  assert.strictEqual(isChatbotConfigured(), true);
  assert.strictEqual(isVisionConfigured(), false);

  const status = getGeminiStatus();
  assert.strictEqual(status.chatbot.isConfigured, true);
  assert.strictEqual(status.vision.isConfigured, false);

  // Crucial Security Check: Confirm secret key is NEVER included in status response
  const serialized = JSON.stringify(status);
  assert.ok(!serialized.includes(secretChatbotKey), 'Status must never leak secret API key values');
  assert.ok(!serialized.includes('AIzaSy'), 'Status must never contain key prefix');

  restoreEnv();
});

test('Gemini Architecture: Placeholder values are treated as unconfigured', () => {
  restoreEnv();
  process.env.GEMINI_CHATBOT_API_KEY = 'placeholder_key_not_set';
  process.env.GEMINI_VISION_API_KEY = 'placeholder_key_not_set';

  assert.strictEqual(isChatbotConfigured(), false);
  assert.strictEqual(isVisionConfigured(), false);

  assert.throws(() => getChatbotClient(), /GEMINI_CHATBOT_API_KEY is not configured/);
  assert.throws(() => getVisionClient(), /GEMINI_VISION_API_KEY is not configured/);

  restoreEnv();
});

// ============================================================================
// 5. BACKWARD COMPATIBILITY
// ============================================================================

test('Gemini Architecture: Legacy getGeminiClient maps directly to getChatbotClient', () => {
  restoreEnv();
  process.env.GEMINI_CHATBOT_API_KEY = 'valid-test-chatbot-key';
  process.env.GEMINI_VISION_API_KEY = 'valid-test-vision-key';

  const legacyClient = getGeminiClient();
  const chatbotClient = getChatbotClient();

  assert.strictEqual(legacyClient, chatbotClient, 'Legacy client must map to chatbot client');
  restoreEnv();
});

// ============================================================================
// 6. MODULE BOUNDARY ENFORCEMENT (PLACEHOLDER PROTECTION)
// ============================================================================

test('Gemini Architecture: answerCivicQuestion rejects unconfigured chatbot key without falling back to vision key', async () => {
  restoreEnv();
  delete process.env.GEMINI_CHATBOT_API_KEY;
  process.env.GEMINI_VISION_API_KEY = 'valid-test-vision-key';

  await assert.rejects(
    async () => {
      await answerCivicQuestion('How to apply for Ladli Behna?');
    },
    (err: Error) => {
      assert.ok(err.message.includes('GEMINI_CHATBOT_API_KEY is not configured'));
      assert.ok(!err.message.includes('GEMINI_VISION_API_KEY'));
      return true;
    }
  );
  restoreEnv();
});

test('Gemini Architecture: answerCivicQuestion executes source-grounded answering with mock client', async () => {
  restoreEnv();
  const mockClient = {
    models: {
      generateContent: async () => ({
        text: 'To apply for Ladli Behna, submit the prescribed form at the designated local camp or gram panchayat.',
      }),
    },
  } as unknown as Parameters<typeof answerCivicQuestion>[2] extends { client?: infer C } ? C : never;

  const result = await answerCivicQuestion('How to apply for Ladli Behna?', undefined, {
    client: mockClient,
  });

  assert.ok(result.answer.includes('Ladli Behna'));
  assert.ok(result.relevantSchemes.includes('mp_ladli_behna'));
  assert.ok(result.sources.length > 0);
  assert.ok(result.sourceReferences && result.sourceReferences.length > 0);
  assert.strictEqual(typeof result.disclaimer, 'string');
  restoreEnv();
});

test('Gemini Architecture: analyzeCleanliness rejects unconfigured vision key without falling back to chatbot key', async () => {
  restoreEnv();
  delete process.env.GEMINI_VISION_API_KEY;
  process.env.GEMINI_CHATBOT_API_KEY = 'valid-test-chatbot-key';

  await assert.rejects(
    async () => {
      await analyzeCleanliness(Buffer.from('fake-before'), Buffer.from('fake-after'));
    },
    (err: Error) => {
      assert.ok(err.message.includes('GEMINI_VISION_API_KEY is not configured'));
      assert.ok(!err.message.includes('GEMINI_CHATBOT_API_KEY'));
      return true;
    }
  );
  restoreEnv();
});

test('Gemini Architecture: analyzeCleanliness executes multimodal comparative analysis with mock client', async () => {
  restoreEnv();
  const mockValidJson = JSON.stringify({
    beforeObservations: {
      wasteIdentified: ['plastic bags', 'dry leaves'],
      approximateSpread: 'along curb',
      obstructionsOrHazards: [],
    },
    afterObservations: {
      visibleSurfaces: ['swept concrete curb'],
      remainingDebris: [],
      cleanlinessApparent: true,
    },
    comparativeFindings: {
      primaryWasteRemoved: true,
      siteConsistent: true,
      changesObserved: ['Pavement swept clear'],
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
      wasteReductionEstimate: 90,
      estimateRationale: 'Primary surface accumulation cleared',
    },
    officerSummary: 'Cleanup appears complete with no residual waste observed.',
    disclaimer: 'Advisory only. Officer evaluation remains authoritative.',
  });

  const mockClient = {
    models: {
      generateContent: async () => ({
        text: mockValidJson,
      }),
    },
  } as unknown as Parameters<typeof analyzeCleanliness>[2] extends { client?: infer C } ? C : never;

  const result = await analyzeCleanliness(
    Buffer.from('fake-before-bytes'),
    Buffer.from('fake-after-bytes'),
    { client: mockClient }
  );

  assert.strictEqual(result.metrics.evaluation.confidenceLevel, 'high');
  assert.strictEqual(result.metrics.evaluation.wasteReductionEstimate, 90);
  assert.ok(result.metrics.comparativeFindings.primaryWasteRemoved);
  assert.ok(result.metrics.officerSummary.includes('Cleanup appears complete'));
  restoreEnv();
});

