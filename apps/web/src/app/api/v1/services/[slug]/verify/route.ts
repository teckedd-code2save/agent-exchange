import { type NextRequest } from 'next/server';
import { repos } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { problemDetails } from '@/types/index';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: NextRequest,
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
      return problemDetails(403, 'Forbidden', 'Must be org member to submit for verification');
    }

    if (service.status !== 'draft') {
      return problemDetails(409, 'Conflict', `Service is already in "${service.status}" status`);
    }

    await repos.services.submitForVerification(params.slug);

    return Response.json({
      message: 'Service submitted for verification. Review typically takes 1-3 business days.',
      slug: params.slug,
    });
  } catch (err) {
    console.error('[POST /api/v1/services/:slug/verify]', err);
    return problemDetails(500, 'Internal Server Error', 'Failed to submit for verification');
  }
}
