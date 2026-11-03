import 'server-only';
import { z } from 'zod';
import type { GoogleGenAI } from '@google/genai';
import type {
  AnalyzeCleanlinessResult,
} from '@/types';
import { getVisionClient, getVisionModel, isVisionConfigured } from './client';
export { getVisionClient, getVisionModel, isVisionConfigured } from './client';

export const VISION_PROMPT_VERSION = 'v1.0.0-20261101';

export const SUPPORTED_VISION_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type SupportedVisionMimeType = (typeof SUPPORTED_VISION_MIME_TYPES)[number];

export type VisionErrorClassificationType =
  | 'UNAVAILABLE'
  | 'RATE_LIMIT'
  | 'QUOTA_EXHAUSTED'
  | 'AUTH_FAILURE'
  | 'INVALID_REQUEST'
  | 'VALIDATION_FAILURE'
  | 'CONFIGURATION_ERROR'
  | 'UNKNOWN_ERROR';

export interface VisionErrorClassification {
  classification: VisionErrorClassificationType;
  httpStatus: number;
  providerStatus: string | null;
  userMessage: string;
  isRetriable: boolean;
  attempts: number;
}

export class VisionProviderError extends Error {
  readonly classification: VisionErrorClassificationType;
  readonly httpStatus: number;
  readonly providerStatus: string | null;
  readonly userMessage: string;
  readonly attempts: number;
  readonly isRetriable: boolean;

  constructor(params: {
    classification: VisionErrorClassificationType;
    httpStatus: number;
    providerStatus: string | null;
    userMessage: string;
    attempts: number;
    isRetriable: boolean;
    cause?: unknown;
  }) {
    super(`[JanSahayak Gemini Vision Error] ${params.userMessage}`);
    this.name = 'VisionProviderError';
    this.classification = params.classification;
    this.httpStatus = params.httpStatus;
    this.providerStatus = params.providerStatus;
    this.userMessage = params.userMessage;
    this.attempts = params.attempts;
    this.isRetriable = params.isRetriable;
    if (params.cause) {
      this.cause = params.cause;
    }
  }
}

export interface RetryOptions {
  maxRetries?: number;
  backoffBaseMs?: number;
  jitter?: boolean;
  sleepFn?: (ms: number) => Promise<void>;
}

export interface VisionImageInput {
  buffer: Buffer;
  mimeType: string;
}

export interface AnalyzeCleanlinessOptions {
  client?: GoogleGenAI;
  model?: string;
  retryOptions?: RetryOptions;
}

export const visionConfidenceLevelSchema = z.enum([
  'high',
  'medium',
  'low',
  'inconclusive',
]);

export const visionVerificationMetricsSchema = z
  .object({
    beforeObservations: z.object({
      wasteIdentified: z.array(z.string()).default([]),
      approximateSpread: z.string().default(''),
      obstructionsOrHazards: z.array(z.string()).default([]),
    }),
    afterObservations: z.object({
      visibleSurfaces: z.array(z.string()).default([]),
      remainingDebris: z.array(z.string()).default([]),
      cleanlinessApparent: z.boolean().nullable().default(null),
    }),
    comparativeFindings: z.object({
      primaryWasteRemoved: z.boolean().nullable().default(null),
      siteConsistent: z.boolean().nullable().default(null),
      changesObserved: z.array(z.string()).default([]),
    }),
    comparisonLimitations: z.object({
      angleMismatched: z.boolean().default(false),
      lightingMismatched: z.boolean().default(false),
      occlusionPresent: z.boolean().default(false),
      limitationNotes: z.array(z.string()).default([]),
    }),
    evaluation: z.object({
      confidenceLevel: visionConfidenceLevelSchema,
      isComparisonReliable: z.boolean().default(true),
      wasteReductionEstimate: z
        .number()
        .min(0, 'Waste reduction estimate must be between 0 and 100')
        .max(100, 'Waste reduction estimate must be between 0 and 100')
        .nullable()
        .default(null),
      estimateRationale: z.string().nullable().default(null),
    }),
    officerSummary: z.string().min(1, 'Officer summary is required'),
    disclaimer: z
      .string()
      .default(
        'JanSahayak AI Vision is an academic demonstration advisory tool. Observations do not constitute official municipal certification. Human officer evaluation remains authoritative.'
      ),
  })
  .refine(
    (data) => {
      // Consistency rule: if comparison is marked unreliable or confidence is inconclusive,
      // it should not claim high confidence
      if (!data.evaluation.isComparisonReliable && data.evaluation.confidenceLevel === 'high') {
        return false;
      }
      return true;
    },
    {
      message: 'Evaluation cannot claim high confidence when comparison is marked unreliable.',
      path: ['evaluation', 'confidenceLevel'],
    }
  );

