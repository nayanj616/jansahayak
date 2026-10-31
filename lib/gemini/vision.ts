import 'server-only';
import type { CleanlinessAnalysisResult } from '@/types';
import { getVisionClient, getVisionModel, isVisionConfigured } from './client';

/**
 * Foundation boundary for Multimodal Cleanliness Verification (Phase 4B.2).
 *
 * NOTE: Live before/after image comparison, confidence scoring, and cleanliness ratings
 * are intentionally NOT implemented in this infrastructure foundation.
 * This function establishes the service interface, verifies vision credential availability,
 * and ensures full isolation from the civic conversational assistant.
 */
export async function analyzeCleanliness(
  beforeImage: string | Buffer,
  afterImage: string | Buffer
): Promise<CleanlinessAnalysisResult> {
  void beforeImage;
  void afterImage;

  if (!isVisionConfigured()) {
    throw new Error(
      '[JanSahayak Gemini] GEMINI_VISION_API_KEY is not configured. ' +
      'Multimodal cleanliness verification will be activated in Phase 4B.2.'
    );
  }

  // Verify client construction using configured vision credentials
  getVisionClient();
  const model = getVisionModel();

  throw new Error(
    `[JanSahayak Gemini] Multimodal cleanliness verification model execution (${model}) is scheduled for Phase 4B.2 implementation.`
  );
}

