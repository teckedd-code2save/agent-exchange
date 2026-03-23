/**
 * Echo endpoint — reflects the request back as JSON.
 * Used as the upstream for the local test service so the gateway 402 flow
 * can complete with a real 200 response.
 *
 * Returns:
 *   { method, path, headers, body, receivedAt }
 */
import { type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

async function handle(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = '/' + params.path.join('/');

  // Parse body if present
  let body: unknown = null;
  const contentType = req.headers.get('content-type') ?? '';
  if (!['GET', 'HEAD'].includes(req.method) && req.body) {
    try {
      body = contentType.includes('application/json')
        ? await req.json()
        : await req.text();
    } catch {
      body = null;
    }
  }

  // Collect headers (exclude internal Next.js ones)
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    if (!key.startsWith('x-nextjs') && key !== 'host') {
      headers[key] = value;
    }
  });

  const payload = {
    echo: true,
    method: req.method,
    path,
    query: Object.fromEntries(req.nextUrl.searchParams),
    headers,
    body,
    receivedAt: new Date().toISOString(),
    // Surface exchange-injected headers prominently
    agentWallet: req.headers.get('x-agent-wallet') ?? null,
    exchangeTxHint: req.headers.get('x-agent-exchange-id') ?? null,
  };

  return Response.json(payload, {
    status: 200,
    headers: { 'x-echo': 'true' },
  });
}

export const GET    = handle;
export const POST   = handle;
export const PUT    = handle;
export const PATCH  = handle;
export const DELETE = handle;
