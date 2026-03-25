import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@agent-exchange/db';

/**
 * GET /api/v1/services/:slug
 * 
 * Machine-readable service contract.
 * Agents call this to get the full spec before invoking.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const service = await prisma.service.findFirst({
    where: {
      OR: [{ id: params.slug }, { studioSlug: params.slug }]
    },
    include: {
      reviews: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { rating: true, comment: true, createdAt: true }
      },
      _count: { select: { calls: true, reviews: true } }
    }
  });

  if (!service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  const baseUrl = request.nextUrl.origin;
  const avgRating = service.reviews.length
    ? service.reviews.reduce(
        (s: number, r: (typeof service.reviews)[number]) => s + r.rating,
        0
      ) / service.reviews.length
    : null;

  // Machine-readable contract — everything an agent needs to know
  return NextResponse.json({
    id: service.id,
    name: service.name,
    description: service.description,
    category: service.category,
    tags: service.tags,
    status: service.status,
    pricing: {
      type: service.pricingType,
      config: service.pricingConfig,
    },
    payment: {
      methods: service.supportedPayments,
      challengeEndpoint: service.mppChallengeEndpoint ?? `${baseUrl}/api/v1/proxy/${service.studioSlug}`,
    },
    proxy: {
      endpoint: `${baseUrl}/api/v1/proxy/${service.studioSlug}`,
      environment: service.status,
    },
    stats: {
      totalCalls: service.totalCalls,
      callsThisMonth: service._count.calls,
      avgRating,
      reviewCount: service._count.reviews,
    },
    recentReviews: service.reviews,
    // How an agent should invoke this service
    usageHint: {
      step1: 'Make a request to proxy.endpoint — you will receive a 402 with WWW-Authenticate header',
      step2: 'Parse the challenge from the WWW-Authenticate header',
      step3: 'For sandbox: send Authorization: Payment sandbox-credential',
      step4: 'For testnet/live: use mppx SDK to sign a real payment credential',
    }
  });
}
