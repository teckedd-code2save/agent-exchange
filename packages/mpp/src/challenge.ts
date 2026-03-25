import { randomBytes } from 'crypto';
import Decimal from 'decimal.js';
import type { PrismaClient } from '@agent-exchange/db';
import type { CacheAdapter } from '@agent-exchange/cache';
import { CacheKeys } from '@agent-exchange/cache';
import type { ChallengeResult, PaymentMethod, PaymentIntent, StripePaymentDetails } from './types';

const STRIPE_MIN_CENTS = 50;

export interface IssueChallengeParams {
  endpointPath: string;
  paymentMethods: PaymentMethod[];
  amount: string;
  currency: string;
  digest?: string;
  intent?: PaymentIntent;
  db: PrismaClient;
  cache: CacheAdapter;
}

interface CachedChallenge {
  endpointPath: string;
  paymentMethods: PaymentMethod[];
  amount: string;
  currency: string;
  intent: PaymentIntent;
  expiresAt: string;
  digest?: string;
}

export async function issueChallenge(params: IssueChallengeParams): Promise<ChallengeResult> {
  const {
    endpointPath,
    paymentMethods,
    amount,
    currency,
    digest,
    intent = 'charge',
    cache,
  } = params;

  const challengeId = `ch_${randomBytes(8).toString('hex')}`;
  const ttlSeconds = parseInt(process.env['MPP_CHALLENGE_TTL_SECONDS'] ?? '300', 10);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  const primaryMethod = paymentMethods[0] ?? 'sandbox';

  const cachedChallenge: CachedChallenge = {
    endpointPath,
    paymentMethods,
    amount,
    currency,
    intent,
    expiresAt: expiresAt.toISOString(),
    digest,
  };

  await cache.set(
    CacheKeys.mppChallenge(challengeId),
    JSON.stringify(cachedChallenge),
    ttlSeconds,
  );

  const wwwAuthenticate = paymentMethods.map((method) => {
    const parts = [
      `challenge="${challengeId}"`,
      `method="${method}"`,
      `amount="${amount}"`,
      `currency="${currency}"`,
      `expires="${expiresAt.toISOString()}"`,
    ];
    return `Payment ${parts.join(', ')}`;
  });

  let stripeDetails: StripePaymentDetails | undefined;
  if (paymentMethods.includes('stripe') && process.env['STRIPE_SECRET_KEY']) {
    try {
      const { getStripeClient } = await import('@agent-exchange/payments');
      const amountCents = Math.max(
        STRIPE_MIN_CENTS,
        new Decimal(amount).mul(100).toDecimalPlaces(0).toNumber(),
      );
      const pi = await getStripeClient().paymentIntents.create({
        amount: amountCents,
        currency: 'usd',
        payment_method_types: ['card'],
        metadata: { challengeId, endpointPath, agentExchange: 'true' },
      });
      if (pi.client_secret) {
        stripeDetails = {
          paymentIntentId: pi.id,
          clientSecret: pi.client_secret,
          amountCents,
          currency: 'usd',
        };
      }
    } catch (err) {
      console.error('[mpp:challenge] Failed to create Stripe PaymentIntent:', err);
    }
  }

  const body = {
    type: 'https://mpp.studio/problems/payment-required',
    title: 'Payment Required',
    status: 402,
    detail: `Access to ${endpointPath} requires payment.`,
    challengeId,
    paymentMethods: [primaryMethod, ...paymentMethods.filter((method) => method !== primaryMethod)],
    ...(stripeDetails ? { stripe: stripeDetails } : {}),
  };

  return { challengeId, wwwAuthenticate, body, ...(stripeDetails ? { stripe: stripeDetails } : {}) };
}
