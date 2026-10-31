import { NextRequest, NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth/api-guards';
import { getSanitationWorkers } from '@/lib/db/users';

/**
 * GET /api/assignments/workers
 * Retrieves all active sanitation workers for task allocation dropdowns.
 * Protected: Officer only.
 */
export async function GET(request: NextRequest) {
  const auth = await requireApiRole('officer', request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const workers = await getSanitationWorkers();

    return NextResponse.json({
      success: true,
      count: workers.length,
      workers,
    });
  } catch (error) {
    console.error('[API /api/assignments/workers GET] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch workers',
        details: error instanceof Error ? error.message : 'Unknown database error',
      },
      { status: 500 }
    );
  }
}

