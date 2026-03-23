# Tempo / MPP Payment Integration

## Status: Live
Tempo proof verification now talks to Tempo’s SDK instead of stubs, so the exchange can safely confirm every USDC transfer from `api/v1/gateway/[slug]/[...path]`. The flow
1. Issues a 402 with `issueChallenge()` (see `packages/mpp/src/challenge.ts`),
2. Verifies the credential with `verifyCredential()`,
3. Settles transactions only after `verifyTempoPayment(txHash, amount)` succeeds and marks the credential as used.

## Exchange wiring
- `packages/payments/src/tempo.ts` dynamically imports `@mppx/sdk` and constructs a `TempoClient` with `TEMPO_API_KEY`. `verifyTempoPayment` validates that the transfer is `confirmed`, that it paid `TEMPO_WALLET_ADDRESS`, and that the settled amount covers the expected pricing. `initiateTempoTransfer` is ready for future payouts and returns the canonical `txHash`, confirmation time, and Decimal amount.
- The gateway webhook at `apps/web/src/app/api/v1/webhooks/tempo/route.ts` now forwards the signed `amount` to `verifyTempoPayment`, so only settled/insured transfers open transactions in the ledger.

## Agent integration (choose the manual fetch path)
- Install the TypeScript client: `pnpm add mppx viem` (Tempo wallets currently ship via the `mppx` client package).
- Define an account, then call `Mppx.create({ polyfill: false, methods: [tempo({ account })] })` and use the returned `fetch`. Avoid globally polyfilling `fetch` because Next.js already wraps the runtime; passing your fetch explicitly prevents accidental double-wrapping and keeps the agent flow portable.
  ```ts
  const mppx = Mppx.create({ polyfill: false, methods: [tempo({ account })] });
  const response = await mppx.fetch('https://agent-exchange.example.com/api/v1/gateway/echo-test/reflect');
  ```
- When Tempo returns a 402, sign the challenge with `TempoWallet` (or any Tempo signer) and submit the transfer and `txHash` as the credential proof. The exchange expects `proof` to be `txHash` and the credential payload to include `challengeId`, `paymentMethod: 'tempo'`, and `agentWalletAddress`.

## Local testing with `api/v1/echo`
- Seed the echo service (`scripts/seed-echo-service.ts`) or manually create a service that points at `http://localhost:3000/api/v1/echo`. That route mirrors requests back (headers, query, body, injected wallet headers), so the gateway can finish with a real `200 OK` without needing a real upstream.
- Run `SERVICE_SLUG=echo-test ENDPOINT=/reflect pnpm test:payment` (or `scripts/test-payment-flow.ts` with `SERVICE_SLUG=echo-test`) to walk the full challenge/credential/proxy flow. `api/v1/echo` proves the gateway correctly proxies once Tempo proofs validate.

## Required secrets
- `TEMPO_API_KEY`: Tempo node read access used by `TempoClient`.
- `TEMPO_WALLET_ADDRESS`: The on-chain wallet that hosts the exchange’s USDC revenue.
- `TEMPO_WALLET_PRIVATE_KEY`: Keep for future payout tooling (`initiateTempoTransfer`).

If the SDK is missing at runtime the dynamic import throws early, so make sure the dependency is installed before hitting production. Update `.env.local` with the three Tempo variables before running the gateway.
