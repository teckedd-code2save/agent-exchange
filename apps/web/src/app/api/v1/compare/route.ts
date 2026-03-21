import { type NextRequest } from 'next/server';
import { repos } from '@/lib/db';
import { getCache } from '@/lib/cache';
import { prisma } from '@/lib/db';
import { withMppAuth } from '@agent-exchange/mpp';
import { problemDetails } from '@/types/index';
import type { MppContext } from '@agent-exchange/mpp';

export const dynamic = 'force-dynamic';

const mppHandler = withMppAuth(
  async (req: Request, _ctx: MppContext): Promise<Response> => {
    const { searchParams } = new URL(req.url);
    const slugsParam = searchParams.get('slugs');

    if (!slugsParam) {
      return problemDetails(400, 'Bad Request', 'slugs query param required (comma-separated)');
    }

    const slugs = slugsParam.split(',').map((s) => s.trim()).filter(Boolean);
    if (slugs.length < 2 || slugs.length > 5) {
      return problemDetails(400, 'Bad Request', 'Provide 2-5 service slugs for comparison');
    }

    const services = await repos.services.compare(slugs);
    return Response.json({ services });
  },
  {
    amount: '0.001',
    currency: 'USDC',
    methods: ['tempo', 'stripe'],
    db: prisma,
    cache: getCache(),
  },
);

export async function GET(req: NextRequest) {
  try {
    return await mppHandler(req);
  } catch (err) {
    console.error('[GET /api/v1/compare]', err);
    return problemDetails(500, 'Internal Server Error', 'Compare failed');
  }
}
