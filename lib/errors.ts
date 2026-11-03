/**
 * Centralized Frontend Error Handling and Sanitization
 *
 * Requirements:
 * 1. Never display raw backend exception messages, stack traces, SQL errors,
 *    or API keys directly to users.
 * 2. Classify errors according to actual source (Gemini Vision, network, auth, not-found, server).
 * 3. Map Gemini Vision conditions (503, 429, quota, auth, invalid model) to exact localized strings.
 * 4. Never render internal translation keys (e.g. 'errors.generic').
 * 5. Provide safe generic fallbacks for unknown errors in both English and Hindi.
 */

export type ErrorSource =
  | 'vision'
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'server'
  | 'validation'
  | 'unknown';

export interface ClassifiedFrontendError {
  source: ErrorSource;
  code?: string;
  httpStatus?: number;
  isRetriable: boolean;
  messageEn: string;
  messageHi: string;
}

// Exact messages required for Gemini Vision errors
export const VISION_ERROR_MESSAGES = {
  unavailable503: {
    en: 'AI verification is temporarily unavailable. Please try again later.',
    hi: 'एआई सत्यापन अस्थायी रूप से अनुपलब्ध है। कृपया बाद में पुनः प्रयास करें।',
  },
  rateLimit429: {
    en: 'The AI service is temporarily busy. Please wait before retrying.',
    hi: 'एआई सेवा अस्थायी रूप से व्यस्त है। कृपया पुनः प्रयास करने से पहले प्रतीक्षा करें।',
  },
  quotaExhausted: {
    en: 'AI verification is temporarily unavailable. Contact the project administrator.',
    hi: 'एआई सत्यापन अस्थायी रूप से अनुपलब्ध है। परियोजना प्रशासक से संपर्क करें।',
  },
  authFailure: {
    en: 'AI verification could not be completed. Contact the project administrator.',
    hi: 'एआई सत्यापन पूर्ण नहीं हो सका। परियोजना प्रशासक से संपर्क करें।',
  },
  invalidRequest: {
    en: 'AI verification could not be completed due to a service configuration issue.',
    hi: 'सेवा कॉन्फ़िगरेशन समस्या के कारण एआई सत्यापन पूर्ण नहीं हो सका।',
  },
  genericFailure: {
    en: 'AI verification failed. Please try again later.',
    hi: 'एआई सत्यापन विफल रहा। कृपया बाद में पुनः प्रयास करें।',
  },
} as const;

export const COMMON_ERROR_MESSAGES = {
  network: {
    en: 'Unable to connect to the server. Please check your internet connection.',
    hi: 'सर्वर से कनेक्ट करने में असमर्थ। कृपया अपना इंटरनेट कनेक्शन जांचें।',
  },
  unauthorized: {
    en: 'Your session has expired. Please select a demo role to continue.',
    hi: 'आपका सत्र समाप्त हो गया है। जारी रखने के लिए कृपया एक डेमो भूमिका चुनें।',
  },
  forbidden: {
    en: 'You do not have permission to perform this action.',
    hi: 'आपके पास इस क्रिया को करने की अनुमति नहीं है।',
  },
  notFound: {
    en: 'The requested resource was not found.',
    hi: 'अनुरोधित संसाधन नहीं मिला।',
  },
  server: {
    en: 'The server encountered an issue. Please try again in a few moments.',
    hi: 'सर्वर में समस्या उत्पन्न हुई। कृपया कुछ समय बाद पुनः प्रयास करें।',
  },
  generic: {
    en: 'An unexpected error occurred. Please try again.',
    hi: 'एक अप्रत्याशित त्रुटि हुई। कृपया पुनः प्रयास करें।',
  },
} as const;

/**
 * Checks whether a raw error string contains technical diagnostics,
 * stack traces, internal paths, SQL details, or API keys.
 */
