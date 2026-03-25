export type PaymentMethod = 'sandbox' | 'tempo' | 'stripe' | 'lightning';
export type PaymentIntent = 'charge' | 'session';

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
