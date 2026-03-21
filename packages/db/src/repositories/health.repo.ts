import type { PrismaClient, HealthCheck, HealthStatus } from '@prisma/client';

export class HealthRepository {
  constructor(private readonly db: PrismaClient) {}

  async record(
    serviceId: string,
    status: HealthStatus,
    httpStatus?: number,
    latencyMs?: number,
    errorMessage?: string,
  ): Promise<HealthCheck> {
    return this.db.healthCheck.create({
      data: {
        serviceId,
        status,
        // Use null coalescing to satisfy exactOptionalPropertyTypes
        httpStatus: httpStatus ?? null,
        latencyMs: latencyMs ?? null,
        errorMessage: errorMessage ?? null,
      },
    });
  }

  async recalculateHealthScore(serviceId: string): Promise<number> {
    const recentChecks = await this.db.healthCheck.findMany({
      where: { serviceId },
      orderBy: { checkedAt: 'desc' },
      take: 20,
    });

    if (recentChecks.length === 0) return 100;

    const upCount = recentChecks.filter((c) => c.status === 'up').length;
    const score = Math.round((upCount / recentChecks.length) * 100);

    await this.db.service.update({
      where: { id: serviceId },
      data: { healthScore: score },
    });

    return score;
  }

  async getLatest(serviceId: string): Promise<HealthCheck | null> {
    return this.db.healthCheck.findFirst({
      where: { serviceId },
      orderBy: { checkedAt: 'desc' },
    });
  }
}
