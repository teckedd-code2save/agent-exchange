import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@agent-exchange/db';
import { authenticateProvider } from '@/lib/provider-auth';

export async function GET(req: NextRequest) {
  const auth = await authenticateProvider(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbProvider = await prisma.provider.findUnique({ where: { userId: auth.userId } });
  if (!dbProvider) return NextResponse.json({ results: [] });

  const serviceIds = (
    await prisma.service.findMany({
      where: { providerId: dbProvider.id },
      select: { id: true },
    })
  ).map((s) => s.id);

  if (serviceIds.length === 0) return NextResponse.json({ results: [] });

  const calls = await prisma.call.findMany({
    where: { serviceId: { in: serviceIds } },
    include: { service: { select: { name: true, studioSlug: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ results: calls });
}
