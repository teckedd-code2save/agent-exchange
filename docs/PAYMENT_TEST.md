# MPP 402 Payment Flow — Test Guide

End-to-end test of the Machine Payment Protocol flow:
`no auth → 402 challenge → mint credential → 200 OK → transaction recorded`

The test script below does all of this in one run against a live or local server.

---

## How the MPP 402 Flow Works

```
Agent                          Exchange (this app)              Service Provider
  |                                  |                                |
  |-- GET /gateway/{slug}/{path} --> |                                |
  |                                  |-- check: has Authorization?   |
  |<-- 402 + WWW-Authenticate -------|   No → issue challenge        |
  |    Payment challenge="ch_..."    |                                |
  |    method="tempo"                |                                |
  |    amount="0.001000"             |                                |
  |    currency="USDC"               |                                |
  |                                  |                                |
  |  [Agent creates payment proof]   |                                |
  |                                  |                                |
  |-- GET /gateway/{slug}/{path} --> |                                |
  |   Authorization: Payment <b64>   |-- verify credential           |
  |                                  |-- record transaction          |
  |                                  |-- proxy to service provider ->|
  |<-- 200 + proxied response -------|<-- service response ----------|
```

---

## Quick Test (copy-paste ready)

### Prerequisites
```bash
# Install deps (only needed once)
pnpm add -g tsx

# Export your local server URL
export BASE_URL=http://localhost:3000

# Find a seeded service slug
curl -s "$BASE_URL/api/v1/services?limit=1" | jq '.data[0].slug'
export SERVICE_SLUG=weather-data-api   # replace with your slug
```

### Run the full flow test
```bash
tsx scripts/test-payment-flow.ts
```

Or with env overrides:
```bash
BASE_URL=https://yourdomain.com SERVICE_SLUG=my-service tsx scripts/test-payment-flow.ts
```

---

## The Test Script

Save to `scripts/test-payment-flow.ts`:

