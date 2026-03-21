import Decimal from 'decimal.js';

// Tempo / USDC wallet helpers
// mppx SDK integration — Phase 1 uses stub implementations

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

export async function verifyTempoPayment(txHash: string): Promise<boolean> {
  // TODO: Phase 1 stub — integrate mppx SDK for on-chain verification
  // Real implementation calls Tempo node to verify txHash settled
  console.info('[payments:tempo] verifyTempoPayment stub called for', txHash);
  return true;
}

export async function initiateTempoTransfer(
  params: TempoTransferParams,
): Promise<TempoTransferResult> {
  // TODO: Phase 1 stub — mppx SDK transfer
  console.info('[payments:tempo] initiateTempoTransfer stub:', params);
  return {
    txHash: '0x' + Math.random().toString(16).slice(2).padEnd(64, '0'),
    confirmedAt: new Date(),
    amountUsdc: params.amountUsdc,
  };
}

export function getExchangeWalletAddress(): string {
  const addr = process.env['TEMPO_WALLET_ADDRESS'];
  if (!addr) throw new Error('[payments:tempo] TEMPO_WALLET_ADDRESS is not set');
  return addr;
}