const SYSTEM_INSTRUCTION = `You are JanSahayak's Multimodal Sanitation Verification Assistant for Gwalior Municipal Corporation (Madhya Pradesh).
Your purpose is to assist municipal officers by providing strictly observational, evidence-based visual comparisons between before-and-after sanitation photographs.

CRITICAL OPERATIONAL AND ETHICAL INVARIANTS:
1. Strict Observational Role: You are strictly an observational tool. You NEVER make binding municipal decisions. You must NEVER output words like "Approved", "Rejected", "Resolved", or "Verified Complete" as official determinations.
2. No Attribution Inference: Do NOT speculate or infer who performed the work (e.g. sanitation workers vs bystanders vs weather).
3. No Temporal or Spatial Speculation: Do NOT guess the exact capture time, date, GPS coordinates, or weather conditions.
4. No Weight or Volume Speculation: Do NOT estimate waste weight (e.g. "40 kg") or exact physical cubic volume without calibrated measuring instruments.
5. No Misconduct or Fraud Allegations: Do NOT accuse workers or citizens of staging, deception, or misconduct. If the photos appear to show different locations, set siteConsistent: false and state neutrally that visual landmarks differ.
6. Comparison Limitations: If camera angles differ significantly, if lighting differs (day vs night), or if the scene is blurry or occluded, explicitly mark the limitation flags.
7. Waste Reduction Estimate: Provide a numerical percentage (0-100) ONLY when camera perspective and clarity allow a defensible visual comparison of the cleared surface area. If comparison is unreliable or perspectives differ, leave wasteReductionEstimate as null.
8. Support Inconclusive States: When visual evidence is ambiguous, contradictory, or insufficient, set confidenceLevel to "inconclusive", isComparisonReliable to false, and wasteReductionEstimate to null.
9. Format: Return strictly valid JSON matching the required schema.`;

const PROMPT_INSTRUCTIONS = `Analyze the two attached sanitation images:
- Image 1 is the initial Citizen Grievance Photo (Before Cleanup).
- Image 2 is the Sanitation Worker Photographic Proof (After Cleanup).

Provide structured visual observations strictly adhering to the schema:
1. beforeObservations: Items of waste, spread description, and any hazards/obstructions in Image 1.
2. afterObservations: Cleared surfaces, any remaining residual waste, and whether cleanliness is visually apparent in Image 2.
3. comparativeFindings: Whether the primary waste pile was removed, whether landmarks indicate the same physical site, and list of specific visible changes.
4. comparisonLimitations: Flag perspective/angle mismatch, lighting mismatch, or visual occlusions.
5. evaluation: Confidence level ('high', 'medium', 'low', 'inconclusive'), reliability flag, and optional defensible waste reduction estimate (0-100 or null).
6. officerSummary: Concise, neutral 2-3 sentence factual briefing summarizing observations for the reviewing municipal officer.
7. disclaimer: JanSahayak academic demonstration advisory notice.`;

/**
 * Normalizes input image into a validated buffer and supported MIME type.
 */
function normalizeImageInput(
  input: Buffer | VisionImageInput,
  paramName: string
): { buffer: Buffer; mimeType: SupportedVisionMimeType } {
  let buffer: Buffer;
  let rawMime: string;

  if (Buffer.isBuffer(input)) {
    buffer = input;
    // Inspect magic bytes if not provided explicitly
    if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      rawMime = 'image/png';
    } else if (buffer.length >= 12 && buffer.toString('utf8', 0, 4) === 'RIFF' && buffer.toString('utf8', 8, 12) === 'WEBP') {
      rawMime = 'image/webp';
    } else {
      rawMime = 'image/jpeg';
    }
  } else if (input && typeof input === 'object' && Buffer.isBuffer(input.buffer) && typeof input.mimeType === 'string') {
    buffer = input.buffer;
    rawMime = input.mimeType.toLowerCase();
  } else {
    throw new Error(
      `[JanSahayak Gemini Vision] Invalid ${paramName}. Expected a Buffer or { buffer: Buffer, mimeType: string }.`
    );
  }

  if (buffer.byteLength === 0) {
    throw new Error(`[JanSahayak Gemini Vision] ${paramName} buffer cannot be empty.`);
  }

  const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB limit
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new Error(
      `[JanSahayak Gemini Vision] ${paramName} exceeds the maximum allowed file size of 8 MB.`
    );
  }

  if (!SUPPORTED_VISION_MIME_TYPES.includes(rawMime as SupportedVisionMimeType)) {
    throw new Error(
      `[JanSahayak Gemini Vision] Unsupported MIME type '${rawMime}' for ${paramName}. Supported types: ${SUPPORTED_VISION_MIME_TYPES.join(', ')}.`
    );
  }

  return { buffer, mimeType: rawMime as SupportedVisionMimeType };
}

