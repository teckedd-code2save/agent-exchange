import Decimal from 'decimal.js';
import type { X402PaymentDetails } from './types';

// USDC contract addresses per network
const USDC_CONTRACTS: Record<string, string> = {
  'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  'ethereum-sepolia': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
};

export const X402_DEFAULT_NETWORK = 'base-sepolia';

const CDP_FACILITATOR_URL = 'https://facilitator.cdp.coinbase.com';

/**
 * Build the x402 PAYMENT-REQUIRED payload embedded in the 402 response body.
 * Amounts are expressed in USDC smallest unit (6 decimals):
 *   0.01 USDC → "10000"
 *   1.00 USDC → "1000000"
 */
export function buildX402Details(
  amount: string,
  payTo: string,
  resource: string,
  network: string = X402_DEFAULT_NETWORK,
): X402PaymentDetails {
  const asset = USDC_CONTRACTS[network] ?? USDC_CONTRACTS[X402_DEFAULT_NETWORK]!;
  const maxAmountRequired = new Decimal(amount).mul(1_000_000).toDecimalPlaces(0).toString();

  return {
    scheme: 'exact',
    network,
    maxAmountRequired,
    resource,
    payTo,
    asset,
    maxTimeoutSeconds: 60,
    extra: { name: 'USDC', version: '2' },
  };
}

/**
 * Verify an x402 payment by delegating to the Coinbase CDP facilitator.
 *
 * The `paymentHeader` is the raw value of the client's `X-PAYMENT` header
 * (base64url-encoded EIP-712 signed payment payload).
 */
export async function verifyX402Payment(
  paymentHeader: string,
  requirements: X402PaymentDetails,
): Promise<boolean> {
  try {
    const res = await fetch(`${CDP_FACILITATOR_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment: paymentHeader,
        paymentRequirements: requirements,
      }),
    });

    if (!res.ok) {
      console.warn('[mpp:x402] CDP facilitator returned HTTP', res.status);
      return false;
    }

    const data = (await res.json()) as { isValid?: boolean; invalidReason?: string };
    if (!data.isValid) {
      console.info('[mpp:x402] payment rejected by facilitator:', data.invalidReason);
    }
    return data.isValid === true;
  } catch (err) {
    console.error('[mpp:x402] facilitator request failed:', err);
    return false;
  }
}

/** Return the USDC contract address for a network, or undefined if unknown. */
export function usdcContractAddress(network: string): string | undefined {
  return USDC_CONTRACTS[network];
}
