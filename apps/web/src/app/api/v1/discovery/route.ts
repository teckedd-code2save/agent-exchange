import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@agent-exchange/db';
import type { PaymentType as PaymentTypeValue } from '@agent-exchange/db';

const VALID_PAYMENT_TYPES: PaymentTypeValue[] = ['tempo', 'stripe', 'lightning', 'sandbox'];

/**
 * GET /api/v1/discovery
 * 
 * The primary discovery endpoint for AI agents.
 * Agents call this to find MPP-compatible services by capability.
 * 
 * Query params:
 *   category   - Filter by category (e.g. "image-generation", "search")
 *   tags       - Comma-separated tags (e.g. "fast,cheap")
 *   payment    - Filter by payment method ("tempo", "stripe", "sandbox")
 *   env        - Environment: "sandbox" | "testnet" | "live" (default: live)
 *   limit      - Max results (default: 20)
 *   cursor     - For pagination
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get('category');
  const tags = searchParams.get('tags')?.split(',').filter(Boolean) ?? [];
  const payment = searchParams.get('payment');
  const env = searchParams.get('env') ?? 'live';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
  const cursor = searchParams.get('cursor');

  // Map env param to status
  const statusMap: Record<string, 'sandbox' | 'testnet' | 'live'> = {
    sandbox: 'sandbox',
    testnet: 'testnet',
    live: 'live',
  };
  const status = statusMap[env] ?? 'live';

  const isValidPayment = payment ? VALID_PAYMENT_TYPES.includes(payment as PaymentTypeValue) : false;

  const services = await prisma.service.findMany({
    where: {
      status,
      ...(category ? { category } : {}),
      ...(tags.length ? { tags: { hasEvery: tags } } : {}),
      ...(payment && isValidPayment
        ? { supportedPayments: { has: payment as PaymentTypeValue } }
        : {}),
    },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: [
      { totalCalls: 'desc' }, // Most popular first
      { createdAt: 'desc' },
    ],
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      tags: true,
      status: true,
      pricingType: true,
      pricingConfig: true,
      supportedPayments: true,
      totalCalls: true,
      studioSlug: true,
      // Omit sensitive fields like endpoint
    },
  });

  const hasMore = services.length > limit;
  const items = hasMore ? services.slice(0, limit) : services;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  // Build the proxy endpoint for each service
  const baseUrl = request.nextUrl.origin;
  const results = items.map((s) => ({
    ...s,
    proxyEndpoint: `${baseUrl}/api/v1/proxy/${s.studioSlug}`,
    pricingConfig: s.pricingConfig as { amount?: string; currency?: string } | null,
  }));

  return NextResponse.json({
    results,
    pagination: {
      limit,
      hasMore,
      nextCursor,
      total: results.length,
    },
    _hint: 'POST to proxyEndpoint with Authorization: Payment sandbox-credential to test in sandbox',
  });
}
