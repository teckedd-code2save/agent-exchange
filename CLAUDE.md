# CLAUDE.md — AI Assistant Guide for MPP Studio

This file provides context and conventions for AI assistants (Claude Code and others) working in this repository.

---

## Project Overview

**MPP Studio** is a Turborepo monorepo implementing a web platform for registering, testing, and operating paid AI services over the **Machine Payments Protocol (MPP)** — an HTTP 402-based payment negotiation standard.

Providers onboard APIs into the platform, run sandbox/testnet flows, and ultimately accept real payments (Stripe, Tempo blockchain, Lightning). Agents discover services via a marketplace and pay-per-call through the MPP 402 challenge flow.

---

## Repository Structure

```
agent-exchange/
├── apps/
│   ├── web/              # Next.js 14 App Router (dashboard + API routes), port 3000
│   └── api/              # Hono standalone API server, port 3001
├── packages/
│   ├── db/               # Prisma schema, client singleton, and data repositories
│   ├── cache/            # Provider-agnostic cache (memory | ioredis | Upstash)
│   ├── mpp/              # MPP challenge generation, verification, middleware
│   └── payments/         # Stripe and Tempo payment integrations
├── infra/
│   ├── docker/           # docker-compose for local Postgres + Redis
│   └── terraform/        # AWS Terraform modules (production)
├── scripts/              # Seed and test scripts (TypeScript, run via tsx)
├── docs/                 # Product, deploy, and integration documentation
└── .github/workflows/    # CI/CD: lint, typecheck, test, deploy
```

Shared packages are imported as `@agent-exchange/<package>` (e.g., `@agent-exchange/db`).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+, pnpm 9+, TypeScript 5.4+ |
| Monorepo | Turbo 2.0 |
| Web app | Next.js 14 (App Router), React 18.3 |
| Standalone API | Hono 4.6 + @hono/node-server |
| Styling | Tailwind CSS 3.4 |
| Database | PostgreSQL via Prisma 7 |
| Auth | Supabase Auth (JWT / Bearer tokens) |
| Cache | Memory (dev) / ioredis / Upstash Redis |
| Payments | Stripe (PaymentIntent), Tempo (blockchain), Sandbox (fake) |
| Testing | Vitest |
| Formatting | Prettier (tabWidth 2, singleQuote, semi, printWidth 100) |
| Linting | ESLint with @typescript-eslint |

---

## Local Development Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start infrastructure (Postgres + Redis)
docker compose -f infra/docker/docker-compose.yml up -d postgres redis

# 3. Copy and configure environment
cp .env.example apps/web/.env.local
# Edit apps/web/.env.local with required values (see Environment Variables below)

# 4. Run database migrations
pnpm db:migrate

# 5. Start all dev servers
pnpm dev
```

### Required Environment Variables

Configure these in `apps/web/.env.local`:

```bash
# Database (two URLs required — pooled runtime + direct migration)
DATABASE_URL=             # Pooled connection (e.g., Supabase pooler port 6543)
DIRECT_URL=               # Direct Prisma migration connection (port 5432)

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

# Cache (memory | ioredis | upstash)
CACHE_PROVIDER=memory
REDIS_URL=                # Required if CACHE_PROVIDER=ioredis
UPSTASH_REDIS_REST_URL=   # Required if CACHE_PROVIDER=upstash
UPSTASH_REDIS_REST_TOKEN=

# Payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
TEMPO_WALLET_ADDRESS=
TEMPO_API_KEY=

# Development shortcuts
AUTH_BYPASS=true                    # Skip auth, creates 'dev-bypass-user'
NEXT_PUBLIC_AUTH_BYPASS=true
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Development Commands

```bash
pnpm dev             # Start all servers (Next.js on 3000, Hono on 3001)
pnpm build           # Build all packages and apps
pnpm lint            # ESLint across all workspaces
pnpm typecheck       # TypeScript check across all workspaces
pnpm test            # Run Vitest tests
pnpm format          # Prettier format all TS/TSX/JSON/MD files

pnpm db:migrate      # Run Prisma migrations (dev)
pnpm db:generate     # Regenerate Prisma client after schema changes
pnpm db:studio       # Open Prisma Studio GUI

pnpm seed:echo       # Seed local echo test service (scripts/seed-echo-service.ts)
pnpm test:payment    # End-to-end payment flow test (scripts/test-payment-flow.ts)
```

