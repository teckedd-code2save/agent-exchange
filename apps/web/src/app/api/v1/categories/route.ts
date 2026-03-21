import { repos } from '@/lib/db';
import { problemDetails } from '@/types/index';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await repos.services.getCategories();
    return Response.json({ categories });
  } catch (err) {
    console.error('[GET /api/v1/categories]', err);
    return problemDetails(500, 'Internal Server Error', 'Failed to fetch categories');
  }
}
