import { type NextRequest } from 'next/server';
import { repos } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { problemDetails } from '@/types/index';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } },
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
      path: string;
      method?: string;
      name: string;
      description?: string;
      rateLimitRpm?: number;
    };

    if (!body.path || !body.name) {
      return problemDetails(400, 'Bad Request', 'path and name are required');
    }

    const endpoint = await repos.services.addEndpoint(service.id, {
      path: body.path,
      method: (body.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE') ?? 'POST',
      name: body.name,
      description: body.description,
      rateLimitRpm: body.rateLimitRpm,
    });

    return Response.json({ id: endpoint.id }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/v1/services/:slug/endpoints]', err);
    return problemDetails(500, 'Internal Server Error', 'Failed to add endpoint');
  }
}