**Always run before a PR:**
```bash
pnpm lint && pnpm typecheck
```

---

## Application Architecture

### MPP 402 Payment Flow

The core protocol this platform implements:

1. Agent/caller requests `GET/POST /api/v1/proxy/{slug}/{...path}`
2. If no `Authorization: Payment ...` header → server returns **HTTP 402** with `WWW-Authenticate` challenge header
3. Caller inspects challenge, acquires payment credential (sandbox/Stripe/Tempo)
4. Caller retries with `Authorization: Payment <credential>`
5. Server verifies credential → forwards request to upstream endpoint → returns response with `payment-receipt` header
6. Call is logged to the `Call` table in the database

### Web App API Routes (`apps/web/src/app/api/v1/`)

| Route | Methods | Purpose |
|---|---|---|
| `/proxy/[slug]/[...path]` | GET POST PUT PATCH DELETE | MPP proxy with 402 challenge |
| `/provider/services` | GET POST | List / create provider services |
| `/provider/balance` | GET | Provider wallet balance |
| `/provider/calls` | GET | Provider call history |
| `/provider/analytics` | GET | Provider analytics |

### Hono API Routes (`apps/api/src/`)

| Route | Purpose |
|---|---|
| `/api/v1/discovery` | Service discovery (filter by category, tags, payment type) |
| `/api/v1/services` | Service listing and registration |
| `/api/v1/proxy/{slug}/{path}` | Service proxy with 402 flow |
| `/api/v1/provider/*` | Provider operations |
| `/api/v1/faucet` | Testnet token distribution |
| `/api/v1/echo` | Echo test endpoint for development |
| `/api/v1/admin/*` | Admin utilities |

### Dashboard Pages (`apps/web/src/app/`)

Auth: `login`, `signup`, `forgot-password`, `reset-password`, `callback`
Dashboard: `dashboard/`, `marketplace/`, `admin/`

---

## Database Schema

### Models

**`Provider`** — Service owners linked to Supabase Auth
- `id` (cuid), `userId` (Supabase UID), `email`, `name`, `company`
- `testnetBalance`, `liveBalance` (Decimal)

**`Service`** — The core entity: an AI API registered on the platform
- `studioSlug` (unique URL identifier), `endpoint` (upstream URL)
- `status`: `draft → sandbox → testnet → live | paused`
- `pricingType`: `fixed | per_token | per_second`
- `pricingConfig`: JSON `{ amount: "0.005", currency: "USDC" }`
- `endpoints`: JSON array of endpoint contracts with test safety flags
- `lifecycle`: JSON guidance for sandbox/testnet/live readiness
- `supportedPayments`: array of `PaymentType` enum values
- Denormalized: `totalCalls`, `totalRevenue`

**`ApiKey`** — Environment-scoped tokens for providers
- `environment`: `sandbox | testnet | production`

**`Call`** — Transaction ledger (every proxy request)
- MPP flow flags: `challengeIssued`, `challengeSolved`, `receiptVerified`
- `paymentType`, `amount`, `currency`, `latencyMs`, `environment`

**`Review`** — Agent attestations with ratings (1–5), optional `callId` proof-of-usage

**`FaucetClaim`** — Testnet token distribution with rate limiting

### Key Enums

```typescript
Status:      draft | sandbox | testnet | live | paused
PricingType: fixed | per_token | per_second
PaymentType: tempo | stripe | lightning | sandbox
CallerType:  anonymous | identified_agent | user_proxy
Environment: sandbox | testnet | production
```

### After any schema change

```bash
pnpm db:generate    # Regenerate Prisma client
pnpm db:migrate     # Apply migration in dev
```

---

## Code Conventions

### TypeScript

