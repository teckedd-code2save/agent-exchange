import { NextResponse } from 'next/server';
import { prisma } from '@agent-exchange/db';
import { createSupabaseServerClient } from '@/lib/supabase';

/**
 * GET /api/v1/provider/analytics
 * 
 * Dashboard analytics for a provider.
 * Returns aggregated stats for all their services.
 */
export async function GET() {
  const supabase = createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); const userId = user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const provider = await prisma.provider.findUnique({ where: { userId } });
  if (!provider) return NextResponse.json({ totalRevenue: 0, totalCalls: 0, services: [] });

  const services = await prisma.service.findMany({
    where: { providerId: provider.id },
    include: {
      calls: {
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        select: {
          status: true,
          amount: true,
          environment: true,
          createdAt: true,
          latencyMs: true,
          challengeSolved: true,
        },
      },
    },
  });

  const summary = services.map((service) => {
    const calls = service.calls;
    const successfulCalls = calls.filter((c) => c.status >= 200 && c.status < 300);
    const paidCalls = calls.filter((c) => c.challengeSolved);
    const revenue = paidCalls.reduce((sum, c) => sum + Number(c.amount), 0);
    const avgLatency =
      calls.length > 0
        ? Math.round(calls.reduce((sum, c) => sum + c.latencyMs, 0) / calls.length)
        : 0;

    return {
      serviceId: service.id,
      name: service.name,
      studioSlug: service.studioSlug,
      status: service.status,
      stats: {
        totalCallsAllTime: service.totalCalls,
        callsLast30d: calls.length,
        successRate:
          calls.length > 0 ? Math.round((successfulCalls.length / calls.length) * 100) : 0,
        paidCalls: paidCalls.length,
        revenueUsd: revenue.toFixed(4),
        avgLatencyMs: avgLatency,
        byEnvironment: {
          sandbox: calls.filter((c) => c.environment === 'sandbox').length,
          testnet: calls.filter((c) => c.environment === 'testnet').length,
          production: calls.filter((c) => c.environment === 'production').length,
        },
      },
    };
  });

  const totalRevenue = summary.reduce((sum, s) => sum + parseFloat(s.stats.revenueUsd), 0);
  const totalCalls = summary.reduce((sum, s) => sum + s.stats.callsLast30d, 0);

  return NextResponse.json({
    provider: {
      id: provider.id,
      testnetBalance: provider.testnetBalance,
      liveBalance: provider.liveBalance,
    },
    summary: {
      totalRevenue: totalRevenue.toFixed(4),
      totalCallsLast30d: totalCalls,
      serviceCount: services.length,
    },
    services: summary,
  });
}
