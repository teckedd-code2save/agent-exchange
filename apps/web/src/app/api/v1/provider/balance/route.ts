import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@agent-exchange/db';
import { authenticateProvider } from '@/lib/provider-auth';

export async function GET(req: NextRequest) {
  const auth = await authenticateProvider(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbProvider = await prisma.provider.findUnique({
    where: { userId: auth.userId },
    select: {
      testnetBalance: true,
      liveBalance: true,
      services: { select: { id: true, name: true, status: true } },
    },
  });

  return NextResponse.json(dbProvider ?? { testnetBalance: 0, liveBalance: 0, services: [] });
}
