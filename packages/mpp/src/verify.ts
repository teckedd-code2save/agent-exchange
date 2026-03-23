import { createHash } from 'crypto';
import type { PrismaClient } from '@agent-exchange/db';
import type { CacheAdapter } from '@agent-exchange/cache';
import { CacheKeys } from '@agent-exchange/cache';
import type { VerifyResult, MppCredentialPayload } from './types';
import { verifyTempoPayment } from '@agent-exchange/payments';

export interface VerifyCredentialParams {
  authorizationHeader: string;
  db: PrismaClient;
  cache: CacheAdapter;
}

function base64urlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return Buffer.from(padded + padding, 'base64').toString('utf-8');
}

export async function verifyCredential(params: VerifyCredentialParams): Promise<VerifyResult> {
  const { authorizationHeader, db, cache } = params;

  // 1. Parse header
  const match = /^Payment\s+(.+)$/i.exec(authorizationHeader);
  if (!match?.[1]) {
    return { valid: false, error: 'invalid-challenge' };
  }

  // 2. Decode base64url → JSON credential
  let credential: MppCredentialPayload;
  try {
    credential = JSON.parse(base64urlDecode(match[1])) as MppCredentialPayload;
  } catch {
    return { valid: false, error: 'invalid-challenge' };
  }

  const { challengeId, paymentMethod, agentWalletAddress, proof } = credential;
  if (!challengeId || !paymentMethod || !agentWalletAddress || !proof) {
    return { valid: false, error: 'invalid-challenge' };
  }

  // 3. Look up challenge in cache (fast path) then Postgres
  const cached = await cache.get(CacheKeys.mppChallenge(challengeId));
  if (!cached) {
    // Fallback to Postgres
    const dbChallenge = await db.mppChallenge.findUnique({ where: { challengeId } });
    if (!dbChallenge) return { valid: false, error: 'invalid-challenge' };
    if (dbChallenge.expiresAt < new Date()) return { valid: false, error: 'expired' };
    if (dbChallenge.usedAt) return { valid: false, error: 'already-used' };
  }

  // 4. Check usedAt in Postgres
  const dbChallenge = await db.mppChallenge.findUnique({ where: { challengeId } });
  if (!dbChallenge) return { valid: false, error: 'invalid-challenge' };
  if (dbChallenge.usedAt) return { valid: false, error: 'already-used' };
  if (dbChallenge.expiresAt < new Date()) return { valid: false, error: 'expired' };

  // 5. Verify payment proof (method-specific — stubbed for Phase 1)
  const proofValid = await verifyProof(paymentMethod, proof, dbChallenge.amount.toString());
  if (!proofValid) return { valid: false, error: 'invalid-proof' };

  // 6. Mark challenge as used
  await db.mppChallenge.update({
    where: { challengeId },
    data: { usedAt: new Date() },
  });

  // 7. Delete from cache
  await cache.del(CacheKeys.mppChallenge(challengeId));

  // 8. Write credential record
  const payloadHash = createHash('sha256')
    .update(JSON.stringify(credential))
    .digest('hex');

  await db.mppCredential.create({
    data: {
      challengeId,
      agentWalletAddress,
      paymentMethod,
      payloadHash,
    },
  });

  return {
    valid: true,
    challengeId,
    paymentMethod,
    agentWalletAddress,
    proofId: proof,
  };
}

async function verifyProof(
  method: string,
  proof: string,
  amount: string,
): Promise<boolean> {
  if (method === 'stripe') {
    return verifyStripeProof(proof);
  }
  if (method === 'tempo') {
    return verifyTempoProof(proof, amount);
  }
  console.warn('[mpp:verify] unknown payment method, rejecting:', method);
  return false;
}

async function verifyStripeProof(paymentIntentId: string): Promise<boolean> {
  if (!process.env['STRIPE_SECRET_KEY']) {
    console.error('[mpp:verify] STRIPE_SECRET_KEY not set');
    return false;
  }
  if (!paymentIntentId.startsWith('pi_')) {
    console.warn('[mpp:verify] invalid Stripe proof — expected pi_...');
    return false;
  }
  try {
    const { getStripeClient } = await import('@agent-exchange/payments');
    const pi = await getStripeClient().paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== 'succeeded') {
      console.info(`[mpp:verify] Stripe PI ${paymentIntentId} status=${pi.status}`);
      return false;
    }
    if (pi.metadata['agentExchange'] !== 'true') {
      console.warn('[mpp:verify] Stripe PI missing agentExchange metadata — possible forgery');
      return false;
    }
    return true;
  } catch (err) {
    console.error('[mpp:verify] Stripe error:', err);
    return false;
  }
}

async function verifyTempoProof(txHash: string, expectedAmount: string): Promise<boolean> {
  return verifyTempoPayment(txHash, expectedAmount);
}
