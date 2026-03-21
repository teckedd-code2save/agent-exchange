import { type NextRequest } from 'next/server';
import { repos } from '@/lib/db';
import { requireCronSecret } from '@/lib/auth';
import { problemDetails } from '@/types/index';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const denied = requireCronSecret(req);
  if (denied) return denied;

  try {
    const services = await repos.services.findAllActive();
    const results: Array<{
      serviceId: string;
      slug: string;
      status: string;
      latencyMs?: number;
      error?: string;
    }> = [];

    await Promise.allSettled(
      services.map(async (service) => {
        const start = Date.now();
        try {
          const resp = await fetch(service.serviceUrl, {
            method: 'HEAD',
            signal: AbortSignal.timeout(10000),
          });
          const latencyMs = Date.now() - start;
          const status = resp.ok ? 'up' : resp.status >= 500 ? 'down' : 'degraded';

          await repos.health.record(service.id, status as 'up' | 'degraded' | 'down', resp.status, latencyMs);
          await repos.health.recalculateHealthScore(service.id);
          results.push({ serviceId: service.id, slug: service.slug, status, latencyMs });
        } catch (err) {
          const latencyMs = Date.now() - start;
          const errorMessage = err instanceof Error ? err.message : 'unknown error';
          const status = latencyMs >= 10000 ? 'timeout' : 'down';

          await repos.health.record(service.id, status as 'timeout' | 'down', undefined, latencyMs, errorMessage);
          await repos.health.recalculateHealthScore(service.id);
          results.push({ serviceId: service.id, slug: service.slug, status, error: errorMessage });
        }
      }),
    );

    return Response.json({ checked: results.length, results });
  } catch (err) {
    console.error('[cron:health-check]', err);
    return problemDetails(500, 'Internal Server Error', 'Health check cron failed');
  }
}
