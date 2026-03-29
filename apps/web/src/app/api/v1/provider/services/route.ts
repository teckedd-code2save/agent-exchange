import { NextRequest, NextResponse } from 'next/server';
import { Prisma, prisma } from '@agent-exchange/db';
import { authenticateProvider } from '@/lib/provider-auth';

export async function GET(req: NextRequest) {
  const auth = await authenticateProvider(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbProvider = await prisma.provider.findUnique({ where: { userId: auth.userId } });
  if (!dbProvider) {
    return NextResponse.json({ results: [], message: 'No services yet' });
  }

  const services = await prisma.service.findMany({
    where: { providerId: dbProvider.id },
    include: { _count: { select: { calls: true, reviews: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ results: services });
}

export async function POST(req: NextRequest) {
  const auth = await authenticateProvider(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as {
    name: string;
    description: string;
    endpoint: string;
    category: string;
    endpoints?: unknown[];
    pricingConfig?: { amount?: string; currency?: string };
    pricingType?: string;
    tags?: string[];
    supportedPayments?: string[];
    mppChallengeEndpoint?: string;
    email?: string;
  };

  const { name, description, endpoint, category, pricingConfig } = body;
  if (!name || !description || !endpoint || !category) {
    return NextResponse.json(
      { error: 'Missing required fields: name, description, endpoint, category' },
      { status: 400 },
    );
  }

  const dbProvider = await prisma.provider.upsert({
    where: { userId: auth.userId },
    update: {},
    create: {
      userId: auth.userId,
      email: body.email ?? auth.email ?? `${auth.userId}@mpp.studio`,
    },
  });

  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  let slug = baseSlug;
  let counter = 1;
  while (await prisma.service.findUnique({ where: { studioSlug: slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const service = await prisma.service.create({
    data: {
      name,
      description,
      endpoint,
      studioSlug: slug,
      category,
      tags: body.tags ?? [],
      status: 'sandbox',
      pricingType: (body.pricingType as never) ?? 'fixed',
      pricingConfig: pricingConfig ?? { amount: '0.01', currency: 'USDC' },
      endpoints: body.endpoints
        ? (body.endpoints as Prisma.InputJsonValue)
        : undefined,
      supportedPayments: (body.supportedPayments as never) ?? ['sandbox'],
      mppChallengeEndpoint: body.mppChallengeEndpoint ?? null,
      providerId: dbProvider.id,
    },
  });

  const origin = new URL(req.url).origin;
  return NextResponse.json(
    {
      service,
      sandboxEndpoint: `${origin}/api/v1/proxy/${slug}`,
      message: 'Service registered! Test it in sandbox mode using the sandboxEndpoint.',
      nextSteps: [
        "1. POST to sandboxEndpoint — you'll get a 402 challenge",
        '2. Resend with Authorization: Payment sandbox-credential',
        '3. Your endpoint will be called and the response proxied back',
        '4. Once tested, promote to testnet',
      ],
    },
    { status: 201 },
  );
}
