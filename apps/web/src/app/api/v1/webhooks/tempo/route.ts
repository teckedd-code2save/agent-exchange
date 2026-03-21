import { type NextRequest } from 'next/server';
import { repos } from '@/lib/db';
import { verifyTempoPayment } from '@agent-exchange/payments';
import { problemDetails } from '@/types/index';

export const dynamic = 'force-dynamic';

interface TempoWebhookPayload {
  event: string;
  txHash: string;
  from: string;
  to: string;
  amount: string;
  currency: string;
  idempotencyKey?: string;
}

export async function POST(req: NextRequest) {
  // TODO: Verify Tempo signature header when mppx SDK provides signing spec
  const tempoSig = req.headers.get('x-tempo-signature');
  if (!tempoSig) {
    return problemDetails(400, 'Bad Request', 'Missing X-Tempo-Signature header');
  }

  let body: TempoWebhookPayload;
  try {
    body = (await req.json()) as TempoWebhookPayload;
  } catch {
    return problemDetails(400, 'Bad Request', 'Invalid JSON body');
  }

  try {
    const { event, txHash } = body;

    if (event === 'payment.settled') {
      const isValid = await verifyTempoPayment(txHash);
      if (!isValid) {
        return problemDetails(400, 'Bad Request', 'Tempo payment verification failed');
      }

      const tx = await repos.transactions.findByIdempotencyKey(
        body.idempotencyKey ?? txHash,
      );
      if (tx && tx.status === 'pending') {
        await repos.transactions.settle(tx.id);
      }
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error('[webhook:tempo] processing error:', err);
    return Response.json({ received: true });
  }
}
