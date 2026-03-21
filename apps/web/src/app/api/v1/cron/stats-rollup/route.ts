import { type NextRequest } from 'next/server';
import { repos } from '@/lib/db';
import { requireCronSecret } from '@/lib/auth';
import { problemDetails } from '@/types/index';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const denied = requireCronSecret(req);
  if (denied) return denied;

  try {
    // Aggregate previous day (UTC)
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    yesterday.setUTCHours(0, 0, 0, 0);

    await repos.analytics.rollupDailyStats(yesterday);

    return Response.json({
      aggregated: true,
      date: yesterday.toISOString().split('T')[0],
    });
  } catch (err) {
    console.error('[cron:stats-rollup]', err);
    return problemDetails(500, 'Internal Server Error', 'Stats rollup cron failed');
  }
}
