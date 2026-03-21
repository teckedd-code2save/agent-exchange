import { type NextRequest } from 'next/server';
import { constructWebhookEvent } from '@/lib/stripe';
import { repos } from '@/lib/db';
import { problemDetails } from '@/types/index';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return problemDetails(400, 'Bad Request', 'Missing Stripe-Signature header');
  }

  let event;
  try {
    event = await constructWebhookEvent(body, signature);
  } catch (err) {
    console.error('[webhook:stripe] signature verification failed:', err);
    return problemDetails(400, 'Bad Request', 'Stripe webhook signature verification failed');
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        const tx = await repos.transactions.findByStripePaymentIntentId(pi.id);
        if (tx) await repos.transactions.settle(tx.id);
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        const tx = await repos.transactions.findByStripePaymentIntentId(pi.id);
        if (tx) await repos.transactions.fail(tx.id);
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const org = await repos.organisations.findByStripeCustomerId(sub.customer as string);
        if (org) {
          const tier = sub.status === 'active' ? 'verified' : 'free';
          await repos.organisations.updateTier(org.id, tier as 'free' | 'verified');
        }
        break;
      }
      default:
        // Unhandled events — ignore
        break;
    }
  } catch (err) {
    console.error('[webhook:stripe] event processing error:', err);
    // Still return 200 to prevent Stripe retries for non-recoverable errors
  }

  return Response.json({ received: true });
}