/**
 * Classifies Gemini Vision errors into a structured taxonomy.
 * Sanitizes officer-facing messages and extracts HTTP status and provider status.
 * Never leaks API keys, secrets, or internal stack details.
 */
export function classifyVisionError(
  error: unknown,
  attempts: number = 1
): VisionErrorClassification {
  if (error instanceof z.ZodError) {
    const issue = error.issues[0]?.message || 'Schema validation failure';
    return {
      classification: 'VALIDATION_FAILURE',
      httpStatus: 502,
      providerStatus: 'VALIDATION_ERROR',
      userMessage: `Output validation failed: ${issue}`,
      isRetriable: false,
      attempts,
    };
  }

  const rawMsg = error instanceof Error ? error.message : String(error || '');

  if (rawMsg.includes('GEMINI_VISION_API_KEY')) {
    return {
      classification: 'CONFIGURATION_ERROR',
      httpStatus: 500,
      providerStatus: 'CONFIG_ERROR',
      userMessage: rawMsg.replace(/AIzaSy[A-Za-z0-9_-]+/g, '[REDACTED_API_KEY]'),
      isRetriable: false,
      attempts,
    };
  }

  let statusCode: number | null = null;
  let providerStatus: string | null = null;
  let bodyMessage: string | null = null;

  // Inspect error properties
  if (error && typeof error === 'object') {
    const errObj = error as Record<string, unknown>;

    // Direct status or code (number or string)
    if (typeof errObj.status === 'number') {
      statusCode = errObj.status;
    } else if (typeof errObj.status === 'string' && /^\d{3}$/.test(errObj.status)) {
      statusCode = parseInt(errObj.status, 10);
    } else if (typeof errObj.code === 'number') {
      statusCode = errObj.code;
    } else if (typeof errObj.code === 'string' && /^\d{3}$/.test(errObj.code)) {
      statusCode = parseInt(errObj.code, 10);
    }

    // Provider status enum property (e.g. status: 'UNAVAILABLE')
    if (typeof errObj.status === 'string' && !/^\d{3}$/.test(errObj.status)) {
      providerStatus = errObj.status;
    }

    // Check nested response/httpMeta from @google/genai
    const httpMeta = errObj.httpMeta as Record<string, unknown> | undefined;
    if (httpMeta && typeof httpMeta === 'object') {
      const resp = httpMeta.response as Record<string, unknown> | undefined;
      if (resp && typeof resp.status === 'number') {
        statusCode = resp.status;
      }
    }
  }

  // Parse JSON embedded in error message (e.g. GoogleGenAiDefaultError "Status 503. Body: { ... }")
  const jsonMatch = rawMsg.match(/({[\s\S]*"error"[\s\S]*})/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      const err = parsed.error || parsed;
      if (typeof err.code === 'number') {
        statusCode = err.code;
      }
      if (typeof err.status === 'string') {
        providerStatus = err.status;
      }
      if (typeof err.message === 'string') {
        bodyMessage = err.message;
      }
    } catch {
      // not valid JSON; fallback to regex
    }
  }

  // Fallback regex for status code
  if (!statusCode) {
    const statusMatch = rawMsg.match(/(?:status|code|HTTP)\D*(\d{3})\b/i);
    if (statusMatch) {
      statusCode = parseInt(statusMatch[1], 10);
    }
  }

  // Fallback regex for provider status enum
  if (!providerStatus) {
    const enumMatch = rawMsg.match(
      /\b(UNAVAILABLE|RESOURCE_EXHAUSTED|PERMISSION_DENIED|UNAUTHENTICATED|INVALID_ARGUMENT|NOT_FOUND|INTERNAL|DEADLINE_EXCEEDED)\b/i
    );
    if (enumMatch) {
      providerStatus = enumMatch[1].toUpperCase();
    }
  }

  const combinedText = `${rawMsg} ${bodyMessage || ''}`.toLowerCase();

  // 1. 503 / UNAVAILABLE
  if (
    statusCode === 503 ||
    providerStatus === 'UNAVAILABLE' ||
    combinedText.includes('unavailable') ||
    combinedText.includes('high demand')
  ) {
    return {
      classification: 'UNAVAILABLE',
      httpStatus: 503,
      providerStatus: providerStatus || 'UNAVAILABLE',
      userMessage:
        'The AI Vision service is temporarily experiencing high upstream demand (HTTP 503). Please retry in a few moments.',
      isRetriable: true,
      attempts,
    };
  }

  // 2. 429 / RESOURCE_EXHAUSTED
  if (
    statusCode === 429 ||
    providerStatus === 'RESOURCE_EXHAUSTED' ||
    combinedText.includes('rate limit') ||
    combinedText.includes('resource_exhausted')
  ) {
    const isHardQuota =
      combinedText.includes('per day') ||
      combinedText.includes('daily') ||
      combinedText.includes('limit: 0') ||
      combinedText.includes('insufficient quota') ||
      combinedText.includes('billing') ||
      combinedText.includes('free tier limit') ||
      combinedText.includes('quota exhausted');

    if (isHardQuota) {
      return {
        classification: 'QUOTA_EXHAUSTED',
        httpStatus: 429,
        providerStatus: providerStatus || 'RESOURCE_EXHAUSTED',
        userMessage:
          'The AI Vision service quota has been exhausted. Please contact the project administrator.',
        isRetriable: false,
        attempts,
      };
    }

    return {
      classification: 'RATE_LIMIT',
      httpStatus: 429,
      providerStatus: providerStatus || 'RESOURCE_EXHAUSTED',
      userMessage:
        'The AI Vision service rate limit was reached (HTTP 429). Please wait before retrying.',
      isRetriable: true,
      attempts,
    };
  }

  // 3. 401 / 403 / AUTH_FAILURE
  if (
    statusCode === 401 ||
    statusCode === 403 ||
    providerStatus === 'PERMISSION_DENIED' ||
    providerStatus === 'UNAUTHENTICATED' ||
    combinedText.includes('permission_denied') ||
    combinedText.includes('unauthenticated') ||
    combinedText.includes('api key not valid')
  ) {
    return {
      classification: 'AUTH_FAILURE',
      httpStatus: statusCode === 401 ? 401 : 403,
      providerStatus: providerStatus || 'PERMISSION_DENIED',
      userMessage:
        'AI Vision service authentication failed (HTTP 401/403). Please verify API key configuration.',
      isRetriable: false,
      attempts,
    };
  }

  // 4. 400 / 404 / INVALID_REQUEST
  if (
    statusCode === 400 ||
    statusCode === 404 ||
    providerStatus === 'INVALID_ARGUMENT' ||
    providerStatus === 'NOT_FOUND' ||
    combinedText.includes('invalid_argument') ||
    combinedText.includes('not_found') ||
    combinedText.includes('model not found')
  ) {
    return {
      classification: 'INVALID_REQUEST',
      httpStatus: statusCode === 404 ? 404 : 400,
      providerStatus: providerStatus || 'INVALID_ARGUMENT',
      userMessage:
        'AI Vision request or model configuration error (HTTP 400/404). Please contact the project administrator.',
      isRetriable: false,
      attempts,
    };
  }

  // 5. UNKNOWN_ERROR fallback
  return {
    classification: 'UNKNOWN_ERROR',
    httpStatus: statusCode && statusCode >= 400 && statusCode < 600 ? statusCode : 502,
    providerStatus: providerStatus || null,
    userMessage:
      'The Vision Verification service encountered an upstream provider error. Please try again shortly.',
    isRetriable: false,
    attempts,
  };
}