export function containsTechnicalLeakage(raw: string): boolean {
  if (!raw) return false;
  const lower = raw.toLowerCase();

  return (
    /AIzaSy[A-Za-z0-9_-]+/i.test(raw) || // API key
    /(\bat\b\s+[\w/\\.-]+:\d+:\d+|\bstack\b|\berror:\s+)/i.test(raw) || // Stack trace
    /([a-zA-Z]:\\[\w\\.-]+|\/[\w.-]+\/[\w.-]+\/[\w.-]+)/.test(raw) || // File paths
    /(supabase|postgrest|postgres|pg_|select\s+\*|insert\s+into|update\s+|delete\s+from)/i.test(lower) || // SQL/DB
    /(bearer\s+[a-zA-Z0-9._-]+|\bjwt\b|\btoken=)/i.test(lower) || // Tokens
    /\b(http\s*50[0-9]|http\s*40[0-9])\b/i.test(lower) || // HTTP status phrases
    /\b(errors\.generic|complaints\.statuses\.|assignments\.statuses\.)/i.test(lower) // Raw i18n keys
  );
}

/**
 * Classifies an error into a structured, user-safe frontend representation.
 */
export function classifyFrontendError(error: unknown): ClassifiedFrontendError {
  if (!error) {
    return {
      source: 'unknown',
      isRetriable: true,
      messageEn: COMMON_ERROR_MESSAGES.generic.en,
      messageHi: COMMON_ERROR_MESSAGES.generic.hi,
    };
  }

  const rawMsg =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : typeof (error as Record<string, unknown>)?.message === 'string'
          ? ((error as Record<string, unknown>).message as string)
          : String(error);

  const lower = rawMsg.toLowerCase();

  // 1. Gemini Vision Classification
  const isVisionContext =
    lower.includes('vision') ||
    lower.includes('verification') ||
    lower.includes('gemini') ||
    lower.includes('upstream demand') ||
    lower.includes('cleanliness');

  if (isVisionContext) {
    if (
      lower.includes('503') ||
      lower.includes('unavailable') ||
      lower.includes('high upstream demand') ||
      lower.includes('high demand')
    ) {
      return {
        source: 'vision',
        code: 'VISION_503',
        httpStatus: 503,
        isRetriable: true,
        messageEn: VISION_ERROR_MESSAGES.unavailable503.en,
        messageHi: VISION_ERROR_MESSAGES.unavailable503.hi,
      };
    }

    if (
      lower.includes('quota') ||
      lower.includes('resource_exhausted') ||
      lower.includes('billing') ||
      lower.includes('daily limit') ||
      lower.includes('insufficient quota')
    ) {
      return {
        source: 'vision',
        code: 'VISION_QUOTA',
        httpStatus: 429,
        isRetriable: false,
        messageEn: VISION_ERROR_MESSAGES.quotaExhausted.en,
        messageHi: VISION_ERROR_MESSAGES.quotaExhausted.hi,
      };
    }

    if (
      lower.includes('429') ||
      lower.includes('rate limit') ||
      lower.includes('busy') ||
      lower.includes('too many requests')
    ) {
      return {
        source: 'vision',
        code: 'VISION_429',
        httpStatus: 429,
        isRetriable: true,
        messageEn: VISION_ERROR_MESSAGES.rateLimit429.en,
        messageHi: VISION_ERROR_MESSAGES.rateLimit429.hi,
      };
    }

    if (
      lower.includes('401') ||
      lower.includes('403') ||
      lower.includes('permission_denied') ||
      lower.includes('unauthenticated') ||
      lower.includes('authentication failed') ||
      lower.includes('api credentials')
    ) {
      return {
        source: 'vision',
        code: 'VISION_AUTH',
        httpStatus: 401,
        isRetriable: false,
        messageEn: VISION_ERROR_MESSAGES.authFailure.en,
        messageHi: VISION_ERROR_MESSAGES.authFailure.hi,
      };
    }

    if (
      lower.includes('400') ||
      lower.includes('404') ||
      lower.includes('invalid') ||
      lower.includes('not found') ||
      lower.includes('configuration error') ||
      lower.includes('invalid_argument')
    ) {
      return {
        source: 'vision',
        code: 'VISION_INVALID',
        httpStatus: 400,
        isRetriable: false,
        messageEn: VISION_ERROR_MESSAGES.invalidRequest.en,
        messageHi: VISION_ERROR_MESSAGES.invalidRequest.hi,
      };
    }

    return {
      source: 'vision',
      code: 'VISION_FAILED',
      httpStatus: 502,
      isRetriable: true,
      messageEn: VISION_ERROR_MESSAGES.genericFailure.en,
      messageHi: VISION_ERROR_MESSAGES.genericFailure.hi,
    };
  }

  // 2. Network connectivity errors
  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('fetch failed') ||
    lower.includes('abort') ||
    lower.includes('network error') ||
    lower.includes('econnrefused')
  ) {
    return {
      source: 'network',
      isRetriable: true,
      messageEn: COMMON_ERROR_MESSAGES.network.en,
      messageHi: COMMON_ERROR_MESSAGES.network.hi,
    };
  }

  // 3. HTTP Status classifications
  if (lower.includes('401') || lower.includes('unauthorized') || lower.includes('session expired')) {
    return {
      source: 'unauthorized',
      httpStatus: 401,
      isRetriable: false,
      messageEn: COMMON_ERROR_MESSAGES.unauthorized.en,
      messageHi: COMMON_ERROR_MESSAGES.unauthorized.hi,
    };
  }

  if (lower.includes('403') || lower.includes('forbidden') || lower.includes('permission denied')) {
    return {
      source: 'forbidden',
      httpStatus: 403,
      isRetriable: false,
      messageEn: COMMON_ERROR_MESSAGES.forbidden.en,
      messageHi: COMMON_ERROR_MESSAGES.forbidden.hi,
    };
  }

  if (lower.includes('404') || lower.includes('not found')) {
    return {
      source: 'not_found',
      httpStatus: 404,
      isRetriable: false,
      messageEn: COMMON_ERROR_MESSAGES.notFound.en,
      messageHi: COMMON_ERROR_MESSAGES.notFound.hi,
    };
  }

  if (
    lower.includes('500') ||
    lower.includes('502') ||
    lower.includes('504') ||
    lower.includes('internal server error') ||
    containsTechnicalLeakage(rawMsg)
  ) {
    return {
      source: 'server',
      httpStatus: 500,
      isRetriable: true,
      messageEn: COMMON_ERROR_MESSAGES.server.en,
      messageHi: COMMON_ERROR_MESSAGES.server.hi,
    };
  }

  // 4. Clean human-authored form validation messages
  if (
    !containsTechnicalLeakage(rawMsg) &&
    rawMsg.length > 0 &&
    rawMsg.length < 150 &&
    !rawMsg.includes('{"')
  ) {
    return {
      source: 'validation',
      isRetriable: false,
      messageEn: rawMsg,
      messageHi: rawMsg,
    };
  }

  // 5. Default generic fallback
  return {
    source: 'unknown',
    isRetriable: true,
    messageEn: COMMON_ERROR_MESSAGES.generic.en,
    messageHi: COMMON_ERROR_MESSAGES.generic.hi,
  };
}

