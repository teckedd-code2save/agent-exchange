import { type NextRequest } from 'next/server';
import { repos } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { problemDetails } from '@/types/index';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const filters = {
      category: searchParams.get('category') ?? undefined,
      protocol: searchParams.get('protocol') ?? undefined,
      method: searchParams.get('method') ?? undefined,
      classification: searchParams.get('classification') ?? undefined,
      region: searchParams.get('region') ?? undefined,
      q: searchParams.get('q') ?? undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0,
    };

    const result = await repos.services.list(filters);

    return Response.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (err) {
    console.error('[GET /api/v1/services]', err);
    return problemDetails(500, 'Internal Server Error', 'Failed to list services');
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { userId } = authResult;

  try {
    const body = (await req.json()) as {
      name: string;
      slug: string;
      description: string;
      serviceUrl: string;
      tagline?: string;
      organisationId: string;
    };

    if (!body.name || !body.slug || !body.description || !body.serviceUrl || !body.organisationId) {
      return problemDetails(400, 'Bad Request', 'name, slug, description, serviceUrl, organisationId are required');
    }

    // Verify org membership
    const membership = await repos.organisations.findMembership(body.organisationId, userId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return problemDetails(403, 'Forbidden', 'Must be org owner or admin to create services');
    }

    // Validate serviceUrl is reachable (best-effort)
    try {
      const check = await fetch(body.serviceUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
      if (!check.ok && check.status !== 404) {
        console.warn(`[POST /api/v1/services] serviceUrl returned ${check.status}`);
      }
    } catch {
      // Non-blocking — service may not have HEAD support
    }

    const service = await repos.services.create({
      name: body.name,
      slug: body.slug,
      description: body.description,
      serviceUrl: body.serviceUrl,
      tagline: body.tagline,
      status: 'draft',
      organisation: { connect: { id: body.organisationId } },
    });

    return Response.json(
      {
        id: service.id,
        slug: service.slug,
        nextSteps: [
          'Add protocols via POST /api/v1/services/:slug/protocols',
          'Add endpoints via POST /api/v1/services/:slug/endpoints',
          'Submit for verification via POST /api/v1/services/:slug/verify',
        ],
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('[POST /api/v1/services]', err);
    return problemDetails(500, 'Internal Server Error', 'Failed to create service');
  }
}
