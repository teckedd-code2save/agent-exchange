import { type NextRequest } from 'next/server';
import { repos } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { problemDetails } from '@/types/index';

export const dynamic = 'force-dynamic';

export async function GET(
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
    if (!membership) {
      return problemDetails(403, 'Forbidden', 'Must be org member to view analytics');
    }

    const days = parseInt(req.nextUrl.searchParams.get('days') ?? '30', 10);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const stats = await repos.analytics.getServiceAnalytics(service.id, since);

    return Response.json({ serviceId: service.id, slug: params.slug, stats });
  } catch (err) {
    console.error('[GET /api/v1/services/:slug/analytics]', err);
    return problemDetails(500, 'Internal Server Error', 'Failed to fetch analytics');
  }
}
