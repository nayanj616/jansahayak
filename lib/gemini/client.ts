import 'server-only';
import { GoogleGenAI } from '@google/genai';

export interface GeminiClientOptions {
  apiKey?: string;
  model?: string;
}

export interface GeminiServiceStatus {
  isConfigured: boolean;
  model: string;
}

export interface DualGeminiStatus {
  chatbot: GeminiServiceStatus;
  vision: GeminiServiceStatus;
  /** Backward-compatible top-level property indicating whether chatbot is ready */
  isConfigured: boolean;
  /** Backward-compatible top-level model identifier */
  model: string;
  phase: string;
}

export const DEFAULT_GEMINI_CHATBOT_MODEL = 'gemini-3.8-flash';
export const DEFAULT_GEMINI_VISION_MODEL = 'gemini-3.8-flash';

let chatbotClientInstance: GoogleGenAI | null = null;
let visionClientInstance: GoogleGenAI | null = null;

/**
 * Resets memoized client singletons.
 * Intended for test isolation and dynamic environment changes.
 */
export function resetGeminiClients(): void {
  chatbotClientInstance = null;
  visionClientInstance = null;
}

/**
 * Resolves the chatbot API key directly from process.env.
 */
export function getChatbotApiKey(): string | undefined {
  return process.env.GEMINI_CHATBOT_API_KEY;
}

/**
 * Resolves the vision API key directly from process.env.
 */
export function getVisionApiKey(): string | undefined {
  return process.env.GEMINI_VISION_API_KEY;
}

/**
 * Resolves the chatbot model identifier.
 */
export function getChatbotModel(): string {
  return process.env.GEMINI_CHATBOT_MODEL || DEFAULT_GEMINI_CHATBOT_MODEL;
}

/**
 * Resolves the vision model identifier.
 */
export function getVisionModel(): string {
  return process.env.GEMINI_VISION_MODEL || DEFAULT_GEMINI_VISION_MODEL;
}

/**
 * Checks whether the chatbot service is configured with a non-placeholder API key.
 */
export function isChatbotConfigured(): boolean {
  const key = getChatbotApiKey();
  return Boolean(key && !key.startsWith('placeholder'));
}

/**
 * Checks whether the vision service is configured with a non-placeholder API key.
 */
export function isVisionConfigured(): boolean {
  const key = getVisionApiKey();
  return Boolean(key && !key.startsWith('placeholder'));
}

/**
 * Returns the GoogleGenAI client configured exclusively for chatbot/RAG queries.
 * Never falls back to GEMINI_VISION_API_KEY.
 */
export function getChatbotClient(options?: GeminiClientOptions): GoogleGenAI {
  if (!options && chatbotClientInstance) {
    return chatbotClientInstance;
  }

  const apiKey = options?.apiKey ?? getChatbotApiKey();

  if (!apiKey || apiKey.startsWith('placeholder')) {
    throw new Error(
      '[JanSahayak Gemini] GEMINI_CHATBOT_API_KEY is not configured. ' +
      'Please set GEMINI_CHATBOT_API_KEY in your environment to activate conversational features.'
    );
  }

  const client = new GoogleGenAI({ apiKey });

  if (!options) {
    chatbotClientInstance = client;
  }

  return client;
}

/**
 * Returns the GoogleGenAI client configured exclusively for multimodal vision verification.
 * Never falls back to GEMINI_CHATBOT_API_KEY.
 */
export function getVisionClient(options?: GeminiClientOptions): GoogleGenAI {
  if (!options && visionClientInstance) {
    return visionClientInstance;
  }

  const apiKey = options?.apiKey ?? getVisionApiKey();

  if (!apiKey || apiKey.startsWith('placeholder')) {
    throw new Error(
      '[JanSahayak Gemini] GEMINI_VISION_API_KEY is not configured. ' +
      'Please set GEMINI_VISION_API_KEY in your environment to activate vision verification features.'
    );
  }

  const client = new GoogleGenAI({ apiKey });

  if (!options) {
    visionClientInstance = client;
  }

  return client;
}

