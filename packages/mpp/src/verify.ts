import type { PrismaClient } from '@agent-exchange/db';
import type { CacheAdapter } from '@agent-exchange/cache';
import { CacheKeys } from '@agent-exchange/cache';
import { verifyTempoPayment } from '@agent-exchange/payments';
import type { VerifyResult, MppCredentialPayload } from './types';

export interface VerifyCredentialParams {
  authorizationHeader: string;
  db: PrismaClient;
  cache: CacheAdapter;
}

interface CachedChallenge {
  endpointPath: string;
  paymentMethods: string[];
  amount: string;
  currency: string;
  intent: string;
  expiresAt: string;
}

function base64urlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return Buffer.from(padded + padding, 'base64').toString('utf-8');
}

export async function verifyCredential(params: VerifyCredentialParams): Promise<VerifyResult> {
  const { authorizationHeader, cache } = params;

  const match = /^Payment\s+(.+)$/i.exec(authorizationHeader);
  if (!match?.[1]) {
    return { valid: false, error: 'invalid-challenge' };
  }

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

  const cached = await cache.get(CacheKeys.mppChallenge(challengeId));
  if (!cached) {
    return { valid: false, error: 'invalid-challenge' };
  }

  let challenge: CachedChallenge;
  try {
    challenge = JSON.parse(cached) as CachedChallenge;
  } catch {
    await cache.del(CacheKeys.mppChallenge(challengeId));
    return { valid: false, error: 'invalid-challenge' };
  }

  if (new Date(challenge.expiresAt) < new Date()) {
    await cache.del(CacheKeys.mppChallenge(challengeId));
    return { valid: false, error: 'expired' };
  }

  const usedKey = `${CacheKeys.mppChallenge(challengeId)}:used`;
  const reserved = await cache.setnx(usedKey, proof, 300);
  if (!reserved) {
    return { valid: false, error: 'already-used' };
  }

  const proofValid = await verifyProof(paymentMethod, proof, challenge.amount);
  if (!proofValid) {
    await cache.del(usedKey);
    return { valid: false, error: 'invalid-proof' };
  }

  await cache.del(CacheKeys.mppChallenge(challengeId));

  return {
    valid: true,
    challengeId,
    paymentMethod,
    agentWalletAddress,
    proofId: proof,
  };
}

async function verifyProof(method: string, proof: string, amount: string): Promise<boolean> {
  if (method === 'sandbox') {
    return proof === 'sandbox-credential' || proof.startsWith('test_proof_');
  }
  if (method === 'stripe') {
    return verifyStripeProof(proof);
  }
  if (method === 'tempo') {
    return verifyTempoPayment(proof, amount);
  }
  if (method === 'x402') {
    return verifyX402Proof(proof, amount);
  }
  return false;
}

/**
 * Verify an x402 payment proof.
 *
 * The `proof` here is the raw value of the client's `X-PAYMENT` header
 * (base64url-encoded EIP-712 signed payload), passed through as the MPP
 * credential `proof` field so it can be forwarded to the CDP facilitator.
 */
async function verifyX402Proof(proof: string, amount: string): Promise<boolean> {
  const payTo = process.env['X402_PAY_TO_ADDRESS'];
  if (!payTo) {
    console.warn('[mpp:verify] x402 payment received but X402_PAY_TO_ADDRESS is not configured');
    return false;
  }
  try {
    const { buildX402Details, verifyX402Payment } = await import('./x402');
    const requirements = buildX402Details(
      amount,
      payTo,
      '/', // resource path is not re-validated at verify time
      process.env['X402_NETWORK'] ?? 'base-sepolia',
    );
    return verifyX402Payment(proof, requirements);
  } catch (err) {
    console.error('[mpp:verify] x402 verification error:', err);
    return false;
  }
}

async function verifyStripeProof(paymentIntentId: string): Promise<boolean> {
  if (!process.env['STRIPE_SECRET_KEY']) {
    return false;
  }
  if (!paymentIntentId.startsWith('pi_')) {
    return false;
  }
  try {
    const { getStripeClient } = await import('@agent-exchange/payments');
    const pi = await getStripeClient().paymentIntents.retrieve(paymentIntentId);
    return pi.status === 'succeeded' && pi.metadata['agentExchange'] === 'true';
  } catch (err) {
    console.error('[mpp:verify] Stripe error:', err);
    return false;
  }
}
