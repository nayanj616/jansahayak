/**
 * Google Gemini Service Module (Server-Only Placeholder)
 * Phase 1: Foundation preparation for multimodal AI features.
 *
 * IMPORTANT SECURITY RULE:
 * This module is guarded with 'server-only'. It must NEVER be imported
 * into client components or exposed to the browser.
 */

import 'server-only';
import { GoogleGenAI } from '@google/genai';
import type { CivicAnswerResult, CleanlinessAnalysisResult } from '@/types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

let geminiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (geminiClient) return geminiClient;

  if (!GEMINI_API_KEY || GEMINI_API_KEY.startsWith('placeholder')) {
    throw new Error(
      'Gemini API key is not configured. Please set GEMINI_API_KEY in your environment to activate AI features in Phase 2.'
    );
  }

  geminiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  return geminiClient;
}

/**
 * Placeholder function for AI cleanliness verification.
 * In Phase 2, this will analyze before/after cleanup photos to compute
 * cleanliness scores and recommend officer approval.
 */
export async function analyzeCleanliness(
  beforeImage: string | Buffer,
  afterImage: string | Buffer
): Promise<CleanlinessAnalysisResult> {
  // Use arguments to avoid unused variable warnings in Phase 1 placeholder
  void beforeImage;
  void afterImage;

  // Phase 1 requirement: Do not implement fake AI responses or pretend that the API is connected.
  const isKeyConfigured = Boolean(GEMINI_API_KEY && !GEMINI_API_KEY.startsWith('placeholder'));

  if (!isKeyConfigured) {
    throw new Error(
      '[JanSahayak Gemini] analyzeCleanliness is prepared as a Phase 1 foundation placeholder. Live multimodal image comparison will be activated in Phase 2.'
    );
  }

  throw new Error(
    '[JanSahayak Gemini] Multimodal cleanliness verification model execution is scheduled for Phase 2 implementation.'
  );
}

/**
 * Placeholder function for AI Civic Assistant queries.
 * In Phase 2, this will interpret citizen questions about Madhya Pradesh & central
 * government schemes and grievance redressal procedures.
 */
export async function answerCivicQuestion(
  question: string,
  context?: string
): Promise<CivicAnswerResult> {
  void question;
  void context;

  const isKeyConfigured = Boolean(GEMINI_API_KEY && !GEMINI_API_KEY.startsWith('placeholder'));

  if (!isKeyConfigured) {
    throw new Error(
      '[JanSahayak Gemini] answerCivicQuestion is prepared as a Phase 1 foundation placeholder. Live civic conversational assistance will be activated in Phase 2.'
    );
  }

  throw new Error(
    '[JanSahayak Gemini] Civic assistant conversational model execution is scheduled for Phase 2 implementation.'
  );
}

/**
 * Diagnostic helper to check Gemini readiness without executing API calls.
 */
export function getGeminiStatus(): {
  isConfigured: boolean;
  model: string;
  phase: string;
} {
  return {
    isConfigured: Boolean(GEMINI_API_KEY && !GEMINI_API_KEY.startsWith('placeholder')),
    model: GEMINI_MODEL,
    phase: 'Phase 1: Foundation prepared, live execution disabled',
  };
}
