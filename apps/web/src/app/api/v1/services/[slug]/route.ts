import { type NextRequest } from 'next/server';
import { repos } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { problemDetails } from '@/types/index';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const service = await repos.services.findBySlug(params.slug);
    if (!service) {
      return problemDetails(404, 'Not Found', `Service "${params.slug}" not found`);
    }

    return Response.json(service, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
    });
  } catch (err) {
    console.error('[GET /api/v1/services/:slug]', err);
    return problemDetails(500, 'Internal Server Error', 'Failed to fetch service');
  }
}

export async function PATCH(
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

    const body = (await req.json()) as Record<string, unknown>;
    const allowedFields = ['name', 'description', 'tagline', 'serviceUrl', 'logoUrl', 'llmsTxtUrl'];
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }

    const updated = await repos.services.update(params.slug, updateData);
    return Response.json(updated);
  } catch (err) {
    console.error('[PATCH /api/v1/services/:slug]', err);
    return problemDetails(500, 'Internal Server Error', 'Failed to update service');
  }
}

export async function DELETE(
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
    if (!membership || membership.role !== 'owner') {
      return problemDetails(403, 'Forbidden', 'Only org owner can delete services');
    }

    await repos.services.softDelete(params.slug);
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('[DELETE /api/v1/services/:slug]', err);
    return problemDetails(500, 'Internal Server Error', 'Failed to delete service');
  }
}
