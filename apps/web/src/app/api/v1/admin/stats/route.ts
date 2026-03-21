import { type NextRequest } from 'next/server';
import { repos } from '@/lib/db';
import { requireAdminKey } from '@/lib/auth';
import { problemDetails } from '@/types/index';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const denied = requireAdminKey(req);
  if (denied) return denied;

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [gmv, adminStats, topServices] = await Promise.all([
      repos.transactions.getGmv(thirtyDaysAgo),
      repos.analytics.getAdminStats(),
      repos.transactions.getTopServicesByVolume(thirtyDaysAgo, 10),
    ]);

    return Response.json({
      period: { start: thirtyDaysAgo.toISOString(), end: new Date().toISOString() },
      gmv: { gross: gmv.gross, fees: gmv.fees, transactionCount: gmv.count },
      services: { active: adminStats.activeServiceCount },
      agents: { uniqueWallets: adminStats.uniqueAgentWallets },
      discovery: { queryVolume: adminStats.discoveryVolume },
      topServicesByVolume: topServices,
    });
  } catch (err) {
    console.error('[GET /api/v1/admin/stats]', err);
    return problemDetails(500, 'Internal Server Error', 'Failed to fetch admin stats');
  }
}
