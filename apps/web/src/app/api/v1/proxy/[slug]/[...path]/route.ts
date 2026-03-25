import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@agent-exchange/db';

type PricingConfig = {
  amount?: string;
  currency?: string;
};

async function handleProxy(
  request: NextRequest,
  { params }: { params: { slug: string; path: string[] } }
) {
  const { slug, path } = params;
  const targetPath = '/' + path.join('/');

  const startTime = Date.now();

  try {
    // 1. Lookup service
    const service = await prisma.service.findUnique({
      where: { studioSlug: slug },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    if (service.status === 'draft' || service.status === 'paused') {
      return NextResponse.json({ error: `Service is currently ${service.status}` }, { status: 503 });
    }

    // 2. Extract auth header
    const authHeader = request.headers.get('authorization') || '';
    let isPaid = false;

    // 3. Environment-specific payment enforcement (The Studio Magic)
    // In Sandbox, we fake the MPP flow so agents can test their 402 logic
    const isSandbox = service.status === 'sandbox';
    
    // Parse pricing config (fallback to 0.01 USDC)
    let amount = '0.01';
    let currency = 'USDC';
    try {
      if (service.pricingConfig && typeof service.pricingConfig === 'object') {
        const conf = service.pricingConfig as PricingConfig;
        if (conf.amount) amount = conf.amount;
        if (conf.currency) currency = conf.currency;
      }
    } catch {
      console.warn('[MPP Studio Proxy] Failed to parse pricing config for service', slug);
    }

    if (isSandbox) {
      // Sandbox validation
      if (!authHeader.toLowerCase().startsWith('payment ')) {
        // Issue fake 402 Challenge
        const challengeId = `sand_chal_${Math.random().toString(36).slice(2)}`;
        
        // Asynchronously log the challenge issuance
        prisma.call.create({
          data: {
            serviceId: service.id,
            method: request.method,
            path: targetPath,
            status: 402,
            paymentType: 'sandbox',
            amount: Number(amount),
            currency,
            challengeIssued: true,
            latencyMs: Date.now() - startTime,
            environment: 'sandbox',
          }
        }).catch(console.error);

        return NextResponse.json(
          {
            type: 'https://mpp.dev/problems/payment-required',
            title: 'Payment Required',
            detail: `Sandbox payment required for ${service.name}`,
          },
          {
            status: 402,
            headers: {
              'WWW-Authenticate': `Payment method="mpp", challenge="${challengeId}", amount="${amount}", currency="${currency}", methods="sandbox"`,
            }
          }
        );
      }

      // Very simple mock validation for the sandbox credential
      // They just have to pass back the auth header with "sandbox-credential"
      if (authHeader.includes('sandbox-credential')) {
        isPaid = true;
      } else {
        return NextResponse.json({ error: 'Invalid sandbox credential' }, { status: 401 });
      }
    } else {
      // In Testnet/Live, we would use `mppx` SDK to verify real Tempo/Stripe payments here
      // For now, if they're live, we just pass through whatever auth they sent
      isPaid = authHeader.toLowerCase().startsWith('payment ');
    }

    // 4. Forward the request to the underlying service provider
    const targetUrl = new URL(targetPath, service.endpoint);
    targetUrl.search = request.nextUrl.search; // keep query params

    const forwardHeaders = new Headers(request.headers);
    forwardHeaders.delete('host');
    // Inject our studio context headers for the provider
    forwardHeaders.set('x-mpp-studio-env', service.status);
    forwardHeaders.set('x-mpp-paid', isPaid ? 'true' : 'false');

    let reqBody = null;
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      reqBody = await request.text();
    }

    const providerResponse = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: forwardHeaders,
      body: reqBody,
    });

    const latencyMs = Date.now() - startTime;

    // 5. Asynchronously log the completed transaction
    prisma.call.create({
      data: {
        serviceId: service.id,
        method: request.method,
        path: targetPath,
        status: providerResponse.status,
        paymentType: isSandbox ? 'sandbox' : (service.supportedPayments[0] || 'stripe'),
        amount: Number(amount),
        currency,
        challengeIssued: true,
        challengeSolved: isPaid,
        receiptVerified: isPaid, // simplified for now
        latencyMs,
        environment: isSandbox ? 'sandbox' : 'production',
      }
    }).catch(console.error);

    // 6. Return response to agent, appending a Receipt header if paid
    const responseHeaders = new Headers(providerResponse.headers);
    if (isPaid) {
      responseHeaders.set('Payment-Receipt', `receipt_${Math.random().toString(36).slice(2)}`);
    }

    const resBody = await providerResponse.arrayBuffer();
    return new NextResponse(resBody, {
      status: providerResponse.status,
      statusText: providerResponse.statusText,
      headers: responseHeaders,
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown proxy error';
    console.error('[MPP Studio Proxy Error]', err);
    return NextResponse.json({ error: 'Internal proxy error', details: message }, { status: 500 });
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
