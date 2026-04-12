# MPP Studio

> **The payment layer for AI services.** Build paid APIs with HTTP 402, test with fake money in sandbox, graduate to real USDC on Base, and get discovered by agents that pay automatically.

`x402` · `MPP` · `Base Sepolia` · `USDC` · `Stripe` · `HTTP 402`

---

## What is this?

MPP Studio is a full-stack platform that lets API providers:

1. **Register** any HTTP API and get a studio proxy endpoint instantly
2. **Test** the full 402 payment flow with fake money — no wallet, no gas
3. **Graduate** to testnet with real USDC from the Circle faucet (Base Sepolia)
4. **Go live** and get discovered by AI agents that pay automatically per call

Agents on the other side discover services via the registry, negotiate HTTP 402 challenges, pay in USDC (x402/Tempo) or card (Stripe), and receive a `Payment-Receipt` header with every successful call.

---

## Stack

| Layer | Technology |
|---|---|
| Web app | Next.js 14 App Router + Hono 4.6 API |
| UI | Tailwind CSS 3.4, Inter + JetBrains Mono |
| Database | PostgreSQL 18 via Prisma 7 |
| Auth | Supabase Auth (email / magic link / OAuth) |
| Cache | Memory (dev) · ioredis · Upstash Redis |
| Payments | x402 + Coinbase CDP · Stripe · Tempo |
| Monorepo | Turborepo 2.0, pnpm 9 |
| Runtime | Node.js 20+ |

---

## Repository layout

```
agent-exchange/
├── apps/
│   ├── web/          # Next.js 14 dashboard + API routes  (port 3000)
│   └── api/          # Hono standalone API server          (port 3001)
├── packages/
│   ├── db/           # Prisma schema, client, repositories
│   ├── cache/        # memory | ioredis | Upstash adapters
│   ├── mpp/          # HTTP 402 challenge/verify + x402 helpers
│   └── payments/     # Stripe, Tempo, x402 integrations
├── infra/
│   ├── docker/       # docker-compose (Postgres 18 + Redis 7 + Adminer)
│   └── terraform/    # AWS modules (production)
├── scripts/          # seed-echo-service.ts, test-payment-flow.ts
└── docs/             # DEPLOY_VERCEL.md, PAYMENT_TEST.md, PRE_GO_LIVE.md
```

---

## Prerequisites

| Tool | Minimum version |
|---|---|
| Node.js | 20.x |
| pnpm | 9.x — `npm i -g pnpm` |
| Docker + Compose | any recent version (for local Postgres + Redis) |

---

## 1 — Clone and install

```bash
git clone https://github.com/teckedd-code2save/agent-exchange.git
cd agent-exchange
pnpm install
```

---

## 2 — Start the database and cache

```bash
docker compose -f infra/docker/docker-compose.yml up -d postgres redis
```

This starts:

| Service | Port | Credentials |
|---|---|---|
| PostgreSQL 18 | `5432` | user `postgres` / password `postgres` / db `agent_exchange` |
| Redis 7 | `6379` | no auth |
| Adminer (DB UI) | `8080` | connect to `postgres:5432` |

Wait for the health checks to pass (a few seconds), then verify:

```bash
docker compose -f infra/docker/docker-compose.yml ps
# STATUS should show "healthy" for postgres and redis
```

---

## 3 — Configure environment

```bash
cp .env.example apps/web/.env.local
```

Open `apps/web/.env.local` and fill in the values below. The sections marked **required** must be set before the app will start. Optional sections can be left blank to disable that feature.

### 3.1 — App URLs (required)

```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3.2 — Database (required)

For local Docker Postgres use these defaults exactly:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agent_exchange
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/agent_exchange
```

