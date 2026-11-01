import test from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server';
import {
  analyzeCleanliness,
  visionVerificationMetricsSchema,
  VISION_PROMPT_VERSION,
  SUPPORTED_VISION_MIME_TYPES,
} from '@/lib/gemini/vision';
import { resetGeminiClients } from '@/lib/gemini/client';
import { POST as verifyRouteHandler } from '@/app/api/complaints/[id]/verify/route';
import { createDemoToken, DEMO_PROFILES, DEMO_COOKIE_NAME } from '@/lib/auth/tokens';

const ORIGINAL_ENV = { ...process.env };

function restoreEnv() {
  process.env = { ...ORIGINAL_ENV };
  resetGeminiClients();
}

async function createAuthRequest(
  role: 'citizen' | 'worker' | 'officer',
  url: string,
  body?: Record<string, unknown>
): Promise<NextRequest> {
  const token = await createDemoToken(DEMO_PROFILES[role]);
  const headers = new Headers();
  headers.set('cookie', `${DEMO_COOKIE_NAME}=${token}`);
  if (body) {
    headers.set('content-type', 'application/json');
    return new NextRequest(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  }
  return new NextRequest(url, { method: 'POST', headers });
}

function createUnauthRequest(url: string, body?: Record<string, unknown>): NextRequest {
  const headers = new Headers();
  if (body) {
    headers.set('content-type', 'application/json');
    return new NextRequest(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  }
  return new NextRequest(url, { method: 'POST', headers });
}

// Sample valid mock vision model JSON response
const sampleValidMetrics = {
  beforeObservations: {
    wasteIdentified: ['overflowing municipal waste pile', 'plastic packaging', 'cardboard'],
    approximateSpread: 'covering 3 meters along the roadside gutter',
    obstructionsOrHazards: ['drainage channel entrance blocked'],
  },
  afterObservations: {
    visibleSurfaces: ['swept asphalt', 'cleared concrete drain grating'],
    remainingDebris: ['minor surface staining on curb'],
    cleanlinessApparent: true,
  },
  comparativeFindings: {
    primaryWasteRemoved: true,
    siteConsistent: true,
    changesObserved: [
      'The prominent refuse heap seen in photo 1 has been removed.',
      'Street surface has been swept clean.',
    ],
  },
  comparisonLimitations: {
    angleMismatched: false,
    lightingMismatched: false,
    occlusionPresent: false,
    limitationNotes: [],
  },
  evaluation: {
    confidenceLevel: 'high' as const,
    isComparisonReliable: true,
    wasteReductionEstimate: 95,
    estimateRationale: 'Primary accumulation completely removed; only minor surface stain remains.',
  },
  officerSummary:
    'Visual evidence indicates substantial removal of the reported waste pile. The pavement and drainage opening appear swept and unobstructed.',
  disclaimer:
    'JanSahayak AI Vision is an academic demonstration advisory tool. Observations do not constitute official municipal certification. Human officer evaluation remains authoritative.',
};

// ============================================================================
// 1. VISION SERVICE & OBSERVATIONAL CONTRACT TESTS
// ============================================================================

test('Vision Service: validates and parses structured visual metrics schema', () => {
  const parsed = visionVerificationMetricsSchema.parse(sampleValidMetrics);
  assert.strictEqual(parsed.evaluation.confidenceLevel, 'high');
  assert.strictEqual(parsed.evaluation.wasteReductionEstimate, 95);
  assert.strictEqual(parsed.comparativeFindings.primaryWasteRemoved, true);
  assert.ok(parsed.beforeObservations.wasteIdentified.length > 0);
  assert.ok(parsed.officerSummary.length > 0);
});

test('Vision Service: executes analyzeCleanliness successfully with mock client', async () => {
  restoreEnv();
  const mockClient = {
    models: {
      generateContent: async () => ({
        text: JSON.stringify(sampleValidMetrics),
      }),
    },
  } as unknown as Parameters<typeof analyzeCleanliness>[2] extends { client?: infer C } ? C : never;

  const result = await analyzeCleanliness(
    Buffer.from('fake-before-bytes'),
    Buffer.from('fake-after-bytes'),
    { client: mockClient }
  );

  assert.strictEqual(result.modelVersion, VISION_PROMPT_VERSION);
  assert.strictEqual(result.metrics.evaluation.confidenceLevel, 'high');
  assert.strictEqual(result.metrics.evaluation.wasteReductionEstimate, 95);
  assert.strictEqual(result.metrics.evaluation.isComparisonReliable, true);
  restoreEnv();
});

test('Vision Service: handles inconclusive comparison and null reduction estimate', async () => {
  restoreEnv();
  const inconclusiveMetrics = {
    ...sampleValidMetrics,
    comparisonLimitations: {
      angleMismatched: true,
      lightingMismatched: true,
      occlusionPresent: false,
      limitationNotes: ['Camera perspective in photo 2 differs significantly from photo 1.'],
    },
    evaluation: {
      confidenceLevel: 'inconclusive' as const,
      isComparisonReliable: false,
      wasteReductionEstimate: null,
      estimateRationale: 'Differing camera angles prevent reliable comparative area estimation.',
    },
    comparativeFindings: {
      primaryWasteRemoved: null,
      siteConsistent: false,
      changesObserved: ['Landmarks in photo 2 do not clearly correlate with photo 1.'],
    },
    officerSummary:
      'Inconclusive comparison: Photos appear to be taken from different angles or locations. Field inspection recommended.',
  };

  const parsed = visionVerificationMetricsSchema.parse(inconclusiveMetrics);
  assert.strictEqual(parsed.evaluation.confidenceLevel, 'inconclusive');
  assert.strictEqual(parsed.evaluation.isComparisonReliable, false);
  assert.strictEqual(parsed.evaluation.wasteReductionEstimate, null);
  assert.strictEqual(parsed.comparisonLimitations.angleMismatched, true);
});

test('Vision Service: rejects malformed JSON returned from Gemini model', async () => {
  restoreEnv();
  const mockClient = {
    models: {
      generateContent: async () => ({
        text: 'This is not JSON at all: error 500 occurred',
      }),
    },
  } as unknown as Parameters<typeof analyzeCleanliness>[2] extends { client?: infer C } ? C : never;

  await assert.rejects(
    async () => {
      await analyzeCleanliness(Buffer.from('before'), Buffer.from('after'), { client: mockClient });
    },
    (err: Error) => {
      assert.ok(err.message.includes('Malformed JSON received from vision model'));
      return true;
    }
  );
  restoreEnv();
});

test('Vision Service: rejects model response missing mandatory officerSummary field', async () => {
  restoreEnv();
  const invalidMetrics = { ...sampleValidMetrics, officerSummary: '' };

  const mockClient = {
    models: {
      generateContent: async () => ({
        text: JSON.stringify(invalidMetrics),
      }),
    },
  } as unknown as Parameters<typeof analyzeCleanliness>[2] extends { client?: infer C } ? C : never;

  await assert.rejects(
    async () => {
      await analyzeCleanliness(Buffer.from('before'), Buffer.from('after'), { client: mockClient });
    },
    (err: Error) => {
      assert.ok(err.message.includes('Output validation failed'));
      return true;
    }
  );
  restoreEnv();
});

test('Vision Service: rejects out-of-range waste reduction estimate (> 100 or < 0)', () => {
  const over100 = {
    ...sampleValidMetrics,
    evaluation: { ...sampleValidMetrics.evaluation, wasteReductionEstimate: 125 },
  };
  assert.throws(() => visionVerificationMetricsSchema.parse(over100), /Waste reduction estimate/);

  const under0 = {
    ...sampleValidMetrics,
    evaluation: { ...sampleValidMetrics.evaluation, wasteReductionEstimate: -10 },
  };
  assert.throws(() => visionVerificationMetricsSchema.parse(under0), /Waste reduction estimate/);
});

test('Vision Service: rejects inconsistent high confidence when comparison is marked unreliable', () => {
  const inconsistent = {
    ...sampleValidMetrics,
    evaluation: {
      ...sampleValidMetrics.evaluation,
      confidenceLevel: 'high' as const,
      isComparisonReliable: false,
    },
  };
  assert.throws(() => visionVerificationMetricsSchema.parse(inconsistent), /Evaluation cannot claim high confidence/);
});

test('Vision Service: rejects unsupported MIME type input', async () => {
  restoreEnv();
  await assert.rejects(
    async () => {
      await analyzeCleanliness(
        { buffer: Buffer.from('fake-gif'), mimeType: 'image/gif' },
        { buffer: Buffer.from('fake-jpeg'), mimeType: 'image/jpeg' }
      );
    },
    (err: Error) => {
      assert.ok(err.message.includes('Unsupported MIME type'));
      return true;
    }
  );
  restoreEnv();
});

test('Vision Service: rejects empty image buffer', async () => {
  restoreEnv();
  await assert.rejects(
    async () => {
      await analyzeCleanliness(
        { buffer: Buffer.alloc(0), mimeType: 'image/jpeg' },
        { buffer: Buffer.from('fake-jpeg'), mimeType: 'image/jpeg' }
      );
    },
    (err: Error) => {
      assert.ok(err.message.includes('buffer cannot be empty'));
      return true;
    }
  );
  restoreEnv();
});

test('Vision Service: sanitizes provider errors without leaking API keys or credentials', async () => {
  restoreEnv();
  const secretKey = 'AIzaSyTopSecretKeyThatMustNotLeak';
  const mockFailingClient = {
    models: {
      generateContent: async () => {
        throw new Error(`Google API Call Failed with internal key: ${secretKey} at endpoint /v1beta`);
      },
    },
  } as unknown as Parameters<typeof analyzeCleanliness>[2] extends { client?: infer C } ? C : never;

  await assert.rejects(
    async () => {
      await analyzeCleanliness(Buffer.from('before'), Buffer.from('after'), {
        client: mockFailingClient,
      });
    },
    (err: Error) => {
      assert.ok(!err.message.includes(secretKey), 'API Key must never leak in error message');
      assert.ok(err.message.includes('The Vision Verification service encountered an upstream provider error'));
      return true;
    }
  );
  restoreEnv();
});

test('Vision Service: fails when GEMINI_VISION_API_KEY is missing without falling back to chatbot key', async () => {
  restoreEnv();
  delete process.env.GEMINI_VISION_API_KEY;
  process.env.GEMINI_CHATBOT_API_KEY = 'valid-chatbot-key-only';

  await assert.rejects(
    async () => {
      await analyzeCleanliness(Buffer.from('before'), Buffer.from('after'));
    },
    (err: Error) => {
      assert.ok(err.message.includes('GEMINI_VISION_API_KEY is not configured'));
      assert.ok(!err.message.includes('GEMINI_CHATBOT_API_KEY'));
      return true;
    }
  );
  restoreEnv();
});

// ============================================================================
// 2. VERIFY API ROUTE: AUTHORIZATION & VALIDATION TESTS
// ============================================================================

test('Verify API Route: rejects unauthenticated requests with 401', async () => {
  const req = createUnauthRequest('http://localhost:3000/api/complaints/11111111-1111-4000-8000-111111111111/verify');
  const res = await verifyRouteHandler(req, {
    params: Promise.resolve({ id: '11111111-1111-4000-8000-111111111111' }),
  });

  assert.strictEqual(res.status, 401);
});

test('Verify API Route: rejects citizen role with 403 Forbidden', async () => {
  const req = await createAuthRequest(
    'citizen',
    'http://localhost:3000/api/complaints/11111111-1111-4000-8000-111111111111/verify'
  );
  const res = await verifyRouteHandler(req, {
    params: Promise.resolve({ id: '11111111-1111-4000-8000-111111111111' }),
  });

  assert.strictEqual(res.status, 403);
});

test('Verify API Route: rejects worker role with 403 Forbidden', async () => {
  const req = await createAuthRequest(
    'worker',
    'http://localhost:3000/api/complaints/11111111-1111-4000-8000-111111111111/verify'
  );
  const res = await verifyRouteHandler(req, {
    params: Promise.resolve({ id: '11111111-1111-4000-8000-111111111111' }),
  });

  assert.strictEqual(res.status, 403);
});

test('Verify API Route: rejects invalid complaint UUID format with 400', async () => {
  const req = await createAuthRequest(
    'officer',
    'http://localhost:3000/api/complaints/not-a-valid-uuid/verify'
  );
  const res = await verifyRouteHandler(req, {
    params: Promise.resolve({ id: 'not-a-valid-uuid' }),
  });

  assert.strictEqual(res.status, 400);
  const json = await res.json();
  assert.ok(json.message.includes('valid UUID'));
});

// ============================================================================
// 3. OBSERVATIONAL BOUNDARY & INVARIANT CHECKS
// ============================================================================

test('Verification Architecture: model output schema strictly excludes authoritative decision fields', () => {
  // Check that the observational schema has no resolution/decision fields
  const sample = {
    ...sampleValidMetrics,
    status: 'resolved',
    approvalStatus: 'approved',
    decision: 'approved',
  };

  const parsed = visionVerificationMetricsSchema.parse(sample) as Record<string, unknown>;
  // Schema should not recognize or promote decision properties
  assert.strictEqual(parsed.status, undefined);
  assert.strictEqual(parsed.approvalStatus, undefined);
  assert.strictEqual(parsed.decision, undefined);
});

test('Verification Architecture: supported MIME types strictly match existing storage validator', () => {
  assert.deepStrictEqual([...SUPPORTED_VISION_MIME_TYPES], ['image/jpeg', 'image/png', 'image/webp']);
});
