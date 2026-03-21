import { prisma } from '@agent-exchange/db';
import { ServicesRepository } from '@agent-exchange/db/src/repositories/services.repo';
import { OrganisationsRepository } from '@agent-exchange/db/src/repositories/organisations.repo';
import { TransactionsRepository } from '@agent-exchange/db/src/repositories/transactions.repo';
import { HealthRepository } from '@agent-exchange/db/src/repositories/health.repo';
import { AnalyticsRepository } from '@agent-exchange/db/src/repositories/analytics.repo';

export { prisma };

export const repos = {
  services: new ServicesRepository(prisma),
  organisations: new OrganisationsRepository(prisma),
  transactions: new TransactionsRepository(prisma),
  health: new HealthRepository(prisma),
  analytics: new AnalyticsRepository(prisma),
};