/**
 * Maps any error condition or backend error message into a localized, user-safe string.
 * Strictly guarantees that raw technical error leakage is suppressed.
 */
export function formatFrontendError(
  error: unknown,
  language: 'en' | 'hi' = 'en',
  fallbackText?: string
): string {
  if (!error && !fallbackText) {
    return language === 'hi' ? COMMON_ERROR_MESSAGES.generic.hi : COMMON_ERROR_MESSAGES.generic.en;
  }

  const rawMsg =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : typeof (error as Record<string, unknown>)?.message === 'string'
          ? ((error as Record<string, unknown>).message as string)
          : '';

  // Suppress unresolved i18n keys
  if (
    rawMsg === 'errors.generic' ||
    rawMsg === 'errors.submissionFailed' ||
    rawMsg === 'errors.refreshFailed' ||
    rawMsg === 'errors.taskStartFailed' ||
    rawMsg.startsWith('complaints.statuses.') ||
    rawMsg.startsWith('assignments.statuses.')
  ) {
    return language === 'hi' ? COMMON_ERROR_MESSAGES.generic.hi : COMMON_ERROR_MESSAGES.generic.en;
  }

  const classified = classifyFrontendError(error);

  if (classified.source === 'validation') {
    return language === 'hi' ? classified.messageHi : classified.messageEn;
  }

  if (language === 'hi') {
    return classified.messageHi;
  }

  return classified.messageEn;
}

