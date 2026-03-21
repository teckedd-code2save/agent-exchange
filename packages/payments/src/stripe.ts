import Stripe from 'stripe';
import Decimal from 'decimal.js';

const globalForStripe = globalThis as unknown as { stripeClient: Stripe | undefined };

export function getStripeClient(): Stripe {
  if (!globalForStripe.stripeClient) {
    const key = process.env['STRIPE_SECRET_KEY'];
    if (!key) throw new Error('[payments:stripe] STRIPE_SECRET_KEY is not set');
    globalForStripe.stripeClient = new Stripe(key, { apiVersion: '2024-04-10' });
  }
  return globalForStripe.stripeClient;
}

export async function constructWebhookEvent(
  body: string,
  signature: string,
): Promise<Stripe.Event> {
  const secret = process.env['STRIPE_WEBHOOK_SECRET'];
  if (!secret) throw new Error('[payments:stripe] STRIPE_WEBHOOK_SECRET is not set');
  return getStripeClient().webhooks.constructEvent(body, signature, secret);
}

export async function createPaymentIntent(params: {
  amountUsdc: Decimal;
  currency?: string;
  customerId?: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.PaymentIntent> {
  const { amountUsdc, currency = 'usd', customerId, metadata } = params;
  // Convert Decimal amount (USDC/dollars) to cents (integer)
  const amountCents = amountUsdc.mul(100).toDecimalPlaces(0).toNumber();

  return getStripeClient().paymentIntents.create({
    amount: amountCents,
    currency,
    customer: customerId,
    metadata,
    automatic_payment_methods: { enabled: true },
  });
}

export async function createOrRetrieveCustomer(params: {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Customer> {
  const existing = await getStripeClient().customers.list({
    email: params.email,
    limit: 1,
  });

  if (existing.data.length > 0 && existing.data[0]) {
    return existing.data[0];
  }

  return getStripeClient().customers.create({
    email: params.email,
    name: params.name,
    metadata: params.metadata,
  });
}

export async function createSubscription(params: {
  customerId: string;
  priceId: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Subscription> {
  return getStripeClient().subscriptions.create({
    customer: params.customerId,
    items: [{ price: params.priceId }],
    metadata: params.metadata,
  });
}

export type { Stripe };
