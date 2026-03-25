import { prisma } from '../index';

type CreateCallData = Parameters<typeof prisma.call.create>[0]['data'];

export async function getServiceBySlug(slug: string) {
  return prisma.service.findUnique({
    where: { studioSlug: slug },
    include: { provider: true }
  });
}

export async function createCall(data: CreateCallData) {
  return prisma.call.create({ data });
}

export async function getProviderServices(providerId: string) {
  return prisma.service.findMany({
    where: { providerId },
    orderBy: { createdAt: 'desc' }
  });
}
