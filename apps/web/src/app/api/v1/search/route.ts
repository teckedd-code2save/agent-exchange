import { type NextRequest } from 'next/server';
import { repos } from '@/lib/db';
import { getCache } from '@/lib/cache';
import { prisma } from '@/lib/db';
import { withMppAuth } from '@agent-exchange/mpp';
import { problemDetails } from '@/types/index';
import type { MppContext } from '@agent-exchange/mpp';

export const dynamic = 'force-dynamic';

const mppHandler = withMppAuth(
  async (req: Request, ctx: MppContext): Promise<Response> => {
    const body = (await req.json()) as {
      query: string;
      filters?: Record<string, unknown>;
      limit?: number;
    };

    if (!body.query || typeof body.query !== 'string') {
      return problemDetails(400, 'Bad Request', 'query string is required');
    }

    const limit = Math.min(body.limit ?? 20, 100);
    const result = await repos.services.search(body.query, limit);

    // Write discovery event async (non-blocking)
    void repos.analytics.recordDiscovery({
      agentWalletAddress: ctx.agentWalletAddress,
      queryText: body.query,
      filters: body.filters ?? {},
      resultCount: result.meta.total,
      paymentMethod: ctx.paymentMethod,
      amount: null,
      currency: null,
      apiKeyId: null,
    });

    return Response.json(result);
  },
  {
    amount: '0.001',
    currency: 'USDC',
    methods: ['tempo', 'stripe'],
    db: prisma,
    cache: getCache(),
  },
);

export async function POST(req: NextRequest) {
  try {
    return await mppHandler(req);
  } catch (err) {
    console.error('[POST /api/v1/search]', err);
    return problemDetails(500, 'Internal Server Error', 'Search failed');
  }
}
