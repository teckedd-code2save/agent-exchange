import { randomBytes } from 'crypto';
import type { PrismaClient } from '@agent-exchange/db';

export interface IssueReceiptParams {
  credentialId: string;
  resourcePath: string;
  amount: string;
  currency: string;
  db: PrismaClient;
}

function base64urlEncode(input: string): string {
  return Buffer.from(input, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export async function issueReceipt(params: IssueReceiptParams): Promise<string> {
  const { credentialId, resourcePath, amount, currency } = params;
  const issuedAt = new Date().toISOString();

  return base64urlEncode(JSON.stringify({
    receiptId: `rcpt_${randomBytes(8).toString('hex')}`,
    credentialId,
    resourcePath,
    amount,
    currency,
    issuedAt,
  }));
}
