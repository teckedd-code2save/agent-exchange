import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@agent-exchange/db';
import { getCurrentActor } from '@/lib/auth';

/**
 * POST /api/v1/provider/services — Register a new service
 * GET  /api/v1/provider/services — List my services
 */

export async function GET() {
  const { userId } = await getCurrentActor();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const provider = await prisma.provider.findUnique({ where: { userId } });
  if (!provider) return NextResponse.json({ results: [], message: 'No services yet' });

  const services = await prisma.service.findMany({
    where: { providerId: provider.id },
    include: {
      _count: { select: { calls: true, reviews: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ results: services });
}

export async function POST(request: NextRequest) {
  const { userId, email, isBypass } = await getCurrentActor();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  // Validate required fields
  const { name, description, endpoint, category, pricingConfig } = body;
  if (!name || !description || !endpoint || !category) {
    return NextResponse.json(
      { error: 'Missing required fields: name, description, endpoint, category' },
      { status: 400 }
    );
  }

  // Upsert provider (create if first service)
  const provider = await prisma.provider.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      email: body.email ?? email ?? `${userId}@mpp.studio`,
    },
  });

  // Auto-generate a clean slug from the service name
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Ensure uniqueness
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
      status: 'sandbox', // Always start in sandbox
      pricingType: body.pricingType ?? 'fixed',
      pricingConfig: pricingConfig ?? { amount: '0.01', currency: 'USDC' },
      supportedPayments: body.supportedPayments ?? ['sandbox'],
      mppChallengeEndpoint: body.mppChallengeEndpoint ?? null,
      providerId: provider.id,
    },
  });

  return NextResponse.json({
    service,
    sandboxEndpoint: `${request.nextUrl.origin}/api/v1/proxy/${slug}`,
    message: '🎉 Service registered! Test it in sandbox mode using the sandboxEndpoint.',
    authMode: isBypass ? 'bypass' : 'supabase',
    nextSteps: [
      '1. Make a POST request to sandboxEndpoint — you\'ll get a 402 challenge',
      '2. Resend with Authorization: Payment sandbox-credential',
      '3. Your service endpoint will be called and the response proxied back',
      '4. Once tested, promote to testnet via PATCH /api/v1/provider/services/:id',
    ],
  }, { status: 201 });
}
