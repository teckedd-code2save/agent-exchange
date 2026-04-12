export type PaymentMethod = 'sandbox' | 'tempo' | 'stripe' | 'lightning' | 'x402';
export type PaymentIntent = 'charge' | 'session';

export interface X402PaymentDetails {
  scheme: 'exact';
  network: string;
  maxAmountRequired: string; // USDC in smallest unit (6 decimals), e.g. "10000" = 0.01 USDC
  resource: string;
  payTo: string;
  asset: string; // USDC contract address on the given network
  maxTimeoutSeconds: number;
  extra: { name: string; version: string };
}

export interface StripePaymentDetails {
  paymentIntentId: string;
  clientSecret: string;
  amountCents: number;
  currency: string;
}

export interface ChallengeResult {
  challengeId: string;
  wwwAuthenticate: string[];
  body: ProblemDetails;
  stripe?: StripePaymentDetails;
  x402?: X402PaymentDetails;
}

export interface VerifyResult {
  valid: boolean;
  challengeId?: string;
  paymentMethod?: PaymentMethod;
  agentWalletAddress?: string;
  proofId?: string;
  error?: 'invalid-challenge' | 'expired' | 'already-used' | 'invalid-proof';
}

export interface MppContext {
  challengeId: string;
  paymentMethod: PaymentMethod;
  agentWalletAddress: string;
}

export interface MppCredentialPayload {
  challengeId: string;
  paymentMethod: PaymentMethod;
  agentWalletAddress: string;
  proof: string;
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  challengeId?: string;
  paymentMethods?: PaymentMethod[];
  stripe?: StripePaymentDetails;
}
