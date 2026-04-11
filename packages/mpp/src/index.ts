// MPP Studio — mpp package
// Exports the core 402 challenge/verify pipeline and x402 helpers.

export { issueChallenge } from './challenge';
export type { IssueChallengeParams } from './challenge';

export { verifyCredential } from './verify';
export type { VerifyCredentialParams } from './verify';

export { buildX402Details, verifyX402Payment, usdcContractAddress, X402_DEFAULT_NETWORK } from './x402';

export type {
  PaymentMethod,
  PaymentIntent,
  X402PaymentDetails,
  StripePaymentDetails,
  ChallengeResult,
  VerifyResult,
  MppContext,
  MppCredentialPayload,
  ProblemDetails,
} from './types';

// ── Legacy sandbox helpers (used by apps/web proxy route) ─────────────────────

export interface SandboxChallenge {
  challengeId: string;
  amount: string;
  currency: string;
  methods: string[];
}

export function createSandboxChallenge(amount: string, currency: string): SandboxChallenge {
  return {
    challengeId: `sand_chal_${Math.random().toString(36).slice(2)}`,
    amount,
    currency,
    methods: ['sandbox'],
  };
}

export function validateSandboxCredential(authHeader: string): boolean {
  return authHeader.includes('sandbox-credential') || authHeader.includes('Bearer sand_');
}

export function formatWwwAuthenticate(challenge: SandboxChallenge): string {
  return `Payment method="mpp", challenge="${challenge.challengeId}", amount="${challenge.amount}", currency="${challenge.currency}", methods="${challenge.methods.join(',')}"`;
}
