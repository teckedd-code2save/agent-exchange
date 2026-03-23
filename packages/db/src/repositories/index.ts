import { prisma } from '../index';
import type { Prisma } from '@prisma/client';

export async function getServiceBySlug(slug: string) {
  return prisma.service.findUnique({
    where: { studioSlug: slug },
    include: { provider: true }
  });
}

export async function createCall(data: Prisma.CallUncheckedCreateInput) {
  return prisma.call.create({ data });
}

export async function getProviderServices(providerId: string) {
  return prisma.service.findMany({
    where: { providerId },
    orderBy: { createdAt: 'desc' }
  });
}
