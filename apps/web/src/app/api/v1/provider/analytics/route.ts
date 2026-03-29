import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@agent-exchange/db';
import { authenticateProvider } from '@/lib/provider-auth';

export async function GET(req: NextRequest) {
  const auth = await authenticateProvider(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbProvider = await prisma.provider.findUnique({ where: { userId: auth.userId } });
  if (!dbProvider) {
    return NextResponse.json({ totalRevenue: 0, totalCalls: 0, services: [] });
  }

  const services = await prisma.service.findMany({
    where: { providerId: dbProvider.id },
    include: {
      calls: {
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        select: {
          status: true,
          amount: true,
          environment: true,
          latencyMs: true,
          challengeSolved: true,
        },
      },
    },
  });

  const summary = services.map((svc) => {
    const calls = svc.calls;
    const successCalls = calls.filter((c) => c.status >= 200 && c.status < 300);
    const paidCalls = calls.filter((c) => c.challengeSolved);
    const revenue = paidCalls.reduce((sum, c) => sum + Number(c.amount), 0);
    const avgLatency =
      calls.length > 0
        ? Math.round(calls.reduce((sum, c) => sum + c.latencyMs, 0) / calls.length)
        : 0;

    return {
      serviceId: svc.id,
      name: svc.name,
      studioSlug: svc.studioSlug,
      status: svc.status,
      stats: {
        totalCallsAllTime: svc.totalCalls,
        callsLast30d: calls.length,
        successRate: calls.length > 0 ? Math.round((successCalls.length / calls.length) * 100) : 0,
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
      id: dbProvider.id,
      testnetBalance: dbProvider.testnetBalance,
      liveBalance: dbProvider.liveBalance,
    },
    summary: {
      totalRevenue: totalRevenue.toFixed(4),
      totalCallsLast30d: totalCalls,
      serviceCount: services.length,
    },
    services: summary,
  });
}
