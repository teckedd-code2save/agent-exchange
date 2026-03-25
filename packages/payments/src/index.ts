import type { PaymentVerificationResult } from './types';

export {
  getStripeClient,
  constructWebhookEvent,
  createPaymentIntent,
  createOrRetrieveCustomer,
  createSubscription,
} from './stripe';
export type { Stripe } from './stripe';

export {
  verifyTempoPayment,
  initiateTempoTransfer,
  getExchangeWalletAddress,
} from './tempo';
export type { TempoTransferParams, TempoTransferResult } from './tempo';

export type PaymentEnvironment = 'sandbox' | 'testnet' | 'production';
export type { PaymentVerificationResult };

export async function verifySandboxPayment(_credential: string): Promise<PaymentVerificationResult> {
  return { valid: true, amount: '0.01', currency: 'USDC' };
}

export async function verifyStripePayment(_credential: string): Promise<PaymentVerificationResult> {
  return { valid: false, error: 'Stripe verification is handled via PaymentIntent reconciliation' };
}
