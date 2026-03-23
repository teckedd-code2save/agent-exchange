# Tempo / MPP Payment Verification — Blocker

## Status: Stubbed (Phase 1)

Tempo proof verification is currently stubbed to `return true` in:
- `packages/mpp/src/verify.ts` → `verifyProof()` for method `'tempo'`

This means **any string is accepted as a valid Tempo proof** in the current build.
The challenge/credential/replay-prevention flow is fully real — only the payment
proof verification step is deferred.

---

## Why it's blocked

Tempo Finance is building USDC micropayment rails for autonomous AI agents.
Their SDK (`mppx` or equivalent) is not yet publicly released on npm.

As of March 2026, Tempo has not published a developer SDK that allows:
1. Agent-side: signing a challenge with a wallet private key and submitting a USDC transfer
2. Exchange-side: verifying that a transaction hash settled on-chain with the correct amount and recipient

---

## What needs to be implemented

### Exchange side — `packages/mpp/src/verify.ts`

```ts
async function verifyProof(method: string, proof: string, amount: string): Promise<boolean> {
  if (method === 'tempo') {
    return verifyTempoProof(proof, amount);
  }
  // ...
}

async function verifyTempoProof(txHash: string, expectedAmount: string): Promise<boolean> {
  const { TempoClient } = await import('@mppx/sdk'); // or whatever the package becomes
  const client = new TempoClient({ apiKey: process.env['TEMPO_API_KEY'] });

  const tx = await client.getTransaction(txHash);

  return (
    tx.status === 'confirmed' &&
    tx.toAddress === process.env['TEMPO_WALLET_ADDRESS'] &&
    new Decimal(tx.amount).gte(new Decimal(expectedAmount))
  );
}
```

### Exchange side — `packages/payments/src/tempo.ts`

```ts
export async function verifyTempoPayment(txHash: string): Promise<boolean> {
  const { TempoClient } = await import('@mppx/sdk');
  const client = new TempoClient({ apiKey: process.env['TEMPO_API_KEY'] });
  const tx = await client.getTransaction(txHash);
  return tx.status === 'confirmed' && tx.toAddress === getExchangeWalletAddress();
}

export async function initiateTempoTransfer(params: TempoTransferParams): Promise<TempoTransferResult> {
  const { TempoClient } = await import('@mppx/sdk');
  const client = new TempoClient({ apiKey: process.env['TEMPO_API_KEY'] });
  const result = await client.transfer({
    from:   params.fromWallet,
    to:     params.toWallet,
    amount: params.amountUsdc.toString(),
    memo:   params.memo,
  });
  return {
    txHash:      result.txHash,
    confirmedAt: new Date(result.confirmedAt),
    amountUsdc:  new Decimal(result.amount),
  };
}
```

### Agent side (for reference — what agents need to do)

```ts
// Agent mints a payment credential:
const { TempoWallet } = await import('@mppx/sdk');
const wallet = new TempoWallet({ privateKey: process.env['AGENT_WALLET_KEY'] });

// 1. Submit USDC transfer to the exchange wallet
const tx = await wallet.transfer({
  to:     challenge.exchangeWallet, // included in the 402 body
  amount: challenge.amount,         // USDC amount from WWW-Authenticate
  memo:   challenge.challengeId,
});

// 2. Build credential with txHash as proof
const credential = {
  challengeId:        challenge.challengeId,
  paymentMethod:      'tempo',
  agentWalletAddress: wallet.address,
  proof:              tx.txHash,    // ← this is what verifyProof() checks
};
```

---

## Env vars needed (when unblocked)

```
TEMPO_WALLET_ADDRESS=tempo:0x...   # exchange merchant wallet — agents pay to this
TEMPO_API_KEY=...                   # for calling Tempo node to verify transactions
TEMPO_WALLET_PRIVATE_KEY=...        # for exchange-initiated payouts to service providers
```

---

## How to unblock

1. Contact Tempo Finance for early developer access
2. Watch for an npm package — likely `@mppx/sdk`, `@tempo/sdk`, or similar
3. Once the SDK is available, implement the two functions above and remove this stub
4. Update `TEMPO_WALLET_ADDRESS` in `.env.local` and production secrets
5. Test end-to-end using `pnpm test:payment` with a real Tempo wallet

---

## Stripe is fully implemented as a reference

The Stripe payment method is fully wired as of the same release:
- `packages/mpp/src/challenge.ts` — creates a real PaymentIntent on every 402
- `packages/mpp/src/verify.ts` — `verifyStripeProof()` calls `stripe.paymentIntents.retrieve()`
- Gateway Tester UI has a "Step 1.5 — Complete Stripe Payment" panel with test card

Stripe's implementation is the template for how Tempo should be wired in.
