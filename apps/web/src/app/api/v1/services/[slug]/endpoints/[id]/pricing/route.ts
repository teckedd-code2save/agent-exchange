import { type NextRequest } from 'next/server';
import { repos, prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { problemDetails } from '@/types/index';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } },
) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { userId } = authResult;

  try {
    const service = await repos.services.findBySlug(params.slug);
    if (!service) {
      return problemDetails(404, 'Not Found', `Service "${params.slug}" not found`);
    }

    const membership = await repos.organisations.findMembership(service.organisationId, userId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return problemDetails(403, 'Forbidden', 'Must be org owner or admin');
    }

    const body = (await req.json()) as {
      paymentMethodId: string;
      pricingModel?: string;
      amount: string;
      currency?: string;
      unit?: string;
    };

    if (!body.paymentMethodId || !body.amount) {
      return problemDetails(400, 'Bad Request', 'paymentMethodId and amount are required');
    }

    // Verify endpoint belongs to this service
    const endpoint = await prisma.serviceEndpoint.findFirst({
      where: { id: params.id, serviceId: service.id },
    });
    if (!endpoint) {
      return problemDetails(404, 'Not Found', `Endpoint "${params.id}" not found on this service`);
    }

    const pricing = await repos.services.addEndpointPricing(
      params.id,
      body.paymentMethodId,
      {
        pricingModel: (body.pricingModel as 'flat' | 'per_token' | 'per_byte' | 'per_second' | 'tiered') ?? 'flat',
        amount: body.amount,
        currency: body.currency ?? 'USDC',
        unit: body.unit,
      },
    );

    return Response.json({ id: pricing.id }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/v1/services/:slug/endpoints/:id/pricing]', err);
    return problemDetails(500, 'Internal Server Error', 'Failed to add endpoint pricing');
  }
}