> **Two separate URLs are required.** `DATABASE_URL` is the pooled runtime connection; `DIRECT_URL` is used by Prisma for migrations and introspection. They can be the same string for local Docker. For Supabase they differ — see [§ Supabase DB](#supabase-db) below.

### 3.3 — Auth (required for production, optional locally)

**Option A — skip auth in development (fastest)**

```env
AUTH_BYPASS=true
NEXT_PUBLIC_AUTH_BYPASS=true
```

When `AUTH_BYPASS=true` every request is treated as a single local dev provider (`dev-bypass-user`). No Supabase account needed.

**Option B — real Supabase auth**

1. Create a free project at <https://supabase.com>
2. Go to **Project Settings → API**
3. Copy the values:

```env
AUTH_BYPASS=false
NEXT_PUBLIC_AUTH_BYPASS=false
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

4. In the Supabase dashboard go to **Authentication → URL Configuration** and add:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/callback`, `http://localhost:3000/reset-password`

### 3.4 — Cache (required)

For local development use the in-memory adapter — no Redis configuration needed:

```env
CACHE_PROVIDER=memory
```

To use the local Redis container:

```env
CACHE_PROVIDER=ioredis
REDIS_URL=redis://localhost:6379
```

To use Upstash (recommended for Vercel deployments):

```env
CACHE_PROVIDER=upstash
UPSTASH_REDIS_REST_URL=https://<id>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<token>
```

### 3.5 — Stripe (optional)

Leave blank to disable Stripe payment challenges. The sandbox mode works without it.

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Get keys from <https://dashboard.stripe.com> → Developers → API keys.

For local webhook testing:

```bash
stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe
```

### 3.6 — x402 / USDC on Base (optional — enables real testnet payments)

x402 lets agents pay with USDC on Base Sepolia (testnet) or Base (mainnet) using EIP-712 signed transfers, verified by the Coinbase CDP facilitator — no Stripe, no blockchain node required server-side.

```env
X402_PAY_TO_ADDRESS=0xYourEVMWallet   # address that receives USDC
X402_NETWORK=base-sepolia             # base-sepolia | base
```

To get free testnet USDC for your wallet (20 USDC / 2 hours):

```
https://faucet.circle.com
→ Select "Base Sepolia"
→ Paste your wallet address
→ Claim
```

Full testnet info is also available at runtime:

```bash
curl http://localhost:3001/api/v1/faucet/testnet-info
```

### 3.7 — Tempo (optional)

```env
TEMPO_WALLET_ADDRESS=0x...
TEMPO_API_KEY=
MPP_CHALLENGE_TTL_SECONDS=300
```

### 3.8 — Admin emails (optional)

Comma-separated list of emails that can access `/admin`:

```env
ADMIN_EMAILS=you@example.com,colleague@example.com
```

---

## 4 — Run database migrations

```bash
pnpm db:migrate
```

This applies all Prisma migrations to the local Postgres instance and creates the six core tables: `Provider`, `Service`, `ApiKey`, `Call`, `Review`, `FaucetClaim`.

If Prisma client is out of date after a schema change:

```bash
pnpm db:generate
```

To browse the database in a GUI:

```bash
pnpm db:studio       # Opens Prisma Studio on http://localhost:5555
# — or —
open http://localhost:8080   # Adminer (already running via Docker)
```

---

## 5 — Seed test data (optional)

```bash
pnpm seed:echo
```

This registers a local echo service in the database so the sandbox proxy has something to test against.

---

## 6 — Start dev servers

```bash
pnpm dev
```

| Server | URL | Purpose |
|---|---|---|
| Next.js | <http://localhost:3000> | Dashboard, marketplace, auth, API routes |
| Hono API | <http://localhost:3001> | Discovery, proxy, faucet, admin |

---

## 7 — Verify everything works

```bash
# Health check
curl http://localhost:3001/api/v1/discovery

# Sandbox faucet
curl -X POST http://localhost:3001/api/v1/faucet/claim \
  -H "Content-Type: application/json" \
  -d '{"walletId":"test-wallet-001"}'

# x402 testnet info
curl http://localhost:3001/api/v1/faucet/testnet-info

# Run the full payment flow test
pnpm test:payment
```

Open the dashboard at <http://localhost:3000/dashboard> and register your first service.

---

## All dev commands

```bash
pnpm dev             # Start all servers
pnpm build           # Build all packages and apps
pnpm lint            # ESLint across all workspaces
pnpm typecheck       # TypeScript check across all workspaces
pnpm test            # Run Vitest tests
pnpm format          # Prettier format

pnpm db:migrate      # Apply Prisma migrations (dev)
pnpm db:generate     # Regenerate Prisma client after schema change
pnpm db:studio       # Open Prisma Studio GUI

pnpm seed:echo       # Seed echo test service
pnpm test:payment    # End-to-end payment flow script
```

**Run before every PR:**

```bash
pnpm lint && pnpm typecheck
```

---

## Payment flow — quick reference

Every proxied request goes through this cycle:

```
Client → GET /api/v1/proxy/{slug}/your/path

← 402 Payment Required
  WWW-Authenticate: Payment challenge="ch_a1b2c3d4",
    method="x402", amount="0.01", currency="USDC"

Client signs EIP-712 payment (x402) or presents Stripe PaymentIntent

→ GET /api/v1/proxy/{slug}/your/path
  X-Payment: <base64url EIP-712 payload>       ← x402
  Authorization: Payment <base64url JSON>       ← MPP credential

← 200 OK
  Payment-Receipt: rcpt_9x8y7z
  X-Payment-Response: rcpt_9x8y7z              ← mirrored for x402 clients
```

### Sandbox (no wallet needed)

```bash
# 1. Hit the proxy — get a 402
curl -i http://localhost:3001/api/v1/proxy/echo-service/

# 2. Retry with sandbox credential
CRED=$(echo -n '{"challengeId":"any","paymentMethod":"sandbox","agentWalletAddress":"test","proof":"sandbox-credential"}' | base64 -w 0)
curl http://localhost:3001/api/v1/proxy/echo-service/ \
  -H "Authorization: Payment $CRED"
```

### x402 testnet (real USDC on Base Sepolia)

1. Get 20 USDC at <https://faucet.circle.com> → Base Sepolia
2. Register your service with `x402` in `supportedPayments`
3. Set `X402_PAY_TO_ADDRESS` and `X402_NETWORK=base-sepolia` in your env
4. Use the [x402 SDK](https://github.com/coinbase/x402) or sign the EIP-712 payload manually
5. Submit the signed payload as `X-Payment: <base64url>`

---

## Database schema — at a glance

| Model | Purpose |
|---|---|
| `Provider` | API owner, linked to Supabase auth, holds testnet/live balances |
| `Service` | The registered API: slug, endpoint, status, pricing, supportedPayments |
| `ApiKey` | Environment-scoped tokens (sandbox / testnet / production) |
| `Call` | Full transaction ledger — every proxy request, challenge, and receipt |
| `Review` | Agent attestations with ratings, optional proof-of-usage via callId |
| `FaucetClaim` | Testnet USDC distribution with 24-hour cooldown per wallet |

**Service status lifecycle:** `draft → sandbox → testnet → live | paused`

**Payment types:** `sandbox` · `x402` · `stripe` · `tempo` · `lightning`

---

## Supabase DB

For production / Vercel deployments use the Supabase connection strings:

```env
# Pooled runtime connection (port 6543, pgbouncer=true)
DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct migration connection (port 5432 — do NOT use port 6543 here)
DIRECT_URL=postgresql://postgres.<ref>:<password>@aws-<region>.pooler.supabase.com:5432/postgres
```

Find these in the Supabase dashboard under **Project Settings → Database → Connection string**.

After updating the remote database:

```bash
pnpm --filter @agent-exchange/db migrate:deploy
```

---

## Deploy to Vercel

```
Root Directory:  apps/web
Framework:       Next.js
Node.js:         20
```

Set all the environment variables from `apps/web/.env.local` in the Vercel project dashboard.
Cache provider recommendation: **Upstash** (serverless-compatible, instant setup).

Full deployment guide: [`docs/DEPLOY_VERCEL.md`](docs/DEPLOY_VERCEL.md)

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `prisma: not found` after clone | Run `pnpm install` first — Prisma CLI is a dev dep |
| `DIRECT_URL` migration error | Make sure `DIRECT_URL` points to port `5432`, **not** `6543` |
| `Cannot connect to database` | Confirm Docker containers are running: `docker compose -f infra/docker/docker-compose.yml ps` |
| `AUTH_BYPASS` not working | Set **both** `AUTH_BYPASS=true` and `NEXT_PUBLIC_AUTH_BYPASS=true` |
| x402 payment not verified | Set `X402_PAY_TO_ADDRESS` in env; run `GET /api/v1/faucet/testnet-info` for setup steps |
| Sandbox credential rejected | Proof must equal `"sandbox-credential"` or start with `"test_proof_"` |
| Hono API not starting | Check `PORT` env var (default `3001`) and that `DATABASE_URL` is set |
| Cache errors | Set `CACHE_PROVIDER=memory` to bypass Redis for local dev |

---

## Contributing

```bash
# Create a feature branch
git checkout -b feat/your-feature

# Develop, then verify
pnpm lint && pnpm typecheck

# Commit using Conventional Commits
git commit -m "feat: add your feature"
```

Commit prefixes: `feat:` · `fix:` · `refactor:` · `docs:` · `test:` · `chore:`

No `any` types. Money values always use `Decimal` from `decimal.js`, never `number` or `float`.
