// Local definitions of Prisma enum values used by MPP
// Avoids a direct @prisma/client dependency in this package

export type PaymentMethod = 'tempo' | 'stripe' | 'lightning' | 'custom';
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
  /** Present when stripe is in the payment methods — agent uses clientSecret to complete payment */
  stripe?: StripePaymentDetails;
}

export interface VerifyResult {
  valid: boolean;
  challengeId?: string;
  paymentMethod?: PaymentMethod;
  agentWalletAddress?: string;
  /** The raw proof string — for stripe this is the PaymentIntent ID (pi_...) */
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
  payloadHash?: string;
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  challengeId?: string;
  paymentMethods?: string[];
  /** Stripe-specific — present when stripe is an available payment method */
  stripe?: StripePaymentDetails;
}
