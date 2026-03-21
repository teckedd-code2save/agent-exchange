import type { PrismaClient, Prisma, Transaction } from '@prisma/client';

export class TransactionsRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: Prisma.TransactionCreateInput): Promise<Transaction> {
    return this.db.transaction.create({ data });
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<Transaction | null> {
    return this.db.transaction.findUnique({ where: { idempotencyKey } });
  }

  async findByStripePaymentIntentId(stripePaymentIntentId: string): Promise<Transaction | null> {
    return this.db.transaction.findUnique({ where: { stripePaymentIntentId } });
  }

  async settle(id: string): Promise<Transaction> {
    return this.db.transaction.update({
      where: { id },
      data: { status: 'settled', settledAt: new Date() },
    });
  }

  async fail(id: string): Promise<Transaction> {
    return this.db.transaction.update({
      where: { id },
      data: { status: 'failed', failedAt: new Date() },
    });
  }

  async getGmv(since: Date): Promise<{ gross: string; fees: string; count: number }> {
    const result = await this.db.$queryRaw<[{ gross: string; fees: string; count: bigint }]>`
      SELECT
        COALESCE(SUM("grossAmount"), 0)::text AS gross,
        COALESCE(SUM("exchangeFee"), 0)::text AS fees,
        COUNT(*)::bigint AS count
      FROM transactions
      WHERE status = 'settled' AND "settledAt" >= ${since}
    `;
    const row = result[0];
    return {
      gross: row?.gross ?? '0',
      fees: row?.fees ?? '0',
      count: Number(row?.count ?? 0),
    };
  }

  async getTopServicesByVolume(
    since: Date,
    limit = 10,
  ): Promise<Array<{ serviceId: string; volume: string }>> {
    const result = await this.db.$queryRaw<Array<{ serviceId: string; volume: string }>>`
      SELECT "serviceId", SUM("grossAmount")::text AS volume
      FROM transactions
      WHERE status = 'settled' AND "settledAt" >= ${since}
      GROUP BY "serviceId"
      ORDER BY SUM("grossAmount") DESC
      LIMIT ${limit}
    `;
    return result;
  }

  async getUniqueAgentWallets(): Promise<number> {
    const result = await this.db.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT "agentWalletAddress") AS count
      FROM transactions
      WHERE "agentWalletAddress" IS NOT NULL
    `;
    return Number(result[0]?.count ?? 0);
  }
}
