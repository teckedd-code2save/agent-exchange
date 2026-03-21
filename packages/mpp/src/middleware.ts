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
      // No payment credentials — issue a challenge
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
      result.wwwAuthenticate.forEach((val) => headers.append('WWW-Authenticate', val));

      return new Response(JSON.stringify(result.body), { status: 402, headers });
    }

    // Verify credentials
    const verifyResult = await verifyCredential({
      authorizationHeader: authHeader,
      db,
      cache,
    });

    if (!verifyResult.valid) {
      const url = new URL(req.url);
      const freshChallenge = await issueChallenge({
        endpointPath: url.pathname,
        paymentMethods: methods,
        amount,
        currency,
        db,
        cache,
      });

      const headers = new Headers({ 'Content-Type': 'application/problem+json' });
      freshChallenge.wwwAuthenticate.forEach((val) => headers.append('WWW-Authenticate', val));

      return new Response(
        JSON.stringify({
          type: 'https://agentexchange.dev/problems/invalid-payment-credential',
          title: 'Invalid Payment Credential',
          status: 402,
          detail: verifyResult.error ?? 'Payment credential verification failed',
        }),
        { status: 402, headers },
      );
    }

    const mppCtx: MppContext = {
      challengeId: verifyResult.challengeId!,
      paymentMethod: verifyResult.paymentMethod!,
      agentWalletAddress: verifyResult.agentWalletAddress!,
    };

    // Call the actual handler
    const response = await handler(req, mppCtx);

    // Issue receipt and append header
    try {
      const url = new URL(req.url);
      const credential = await db.mppCredential.findUnique({
        where: { challengeId: verifyResult.challengeId! },
      });
      if (credential) {
        const receiptHeader = await issueReceipt({
          credentialId: credential.id,
          resourcePath: url.pathname,
          amount,
          currency,
          db,
        });
        const responseWithReceipt = new Response(response.body, response);
        responseWithReceipt.headers.set('Payment-Receipt', receiptHeader);
        return responseWithReceipt;
      }
    } catch (err) {
      console.warn('[mpp] Failed to issue receipt:', err);
    }

    return response;
  };
}
