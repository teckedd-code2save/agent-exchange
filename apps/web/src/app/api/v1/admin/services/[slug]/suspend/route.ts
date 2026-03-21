import { type NextRequest } from 'next/server';
import { repos } from '@/lib/db';
import { requireAdminKey } from '@/lib/auth';
import { problemDetails } from '@/types/index';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const denied = requireAdminKey(req);
  if (denied) return denied;

  try {
    const service = await repos.services.findBySlug(params.slug);
    if (!service) {
      return problemDetails(404, 'Not Found', `Service "${params.slug}" not found`);
    }

    await repos.services.suspend(params.slug);
    return Response.json({ slug: params.slug, status: 'suspended' });
  } catch (err) {
    console.error('[POST /api/v1/admin/services/:slug/suspend]', err);
    return problemDetails(500, 'Internal Server Error', 'Failed to suspend service');
  }
}
