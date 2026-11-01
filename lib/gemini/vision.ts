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

export interface VisionImageInput {
  buffer: Buffer;
  mimeType: string;
}

export interface AnalyzeCleanlinessOptions {
  client?: GoogleGenAI;
  model?: string;
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

  // 4. Invoke Gemini Vision model
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
    // If it's a configuration error from getVisionClient or Zod validation error, propagate safely
    if (error instanceof Error && error.message.includes('GEMINI_VISION_API_KEY')) {
      throw error;
    }
    if (error instanceof z.ZodError) {
      const issue = error.issues[0]?.message || 'Schema validation failure';
      throw new Error(`[JanSahayak Gemini Vision Error] Output validation failed: ${issue}`);
    }
    if (error instanceof Error && error.message.startsWith('[JanSahayak Gemini Vision]')) {
      throw error;
    }

    // Provider error sanitization: strip credentials, keys, or internal tokens
    const errorDetails = error instanceof Error ? error.message : String(error);
    const sanitizedLog = errorDetails.replace(/AIzaSy[A-Za-z0-9_-]+/g, '[REDACTED_API_KEY]');
    console.error('[JanSahayak Gemini Vision Provider Error]', sanitizedLog);

    throw new Error(
      '[JanSahayak Gemini Vision Error] The Vision Verification service encountered an upstream provider error. Please try again shortly.'
    );
  }
}
