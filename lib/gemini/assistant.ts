import 'server-only';
import type { CivicAnswerResult } from '@/types';
import { getChatbotClient, getChatbotModel, isChatbotConfigured } from './client';

/**
 * Foundation boundary for Civic RAG Assistant (Phase 4B.1).
 *
 * NOTE: Live conversational assistance, document retrieval, and prompt synthesis are
 * intentionally NOT implemented in this infrastructure foundation.
 * This function establishes the service interface, verifies chatbot credential availability,
 * and ensures full isolation from vision verification.
 */
export async function answerCivicQuestion(
  question: string,
  context?: string
): Promise<CivicAnswerResult> {
  void question;
  void context;

  if (!isChatbotConfigured()) {
    throw new Error(
      '[JanSahayak Gemini] GEMINI_CHATBOT_API_KEY is not configured. ' +
      'Civic assistant conversational assistance will be activated in Phase 4B.1.'
    );
  }

  // Verify client construction using configured chatbot credentials
  getChatbotClient();
  const model = getChatbotModel();

  throw new Error(
    `[JanSahayak Gemini] Civic assistant conversational model execution (${model}) is scheduled for Phase 4B.1 implementation.`
  );
}

