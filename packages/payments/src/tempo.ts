import Decimal from 'decimal.js';

export interface TempoTransferParams {
  fromWallet: string;
  toWallet: string;
  amountUsdc: Decimal;
  memo?: string;
}

export interface TempoTransferResult {
  txHash: string;
  confirmedAt: Date;
  amountUsdc: Decimal;
}

type TempoTransaction = {
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  toAddress: string;
  amount: string;
  confirmedAt: string;
};

type TempoTransferResponse = {
  txHash: string;
  amount: string;
  confirmedAt: string;
};

async function loadTempoClient() {
  const { TempoClient } = await import('@mppx/sdk');
  const apiKey = process.env['TEMPO_API_KEY'];
  if (!apiKey) {
    throw new Error('[payments:tempo] TEMPO_API_KEY must be set to call Tempo SDK');
  }
  return new TempoClient({ apiKey });
}

export async function verifyTempoPayment(txHash: string, expectedAmount?: string): Promise<boolean> {
  const client = await loadTempoClient();
  let tx: TempoTransaction;
  try {
    tx = await client.getTransaction(txHash);
  } catch (err) {
    console.error('[payments:tempo] failed to fetch transaction', err);
    return false;
  }

  if (tx.status !== 'confirmed') {
    console.info('[payments:tempo] transaction not confirmed yet:', txStatusSummary(tx));
    return false;
  }

  if (tx.toAddress !== getExchangeWalletAddress()) {
    console.warn('[payments:tempo] transaction paid to wrong wallet:', tx.toAddress);
    return false;
  }

  if (expectedAmount && new Decimal(tx.amount).lt(new Decimal(expectedAmount))) {
    console.warn('[payments:tempo] transaction amount too low', {
      expected: expectedAmount,
      actual: tx.amount,
    });
    return false;
  }

  return true;
}

export async function initiateTempoTransfer(
  params: TempoTransferParams,
): Promise<TempoTransferResult> {
  const client = await loadTempoClient();
  const payload = {
    from: params.fromWallet,
    to: params.toWallet,
    amount: params.amountUsdc.toString(),
    memo: params.memo,
  };

  const result = await client.transfer(payload) as TempoTransferResponse;

  return {
    txHash: result.txHash,
    confirmedAt: new Date(result.confirmedAt),
    amountUsdc: new Decimal(result.amount),
  };
}

export function getExchangeWalletAddress(): string {
  const addr = process.env['TEMPO_WALLET_ADDRESS'];
  if (!addr) throw new Error('[payments:tempo] TEMPO_WALLET_ADDRESS is not set');
  return addr;
}

function txStatusSummary(tx: TempoTransaction) {
  return `${tx.txHash} status=${tx.status} amount=${tx.amount}`;
}
