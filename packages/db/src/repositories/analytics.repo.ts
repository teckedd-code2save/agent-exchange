import type { PrismaClient, Prisma, ServiceStatsDaily } from '@prisma/client';

export interface DiscoveryEventInput {
  apiKeyId?: string | null;
  agentWalletAddress?: string | null;
  queryText?: string | null;
  filters?: Record<string, unknown>;
  resultCount?: number | null;
  paymentMethod?: string | null;
  amount?: string | null;
  currency?: string | null;
}

export class AnalyticsRepository {
  constructor(private readonly db: PrismaClient) {}

  async recordDiscovery(data: DiscoveryEventInput): Promise<void> {
    await this.db.discoveryEvent.create({
      data: {
        apiKeyId: data.apiKeyId ?? null,
        agentWalletAddress: data.agentWalletAddress ?? null,
        queryText: data.queryText ?? null,
        filters: (data.filters ?? {}) as Prisma.InputJsonValue,
        resultCount: data.resultCount ?? null,
        paymentMethod: (data.paymentMethod as Prisma.EnumPaymentMethodFieldUpdateOperationsInput['set']) ?? null,
        amount: data.amount ? data.amount : null,
        currency: data.currency ?? null,
      },
    });
  }

  async getDiscoveryVolume(since: Date): Promise<number> {
    return this.db.discoveryEvent.count({ where: { queriedAt: { gte: since } } });
  }

  async getServiceAnalytics(
    serviceId: string,
    since: Date,
  ): Promise<ServiceStatsDaily[]> {
    return this.db.serviceStatsDaily.findMany({
      where: { serviceId, date: { gte: since } },
      orderBy: { date: 'asc' },
    });
  }

  async rollupDailyStats(date: Date): Promise<void> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const stats = await this.db.$queryRaw<
      Array<{
        serviceId: string;
        endpointCalls: bigint;
        totalVolume: string;
        totalFees: string;
      }>
    >`
      SELECT
        t."serviceId",
        COUNT(*)::bigint AS "endpointCalls",
        COALESCE(SUM(t."grossAmount"), 0)::text AS "totalVolume",
        COALESCE(SUM(t."exchangeFee"), 0)::text AS "totalFees"
      FROM transactions t
      WHERE t."createdAt" BETWEEN ${startOfDay} AND ${endOfDay}
        AND t.status = 'settled'
      GROUP BY t."serviceId"
    `;

    for (const stat of stats) {
      await this.db.serviceStatsDaily.upsert({
        where: { serviceId_date: { serviceId: stat.serviceId, date: startOfDay } },
        create: {
          serviceId: stat.serviceId,
          date: startOfDay,
          endpointCalls: Number(stat.endpointCalls),
          totalVolume: stat.totalVolume,
          totalFees: stat.totalFees,
        },
        update: {
          endpointCalls: Number(stat.endpointCalls),
          totalVolume: stat.totalVolume,
          totalFees: stat.totalFees,
        },
      });
    }
  }

  async getAdminStats(): Promise<{
    activeServiceCount: number;
    uniqueAgentWallets: number;
    discoveryVolume: number;
  }> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [activeServiceCount, uniqueAgentWalletsResult, discoveryVolume] = await Promise.all([
      this.db.service.count({ where: { status: 'active', deletedAt: null } }),
      this.db.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(DISTINCT "agentWalletAddress") AS count
        FROM transactions
        WHERE "agentWalletAddress" IS NOT NULL
      `,
      this.db.discoveryEvent.count({ where: { queriedAt: { gte: thirtyDaysAgo } } }),
    ]);

    return {
      activeServiceCount,
      uniqueAgentWallets: Number(uniqueAgentWalletsResult[0]?.count ?? 0),
      discoveryVolume,
    };
  }
}
