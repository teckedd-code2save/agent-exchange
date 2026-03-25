import type { PrismaClient } from '@agent-exchange/db';
import type { CacheAdapter } from '@agent-exchange/cache';
import { issueChallenge } from './challenge';
import { verifyCredential } from './verify';
import { issueReceipt } from './receipt';
import type { MppContext, PaymentMethod } from './types';

export interface MppMiddlewareOptions {
  amount: string;
  currency: string;
  methods: PaymentMethod[];
  db: PrismaClient;
  cache: CacheAdapter;
}

export function withMppAuth(
  handler: (req: Request, ctx: MppContext) => Promise<Response>,
  options: MppMiddlewareOptions,
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const { amount, currency, methods, db, cache } = options;
    const authHeader = req.headers.get('authorization') ?? '';

    if (!authHeader.toLowerCase().startsWith('payment ')) {
      const url = new URL(req.url);
      const result = await issueChallenge({
        endpointPath: url.pathname,
        paymentMethods: methods,
        amount,
        currency,
        db,
        cache,
      });

      const headers = new Headers({ 'Content-Type': 'application/problem+json' });
      result.wwwAuthenticate.forEach((value) => headers.append('WWW-Authenticate', value));
      return new Response(JSON.stringify(result.body), { status: 402, headers });
    }

    const verifyResult = await verifyCredential({
      authorizationHeader: authHeader,
      db,
      cache,
    });

    if (!verifyResult.valid) {
      return new Response(
        JSON.stringify({
          type: 'https://mpp.studio/problems/invalid-payment-credential',
          title: 'Invalid Payment Credential',
          status: 402,
          detail: verifyResult.error ?? 'Payment credential verification failed',
        }),
        { status: 402, headers: { 'Content-Type': 'application/problem+json' } },
      );
    }

    const response = await handler(req, {
      challengeId: verifyResult.challengeId!,
      paymentMethod: verifyResult.paymentMethod!,
      agentWalletAddress: verifyResult.agentWalletAddress!,
    });

    const receiptHeader = await issueReceipt({
      credentialId: verifyResult.challengeId!,
      resourcePath: new URL(req.url).pathname,
      amount,
      currency,
      db,
    });

    const responseWithReceipt = new Response(response.body, response);
    responseWithReceipt.headers.set('Payment-Receipt', receiptHeader);
    return responseWithReceipt;
  };
}