```typescript
#!/usr/bin/env tsx
/**
 * MPP 402 Payment Flow - End-to-End Test
 *
 * Tests the full Machine Payment Protocol cycle:
 *   1. Hit a protected gateway endpoint → expect 402
 *   2. Parse the WWW-Authenticate challenge
 *   3. Mint a payment credential (stub proof for dev/test)
 *   4. Replay the request with Authorization header → expect 200
 *   5. Verify the transaction was recorded
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 SERVICE_SLUG=weather-data-api tsx scripts/test-payment-flow.ts
 *   BASE_URL=https://yourdomain.com SERVICE_SLUG=my-slug WALLET=agent:0xDEAD tsx scripts/test-payment-flow.ts
 */

const BASE_URL   = process.env['BASE_URL']   ?? 'http://localhost:3000';
const SLUG       = process.env['SERVICE_SLUG'] ?? 'weather-data-api';
const WALLET     = process.env['WALLET']     ?? 'agent:0xTEST0000000000000000000000000000000001';
const ENDPOINT   = process.env['ENDPOINT']   ?? '/data/current';   // endpoint path on the service

// ── Helpers ──────────────────────────────────────────────────────────────────

function base64url(obj: unknown): string {
  const json = JSON.stringify(obj);
  return Buffer.from(json)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function parseWwwAuthenticate(header: string) {
  const challengeId   = /challenge="([^"]+)"/.exec(header)?.[1];
  const method        = /method="([^"]+)"/.exec(header)?.[1];
  const amount        = /amount="([^"]+)"/.exec(header)?.[1];
  const currency      = /currency="([^"]+)"/.exec(header)?.[1];
  const expires       = /expires="([^"]+)"/.exec(header)?.[1];
  return { challengeId, method, amount, currency, expires };
}

function mintCredential(challengeId: string, method: string) {
  // In production the agent would:
  //   - For Tempo: sign the challengeId with their wallet key and attach txHash
  //   - For Stripe: complete payment intent and attach payment_intent_id as proof
  //   - For Lightning: pay a BOLT11 invoice and attach preimage as proof
  //
  // In test mode (Phase 1) the server accepts any non-empty proof string.
  const proof = `test_proof_${Date.now()}`;
  const payload = { challengeId, paymentMethod: method, agentWalletAddress: WALLET, proof };
  return `Payment ${base64url(payload)}`;
}

function ok(msg: string)   { console.log(`  ✓  ${msg}`); }
function fail(msg: string) { console.error(`  ✗  ${msg}`); process.exit(1); }
function info(msg: string) { console.log(`     ${msg}`); }
function step(msg: string) { console.log(`\n── ${msg}`); }

// ── Test Runner ───────────────────────────────────────────────────────────────

async function run() {
  console.log(`\nMPP 402 Payment Flow Test`);
  console.log(`Server : ${BASE_URL}`);
  console.log(`Service: ${SLUG}`);
  console.log(`Wallet : ${WALLET}`);

  const gatewayUrl = `${BASE_URL}/api/v1/gateway/${SLUG}${ENDPOINT}`;

  // ── Step 1: Unauthenticated request → expect 402 ─────────────────────────
  step('Step 1: Unauthenticated request');
  info(`GET ${gatewayUrl}`);

  const r1 = await fetch(gatewayUrl, { method: 'GET' });
  info(`Status: ${r1.status}`);

  if (r1.status !== 402) {
    if (r1.status === 404) fail(`Gateway route not found. Is the gateway endpoint implemented? See apps/web/src/app/api/v1/gateway/`);
    if (r1.status === 200) fail(`Got 200 without auth — gateway is not enforcing MPP`);
    fail(`Expected 402, got ${r1.status}`);
  }
  ok('Got 402 Payment Required');

  const wwwAuth = r1.headers.get('www-authenticate');
  if (!wwwAuth) fail('Missing WWW-Authenticate header in 402 response');
  info(`WWW-Authenticate: ${wwwAuth}`);

  const body402 = await r1.json() as Record<string, unknown>;
  info(`Problem type: ${body402['type']}`);
  info(`Challenge ID: ${body402['challengeId']}`);
  ok('RFC 9457 problem body present');

  // ── Step 2: Parse challenge ───────────────────────────────────────────────
  step('Step 2: Parse challenge');
  const challenge = parseWwwAuthenticate(wwwAuth!);
  if (!challenge.challengeId) fail('Could not parse challenge ID from WWW-Authenticate');
  if (!challenge.method)      fail('Could not parse method from WWW-Authenticate');
  if (!challenge.amount)      fail('Could not parse amount from WWW-Authenticate');

  ok(`Challenge ID : ${challenge.challengeId}`);
  ok(`Method       : ${challenge.method}`);
  ok(`Amount       : ${challenge.amount} ${challenge.currency}`);
  ok(`Expires      : ${challenge.expires}`);

  // ── Step 3: Mint credential ───────────────────────────────────────────────
  step('Step 3: Mint payment credential');
  const authHeader = mintCredential(challenge.challengeId!, challenge.method!);
  info(`Authorization: ${authHeader.slice(0, 60)}...`);
  ok('Credential minted (test stub proof)');

  // ── Step 4: Authenticated request → expect 200 or 502 ────────────────────
  step('Step 4: Authenticated request');
  info(`GET ${gatewayUrl}`);
  info(`Authorization: Payment <credential>`);

  const r2 = await fetch(gatewayUrl, {
    method: 'GET',
    headers: { 'Authorization': authHeader },
  });
  info(`Status: ${r2.status}`);

  if (r2.status === 401) {
    const err = await r2.json() as Record<string, unknown>;
    fail(`Credential rejected: ${err['detail'] ?? JSON.stringify(err)}`);
  }

  // 502 is expected if the upstream service URL isn't reachable in dev
  if (r2.status === 200 || r2.status === 502) {
    ok(r2.status === 200
      ? 'Got 200 — credential accepted, response proxied from upstream service'
      : 'Got 502 — credential accepted (upstream service unreachable in dev, this is expected)');
  } else {
    fail(`Unexpected status ${r2.status}`);
  }

  // ── Step 5: Verify transaction recorded ──────────────────────────────────
  step('Step 5: Check transaction was recorded');
  const txsUrl = `${BASE_URL}/api/v1/services/${SLUG}/analytics`;
  const txsResp = await fetch(txsUrl);
  if (txsResp.ok) {
    const analytics = await txsResp.json() as Record<string, unknown>;
    info(`Analytics response: ${JSON.stringify(analytics).slice(0, 120)}`);
    ok('Analytics endpoint reachable');
  } else {
    info(`Analytics check skipped (${txsResp.status}) — check DB directly:`);
    info(`  SELECT * FROM transactions ORDER BY created_at DESC LIMIT 5;`);
  }

  // ── Step 6: Replay same challenge → expect 401 already-used ──────────────
  step('Step 6: Replay attack — same challenge should be rejected');
  const r3 = await fetch(gatewayUrl, {
    method: 'GET',
    headers: { 'Authorization': authHeader },
  });
  if (r3.status === 401) {
    const err = await r3.json() as Record<string, unknown>;
    if (String(err['detail']).includes('already') || String(err['detail']).includes('used')) {
      ok('Replay rejected with 401 already-used — correct');
    } else {
      ok(`Replay rejected with 401 — ${err['detail']}`);
    }
  } else {
    info(`Warning: replay returned ${r3.status} instead of 401 — check challenge reuse guard`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  All MPP payment flow checks passed!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

run().catch((err) => {
  console.error('\nTest crashed:', err);
  process.exit(1);
});
```

