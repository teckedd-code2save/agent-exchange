// Local definitions of Prisma enum values used by MPP
// Avoids a direct @prisma/client dependency in this package

export type PaymentMethod = 'tempo' | 'stripe' | 'lightning' | 'custom';
export type PaymentIntent = 'charge' | 'session';

export interface ChallengeResult {
  challengeId: string;
  wwwAuthenticate: string[];
  body: ProblemDetails;
}

export interface VerifyResult {
  valid: boolean;
  challengeId?: string;
  paymentMethod?: PaymentMethod;
  agentWalletAddress?: string;
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
}