- **Strict mode** is enforced everywhere — no `any` types (ESLint error)
- Unused function parameters must be prefixed with `_` (e.g., `_req`)
- `console` usage limited to `warn`, `error`, `info` — no `console.log`
- Path alias `@/*` maps to `apps/web/src/*`

### Money / Decimal Arithmetic

- **Never use JavaScript `number` for monetary values**
- Always use `Decimal` from `decimal.js`
- DB fields for money use Prisma `Decimal` type

### File Organization

```
apps/web/src/
├── app/
│   ├── api/v1/<route>/route.ts    # API route handlers
│   ├── <section>/page.tsx         # UI pages
│   └── layout.tsx                 # Root layout
├── lib/
│   ├── db.ts                      # DB client re-export (use this, not raw Prisma)
│   ├── <domain>.ts                # Domain helpers
│   └── types/                     # Shared TypeScript types
└── components/<name>.tsx          # React components
```

- **Import DB via `@/lib/db`**, not directly from `@agent-exchange/db` in route handlers
- Shared workspace packages: `@agent-exchange/db`, `@agent-exchange/cache`, `@agent-exchange/mpp`, `@agent-exchange/payments`

### Naming Conventions

- API slugs: lowercase with hyphens (auto-generated from service name)
- Database IDs: `cuid()` — cryptographically unique
- DB repository functions: `get*`, `create*`, `update*`, `delete*` prefixes
- React components: PascalCase
- Utility functions: camelCase

### Authentication Pattern

```typescript
// Development: set AUTH_BYPASS=true in .env.local
// This creates a 'dev-bypass-user' and skips Supabase auth

// Production: Supabase Auth with Bearer token
// API routes authenticate via authenticateProvider() helper
// Supports both Bearer token and Supabase session cookie
```

### Error Responses

Always return JSON errors in the shape `{ error: string }` with appropriate HTTP status:
- `200` — success
- `402` — payment required (MPP challenge, includes `WWW-Authenticate` header)
- `401` — unauthorized
- `404` — not found
- `500` — internal server error

---

## Testing

- Framework: **Vitest** (configured via Turbo)
- Test location: `apps/web/src/__tests__/`
- File naming: `*.test.ts` or `*.spec.ts`
- Run: `pnpm test`

For end-to-end payment flow testing:
```bash
pnpm test:payment    # Runs scripts/test-payment-flow.ts
```

CI environment uses Postgres 18 and Redis 7 via GitHub Actions services.

---

## Commit & PR Guidelines

- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- Branch from `main`; PRs require clear description and linked issues
- UI changes: include screenshots or short screen recordings
- Pre-PR checklist: `pnpm lint && pnpm typecheck` must pass
- No force-pushes to `main`
- No `any` types — ever
- Money always uses `Decimal`, never `number` or `float`

---

## Deployment

**Recommended:** Vercel + Supabase + Upstash Redis

Vercel settings:
- Root Directory: `apps/web`
- Framework: `Next.js`
- Node.js: `20`

See [`docs/DEPLOY_VERCEL.md`](docs/DEPLOY_VERCEL.md) for full environment variable list, Supabase callback URL configuration, and staging vs production guidance.

**Important URL notes:**
- `DATABASE_URL` → pooled runtime connection (Supabase pooler, port 6543)
- `DIRECT_URL` → direct connection for Prisma migrations (port 5432)
- Do **not** point `DIRECT_URL` at the pooled runtime URL on port 6543

---

## Key Documentation

| File | Purpose |
|---|---|
| `README.md` | Project overview and quick setup |
| `AGENTS.md` | Concise coding and commit guidelines |
| `MPP_STUDIO_STRATEGY.md` | Product strategy, user stories, schema rationale |
| `docs/DEPLOY_VERCEL.md` | Vercel deployment guide |
| `docs/PAYMENT_TEST.md` | Payment flow testing guide |
| `docs/PRE_GO_LIVE.md` | Go-live checklist |
| `docs/TEMPO_BLOCKER.md` | Tempo blockchain integration status |
