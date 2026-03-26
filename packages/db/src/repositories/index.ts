import type { Service, Call, Provider } from '@prisma/client';
import { prisma } from '../index';

type CreateCallData = Parameters<typeof prisma.call.create>[0]['data'];

export async function getServiceBySlug(slug: string): Promise<(Service & { provider: Provider }) | null> {
  return prisma.service.findUnique({
    where: { studioSlug: slug },
    include: { provider: true }
  });
}

export async function createCall(data: CreateCallData): Promise<Call> {
  return prisma.call.create({ data });
}

export async function getProviderServices(providerId: string): Promise<Service[]> {
  return prisma.service.findMany({
    where: { providerId },
    orderBy: { createdAt: 'desc' }
  });
}