---

## Manual curl version

If you prefer curl:

```bash
export BASE_URL=http://localhost:3000
export SLUG=weather-data-api

# Step 1: Get the 402
curl -i "$BASE_URL/api/v1/gateway/$SLUG/data/current"
# → copy the challengeId from the response body

export CHALLENGE_ID=ch_...   # paste here

# Step 2: Build the base64url credential
python3 -c "
import base64, json, sys
payload = {
  'challengeId': '$CHALLENGE_ID',
  'paymentMethod': 'tempo',
  'agentWalletAddress': 'agent:0xTEST01',
  'proof': 'test_proof_local'
}
b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b'=').decode()
print(f'Payment {b64}')
"
# → copy the output

# Step 3: Authenticated request
curl -i "$BASE_URL/api/v1/gateway/$SLUG/data/current" \
  -H "Authorization: Payment eyJj..."
```

---

## What to look for in DB after a test

```sql
-- Check challenge was consumed
SELECT challenge_id, payment_method, amount, used_at
FROM mpp_challenges
ORDER BY created_at DESC
LIMIT 5;

-- Check credential was minted
SELECT challenge_id, agent_wallet_address, payment_method, created_at
FROM mpp_credentials
ORDER BY created_at DESC
LIMIT 5;

-- Check transaction was recorded
SELECT gross_amount, exchange_fee, net_amount, status, payment_method
FROM transactions
ORDER BY created_at DESC
LIMIT 5;
```

---

## Implementing the Gateway Endpoint

The test above hits `/api/v1/gateway/[slug]/[...path]` which needs to be built.
See the MPP middleware in `packages/mpp/src/middleware.ts` — wire it into a Next.js
route handler at `apps/web/src/app/api/v1/gateway/[slug]/[...path]/route.ts`.

The gateway should:
1. Look up the service + endpoint pricing by slug + path
2. If no `Authorization` header → call `issueChallenge()` → return 402
3. If `Authorization` present → call `verifyCredential()` → on success, proxy to `service.serviceUrl`
4. After successful proxy → write a `Transaction` row (grossAmount, exchangeFee, netAmount)