/**
 * Performs multimodal before-and-after cleanliness comparison for municipal officer review.
 * Server-only service executing strictly on the server boundary.
 */
export async function analyzeCleanliness(
  beforeImage: Buffer | VisionImageInput,
  afterImage: Buffer | VisionImageInput,
  options?: AnalyzeCleanlinessOptions
): Promise<AnalyzeCleanlinessResult> {
  // 1. Validate image inputs
  const validatedBefore = normalizeImageInput(beforeImage, 'beforeImage');
  const validatedAfter = normalizeImageInput(afterImage, 'afterImage');

  // 2. Validate configuration unless mock client injected
  if (!options?.client && !isVisionConfigured()) {
    throw new Error(
      '[JanSahayak Gemini] GEMINI_VISION_API_KEY is not configured. ' +
      'Please set GEMINI_VISION_API_KEY in your environment to activate vision verification features.'
    );
  }

  const client = options?.client ?? getVisionClient();
  const model = options?.model ?? getVisionModel();

  // 3. Assemble multimodal parts
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: 'IMAGE 1: Citizen Grievance Photo (Before Cleanup)',
        },
        {
          inlineData: {
            mimeType: validatedBefore.mimeType,
            data: validatedBefore.buffer.toString('base64'),
          },
        },
        {
          text: 'IMAGE 2: Sanitation Worker Photographic Proof (After Cleanup)',
        },
        {
          inlineData: {
            mimeType: validatedAfter.mimeType,
            data: validatedAfter.buffer.toString('base64'),
          },
        },
        {
          text: PROMPT_INSTRUCTIONS,
        },
      ],
    },
  ];

  // 4. Invoke Gemini Vision model with bounded retry for transient errors
  const retryOpts = options?.retryOptions;
  const maxRetries = typeof retryOpts?.maxRetries === 'number' ? retryOpts.maxRetries : 2;
  const backoffBaseMs = typeof retryOpts?.backoffBaseMs === 'number' ? retryOpts.backoffBaseMs : 1500;
  const useJitter = typeof retryOpts?.jitter === 'boolean' ? retryOpts.jitter : true;
  const sleep = retryOpts?.sleepFn ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));

  let attempt = 0;
  while (true) {
    attempt++;
    try {
      const response = await client.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text?.trim() || '';
      if (!rawText) {
        throw new Error('[JanSahayak Gemini Vision] Empty response received from vision model.');
      }

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(rawText);
      } catch {
        throw new Error('[JanSahayak Gemini Vision] Malformed JSON received from vision model.');
      }

      const validatedMetrics = visionVerificationMetricsSchema.parse(parsedJson);

      return {
        metrics: validatedMetrics,
        modelVersion: VISION_PROMPT_VERSION,
        modelName: model,
        processedAt: new Date().toISOString(),
      };
    } catch (error) {
      // Configuration error from getVisionClient propagates directly
      if (error instanceof Error && error.message.includes('GEMINI_VISION_API_KEY')) {
        throw error;
      }
      // Internal input and parse errors propagate directly
      if (
        error instanceof Error &&
        (error.message.startsWith('[JanSahayak Gemini Vision] Invalid') ||
          error.message.startsWith('[JanSahayak Gemini Vision] Unsupported') ||
          error.message.includes('buffer cannot be empty') ||
          error.message.includes('Empty response received from vision model') ||
          error.message.includes('Malformed JSON received from vision model'))
      ) {
        throw error;
      }

      const classified = classifyVisionError(error, attempt);

      // Retry transient errors boundedly
      if (classified.isRetriable && attempt <= maxRetries) {
        const exponentialDelay = backoffBaseMs * Math.pow(2, attempt - 1);
        const jitterMs = useJitter ? Math.floor(Math.random() * 500) : 0;
        const delay = exponentialDelay + jitterMs;

        console.warn(
          `[JanSahayak Gemini Vision] Transient ${classified.classification} error on attempt ${attempt}/${maxRetries + 1}. Retrying in ${delay}ms...`
        );

        await sleep(delay);
        continue;
      }

      // Provider error logging with key redaction
      const errorDetails = error instanceof Error ? error.message : String(error);
      const sanitizedLog = errorDetails.replace(/AIzaSy[A-Za-z0-9_-]+/g, '[REDACTED_API_KEY]');
      console.error('[JanSahayak Gemini Vision Provider Error]', {
        classification: classified.classification,
        status: classified.httpStatus,
        providerStatus: classified.providerStatus,
        attempts: attempt,
        providerMessage: sanitizedLog,
      });

      throw new VisionProviderError({
        classification: classified.classification,
        httpStatus: classified.httpStatus,
        providerStatus: classified.providerStatus,
        userMessage: classified.userMessage,
        attempts: attempt,
        isRetriable: classified.isRetriable,
        cause: error,
      });
    }
  }
}
