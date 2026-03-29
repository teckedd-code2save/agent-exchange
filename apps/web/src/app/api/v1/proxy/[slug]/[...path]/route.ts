import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@agent-exchange/db';

async function handle(req: NextRequest, { params }: { params: { slug: string; path?: string[] } }) {
  const service = await prisma.service.findUnique({ where: { studioSlug: params.slug } });
  if (!service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  const method = req.method.toUpperCase();
  const pathSuffix = (params.path ?? []).join('/');
  const targetUrl = new URL(service.endpoint.replace(/\/$/, '') + '/' + pathSuffix.replace(/^\//, ''));
  const incomingUrl = new URL(req.url);
  incomingUrl.searchParams.forEach((value, key) => targetUrl.searchParams.append(key, value));

  const authHeader = req.headers.get('authorization');
  const contentType = req.headers.get('content-type') ?? 'application/json';

  if (!authHeader?.startsWith('Payment ')) {
    const pricing = (service.pricingConfig as { amount?: string; currency?: string } | null) ?? {};
    const amount = pricing.amount ?? '0.01';
    const currency = pricing.currency ?? 'USDC';
    const challenge = `MPP challenge="sandbox-${service.studioSlug}", method="sandbox", amount="${amount}", currency="${currency}"`;

    return new NextResponse(
      JSON.stringify({
        error: 'Payment required',
        service: service.name,
        slug: service.studioSlug,
        payment: {
          method: 'sandbox',
          amount,
          currency,
        },
      }),
      {
        status: 402,
        headers: {
          'Content-Type': 'application/json',
          'WWW-Authenticate': challenge,
        },
      },
    );
  }

  const upstreamHeaders: HeadersInit = {};
  if (contentType) upstreamHeaders['Content-Type'] = contentType;

  const upstreamRes = await fetch(targetUrl.toString(), {
    method,
    headers: upstreamHeaders,
    body: ['GET', 'HEAD'].includes(method) ? undefined : await req.text(),
    redirect: 'follow',
  });

  const responseBody = await upstreamRes.text();
  const responseHeaders = new Headers();
  const responseContentType = upstreamRes.headers.get('content-type');
  if (responseContentType) responseHeaders.set('Content-Type', responseContentType);
  responseHeaders.set('payment-receipt', `sandbox:${service.studioSlug}:${Date.now()}`);

  return new NextResponse(responseBody, {
    status: upstreamRes.status,
    headers: responseHeaders,
  });
}

export async function GET(req: NextRequest, context: { params: { slug: string; path?: string[] } }) {
  return handle(req, context);
}

export async function POST(req: NextRequest, context: { params: { slug: string; path?: string[] } }) {
  return handle(req, context);
}

export async function PUT(req: NextRequest, context: { params: { slug: string; path?: string[] } }) {
  return handle(req, context);
}

export async function PATCH(req: NextRequest, context: { params: { slug: string; path?: string[] } }) {
  return handle(req, context);
}

export async function DELETE(req: NextRequest, context: { params: { slug: string; path?: string[] } }) {
  return handle(req, context);
}
