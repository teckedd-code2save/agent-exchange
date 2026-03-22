/**
 * MPP Gateway — proxies requests to service providers after verifying payment credentials.
 *
 * Flow:
 *   1. No Authorization header → issue 402 + WWW-Authenticate challenge
 *   2. Authorization: Payment <b64> → verify credential
 *   3. On valid credential → proxy request to service.serviceUrl, record transaction
 *   4. Replay same credential → 401 already-used
 */

import { type NextRequest } from 'next/server';
import { randomBytes } from 'crypto';
import Decimal from 'decimal.js';
import { prisma, repos } from '@/lib/db';
import { getCache } from '@/lib/cache';
import { issueChallenge } from '@agent-exchange/mpp/src/challenge';
import { verifyCredential } from '@agent-exchange/mpp/src/verify';
import { problemDetails } from '@/types/index';
import type { PaymentMethod } from '@agent-exchange/mpp/src/types';

export const dynamic = 'force-dynamic';

// Exchange fee percentage (10%)
const EXCHANGE_FEE_PCT = new Decimal('0.10');

type RouteParams = { params: { slug: string; path: string[] } };

async function handle(req: NextRequest, { params }: RouteParams): Promise<Response> {
  const { slug, path } = params;
  const endpointPath = '/' + path.join('/');
  const cache = getCache();

  // ── 1. Resolve service ──────────────────────────────────────────────────
  const service = await repos.services.findBySlug(slug);
  if (!service || service.status !== 'active') {
    return problemDetails(404, 'Not Found', `Service "${slug}" not found or not active`);
  }

  // ── 2. Resolve endpoint + pricing ──────────────────────────────────────
  const endpoint = service.endpoints.find((e) => e.path === endpointPath);
  if (!endpoint) {
    return problemDetails(
      404,
      'Not Found',
      `Endpoint "${endpointPath}" not registered for service "${slug}". ` +
        `Available: ${service.endpoints.map((e) => e.path).join(', ')}`,
    );
  }

  // Pick active payment methods on this service
  const activeMethods = service.paymentMethods
    .filter((pm) => pm.isActive)
    .map((pm) => pm.method as PaymentMethod);

  if (activeMethods.length === 0) {
    return problemDetails(503, 'Service Unavailable', 'Service has no active payment methods');
  }

  // Pick best pricing for first active method
  const primaryMethod = activeMethods[0]!;
  const pricing = endpoint.pricing.find((p) => {
    const pmMethod = service.paymentMethods.find((pm) => pm.id === p.paymentMethodId)?.method;
    return pmMethod === primaryMethod;
  }) ?? endpoint.pricing[0];

  const amount = pricing?.amount.toString() ?? '0.001000';
  const currency = pricing?.currency ?? 'USDC';

  // ── 3. Check for Authorization header ──────────────────────────────────
  const authHeader = req.headers.get('authorization') ?? '';

  if (!authHeader.toLowerCase().startsWith('payment ')) {
    // Issue MPP challenge
    const result = await issueChallenge({
      endpointPath,
      paymentMethods: activeMethods,
      amount,
      currency,
      db: prisma,
      cache,
    });

    const headers = new Headers({ 'Content-Type': 'application/problem+json' });
    result.wwwAuthenticate.forEach((v) => headers.append('WWW-Authenticate', v));

    return new Response(JSON.stringify(result.body), { status: 402, headers });
  }

  // ── 4. Verify credential ────────────────────────────────────────────────
  const verification = await verifyCredential({ authorizationHeader: authHeader, db: prisma, cache });

  if (!verification.valid) {
    const detail: Record<string, string> = {
      'invalid-challenge': 'The payment credential is invalid or malformed.',
      'expired': 'The payment challenge has expired. Please retry to get a new challenge.',
      'already-used': 'This payment credential has already been used.',
      'invalid-proof': 'The payment proof could not be verified.',
    };
    return problemDetails(
      401,
      'Unauthorized',
      detail[verification.error ?? 'invalid-challenge'] ?? 'Payment verification failed.',
    );
  }

  // ── 5. Record transaction ───────────────────────────────────────────────
  const grossAmount = new Decimal(amount);
  const exchangeFee = grossAmount.mul(EXCHANGE_FEE_PCT).toDecimalPlaces(8);
  const netAmount = grossAmount.minus(exchangeFee).toDecimalPlaces(8);

  let transaction;
  try {
    transaction = await repos.transactions.create({
      service: { connect: { id: service.id } },
      endpoint: endpoint ? { connect: { id: endpoint.id } } : undefined,
      paymentMethod: verification.paymentMethod ?? primaryMethod,
      intent: 'charge',
      status: 'pending',
      grossAmount,
      exchangeFee,
      netAmount,
      currency,
      agentWalletAddress: verification.agentWalletAddress,
      idempotencyKey: `gw_${verification.challengeId}_${randomBytes(4).toString('hex')}`,
    });
  } catch (err) {
    console.error('[gateway] failed to record transaction', err);
    return problemDetails(500, 'Internal Server Error', 'Failed to record transaction');
  }

  // ── 6. Proxy to upstream service ────────────────────────────────────────
  const upstreamUrl = new URL(service.serviceUrl);
  upstreamUrl.pathname =
    (upstreamUrl.pathname.replace(/\/$/, '')) + endpointPath;

  // Forward original query params
  req.nextUrl.searchParams.forEach((v, k) => upstreamUrl.searchParams.set(k, v));

  // Forward request, stripping the internal Authorization header
  const upstreamHeaders = new Headers(req.headers);
  upstreamHeaders.delete('authorization');
  upstreamHeaders.delete('host');
  upstreamHeaders.set('x-agent-exchange-id', transaction.id);
  upstreamHeaders.set('x-agent-wallet', verification.agentWalletAddress ?? '');

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamUrl.toString(), {
      method: req.method,
      headers: upstreamHeaders,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
      signal: AbortSignal.timeout(30_000),
      // @ts-expect-error – Node.js fetch needs duplex for streaming body
      duplex: 'half',
    });
  } catch (err) {
    // Upstream unreachable — fail the transaction and return 502
    await repos.transactions.fail(transaction.id);
    const msg = err instanceof Error ? err.message : String(err);
    return problemDetails(502, 'Bad Gateway', `Upstream service unreachable: ${msg}`);
  }

  // Settle transaction
  await repos.transactions.settle(transaction.id);

  // Pass upstream response through
  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.set('x-agent-exchange-tx', transaction.id);

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

export const GET     = handle;
export const POST    = handle;
export const PUT     = handle;
export const PATCH   = handle;
export const DELETE  = handle;
