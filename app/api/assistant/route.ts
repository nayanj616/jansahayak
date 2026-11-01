import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { answerCivicQuestion } from '@/lib/gemini/assistant';
import { isChatbotConfigured } from '@/lib/gemini/client';

const civicQuestionRequestSchema = z.object({
  question: z
    .string({
      error: 'Question is required',
    })
    .trim()
    .min(2, { message: 'Question must be at least 2 characters long' })
    .max(500, { message: 'Question cannot exceed 500 characters' }),
  context: z.string().trim().max(1000).optional(),
});

/**
 * In-memory sliding-window request limiter for academic demonstration (Phase 4B.1 M-2).
 * Note: In-memory rate limiting is process-local and does not provide distributed
 * production protection across multiple server workers or serverless instances.
 */
interface RateLimitEntry {
  timestamps: number[];
}

export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
export const MAX_REQUESTS_PER_WINDOW = 10;

const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Resets the in-memory rate limiter state. Exported for test isolation.
 */
export function resetRateLimiter(): void {
  rateLimitMap.clear();
}

/**
 * Validates request rate against client IP sliding window.
 */
export function checkRateLimit(ip: string, now: number = Date.now()): {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
} {
  const entry = rateLimitMap.get(ip) || { timestamps: [] };
  // Prune expired timestamps
  const validTimestamps = entry.timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = validTimestamps[0];
    const resetSeconds = Math.max(1, Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000));
    return {
      allowed: false,
      limit: MAX_REQUESTS_PER_WINDOW,
      remaining: 0,
      resetSeconds,
    };
  }

  validTimestamps.push(now);
  rateLimitMap.set(ip, { timestamps: validTimestamps });

  return {
    allowed: true,
    limit: MAX_REQUESTS_PER_WINDOW,
    remaining: MAX_REQUESTS_PER_WINDOW - validTimestamps.length,
    resetSeconds: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
  };
}

/**
 * Safely extracts client IP address under the application's deployment assumptions.
 *
 * Security & Deployment Boundaries:
 * 1. Standard Next.js server instances (e.g. `next start` / `next dev`) do not sanitize
 *    client-supplied HTTP headers. Without an authenticated reverse-proxy boundary
 *    (e.g., AWS ALB, Cloudflare, Vercel Edge) stripping incoming `X-Forwarded-For` headers,
 *    any client can spoof arbitrary IPs. Accepting client-supplied forwarding headers as
 *    authoritative allows adversaries to bypass rate limits by rotating headers or deny service
 *    to legitimate citizens by spoofing victim IPs.
 * 2. When deployed behind a verified gateway, set TRUSTED_PROXY='true' in the environment.
 *    Only in that mode does the server trust `x-forwarded-for` (first IP) and `x-real-ip`.
 * 3. Platform-provided trusted client IP (`request.ip` from Next.js Edge or host environment)
 *    is always preferred when present.
 * 4. When no trusted boundary is established, the function falls back to a conservative
 *    process-local bucket ('untrusted-fallback'). This ensures that untrusted clients cannot
 *    evade limits through header manipulation, while accurately reflecting that true per-IP
 *    isolation requires infrastructure-level proxy guarantees.
 */
export function getClientIp(
  request: NextRequest,
  options?: { trustProxy?: boolean }
): string {
  // 1. Prefer platform-provided trusted client IP if exposed by runtime
  const extendedReq = request as unknown as { ip?: string };
  if (extendedReq.ip && extendedReq.ip.trim()) {
    return extendedReq.ip.trim();
  }

  // 2. Only trust forwarded headers if trusted proxy boundary is explicitly enabled
  const isTrustedProxy =
    options?.trustProxy ?? process.env.TRUSTED_PROXY === 'true';

  if (isTrustedProxy) {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      const clientIp = forwardedFor.split(',')[0].trim();
      if (clientIp) return clientIp;
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp && realIp.trim()) {
      return realIp.trim();
    }
  }

  // 3. Conservative fallback when no verified IP source is established
  return 'untrusted-fallback';
}

/**
 * POST /api/assistant
 * Handles citizen questions about government welfare schemes.
 * Deterministic retrieval and source-grounded Gemini completion are executed server-side.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting Check (10 requests per minute per IP)
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(clientIp);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Civic Assistant allows up to 10 requests per minute per citizen.',
          retryAfterSeconds: rateCheck.resetSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateCheck.resetSeconds),
            'X-RateLimit-Limit': String(rateCheck.limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // 2. Request body parsing
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request payload' },
        { status: 400 }
      );
    }

    const parseResult = civicQuestionRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Invalid question format';
      return NextResponse.json(
        {
          error: firstError,
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { question, context } = parseResult.data;

    // 3. Check if chatbot is configured before attempting execution
    if (!isChatbotConfigured()) {
      return NextResponse.json(
        {
          error: 'Civic Assistant is currently unconfigured. GEMINI_CHATBOT_API_KEY is not set.',
          isConfigured: false,
        },
        { status: 503 }
      );
    }

    // 4. Execute server-side retrieval and answer formulation
    const result = await answerCivicQuestion(question, context);

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      {
        headers: {
          'X-RateLimit-Limit': String(rateCheck.limit),
          'X-RateLimit-Remaining': String(rateCheck.remaining),
        },
      }
    );
  } catch (error) {
    // Prevent leaking private server or credential details
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Civic Assistant API Error]', message);

    // Provide safe, user-facing error message
    if (message.includes('GEMINI_CHATBOT_API_KEY')) {
      return NextResponse.json(
        {
          error: 'Civic Assistant service is currently unavailable due to configuration.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'Unable to process your question at this time. Please try again shortly.',
      },
      { status: 500 }
    );
  }
}
