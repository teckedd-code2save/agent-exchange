import { randomBytes } from 'crypto';
import type { PrismaClient } from '@agent-exchange/db';
import type { CacheAdapter } from '@agent-exchange/cache';
import { CacheKeys } from '@agent-exchange/cache';
import type { ChallengeResult, PaymentMethod, PaymentIntent } from './types';

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

  const body = {
    type: 'https://agentexchange.dev/problems/payment-required',
    title: 'Payment Required',
    status: 402,
    detail: `Access to ${endpointPath} requires payment. Provide credentials via Authorization: Payment header.`,
    challengeId,
    paymentMethods,
  };

  return { challengeId, wwwAuthenticate, body };
}
