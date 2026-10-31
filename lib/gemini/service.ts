import 'server-only';

export * from './client';
export * from './assistant';
export * from './vision';

import {
  getChatbotClient,
  getChatbotModel,
  isChatbotConfigured,
  getVisionModel,
  isVisionConfigured,
  type DualGeminiStatus,
} from './client';

/**
 * Diagnostic helper to check Gemini readiness across both chatbot and vision services
 * without exposing credentials or executing remote API calls.
 */
export function getGeminiStatus(): DualGeminiStatus {
  const chatbotConfigured = isChatbotConfigured();
  const visionConfigured = isVisionConfigured();

  return {
    chatbot: {
      isConfigured: chatbotConfigured,
      model: getChatbotModel(),
    },
    vision: {
      isConfigured: visionConfigured,
      model: getVisionModel(),
    },
    // Backward-compatible top-level properties
    isConfigured: chatbotConfigured,
    model: getChatbotModel(),
    phase: 'Phase 4B Foundation: Dual-key architecture initialized',
  };
}

/**
 * @deprecated Legacy shared client getter. Use getChatbotClient() or getVisionClient() explicitly.
 * Defaults to the chatbot client for backward compatibility.
 */
export function getGeminiClient() {
  return getChatbotClient();
}
