import { randomBytes } from 'crypto';
import Decimal from 'decimal.js';
import type { PrismaClient } from '@agent-exchange/db';
import type { CacheAdapter } from '@agent-exchange/cache';
import { CacheKeys } from '@agent-exchange/cache';
import type { ChallengeResult, PaymentMethod, PaymentIntent, StripePaymentDetails } from './types';

// Stripe minimum charge is 50 cents
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

export async function issueChallenge(params: IssueChallengeParams): Promise<ChallengeResult> {
  const {
    endpointPath,
    paymentMethods,
    amount,
    currency,
    digest,
    intent = 'charge',
    db,
    cache,
  } = params;

  const challengeId = 'ch_' + randomBytes(8).toString('hex');
  const ttlSeconds = parseInt(process.env['MPP_CHALLENGE_TTL_SECONDS'] ?? '300', 10);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  // Write to Postgres (one challenge per primary payment method)
  const primaryMethod = paymentMethods[0] ?? 'tempo';
  await db.mppChallenge.create({
    data: {
      challengeId,
      endpointPath,
      paymentMethod: primaryMethod,
      intent,
      amount,
      currency,
      digest,
      expiresAt,
    },
  });

  // Write to cache for fast lookup
  await cache.set(
    CacheKeys.mppChallenge(challengeId),
    JSON.stringify({ endpointPath, paymentMethods, amount, currency, intent, expiresAt }),
    ttlSeconds,
  );

  // Build WWW-Authenticate headers — one per payment method
  const wwwAuthenticate = paymentMethods.map((method) => {
    const params = [
      `challenge="${challengeId}"`,
      `method="${method}"`,
      `amount="${amount}"`,
      `currency="${currency}"`,
      `expires="${expiresAt.toISOString()}"`,
    ].join(', ');
    return `Payment ${params}`;
  });

  // If stripe is in the payment methods, create a PaymentIntent now so the
  // agent can complete payment before retrying with the credential.
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
      stripeDetails = {
        paymentIntentId: pi.id,
        clientSecret: pi.client_secret!,
        amountCents,
        currency: 'usd',
      };
    } catch (err) {
      console.error('[mpp:challenge] Failed to create Stripe PaymentIntent:', err);
      // Non-fatal — stripe just won't be available for this challenge
    }
  }

  const body = {
    type: 'https://agentexchange.dev/problems/payment-required',
    title: 'Payment Required',
    status: 402,
    detail: `Access to ${endpointPath} requires payment. Provide credentials via Authorization: Payment header.`,
    challengeId,
    paymentMethods,
    ...(stripeDetails ? { stripe: stripeDetails } : {}),
  };

  return { challengeId, wwwAuthenticate, body, ...(stripeDetails ? { stripe: stripeDetails } : {}) };
}
