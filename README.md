# Agent Exchange

A protocol-native marketplace where AI agents discover and pay for third-party services. Think: an app store for autonomous agents. Services register their APIs (MPP, MCP, OpenAPI, A2A), agents discover them via a queryable registry, and pay using Tempo (USDC), Stripe (card), or Lightning (BTC).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Agent Exchange                        │
├──────────────┬──────────────┬────────────────┬──────────────┤
│  apps/web    │  packages/   │  packages/     │  packages/   │
│  Next.js 14  │  db          │  cache         │  mpp         │
│  App Router  │  Prisma +    │  Memory /      │  MPP 402     │
│  API routes  │  Supabase    │  IoRedis /     │  engine      │
│  Dashboard   │  Postgres 15 │  Upstash       │  challenge   │
│  Auth (SB)   │  23 tables   │  (swappable)   │  verify      │
├──────────────┴──────────────┴────────────────┴──────────────┤
│  packages/payments       │  infra/                          │
│  Stripe + Tempo (USDC)   │  GCP: Cloud Run + Cloud SQL +    │
│  Lightning stub (Ph2)    │  Memorystore | AWS: ECS+RDS+EC   │
└──────────────────────────┴──────────────────────────────────┘
```

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for local Postgres + Redis)

## Quick Start

```bash
git clone https://github.com/teckedd-code2save/agent-exchange.git
cd agent-exchange
./scripts/setup.sh
# Edit .env.local with your Supabase + Stripe keys
pnpm dev
```

## Environment Variables

See [`.env.example`](.env.example) for all required variables.

Key variables:
- `DATABASE_URL` — Postgres connection string
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase auth
- `CACHE_PROVIDER` — `memory` (dev) | `ioredis` (local with Docker) | `upstash` (prod)
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` — Stripe payments
- `TEMPO_WALLET_ADDRESS` — Exchange wallet for USDC receipts

## Project Structure

```
agent-exchange/
├── apps/web/           # Next.js 14 App Router (API + Dashboard UI)
├── packages/
│   ├── db/             # Prisma schema (23 tables) + repositories
│   ├── cache/          # Provider-agnostic cache adapter (memory/ioredis/upstash)
│   ├── mpp/            # MPP 402 payment protocol engine
│   └── payments/       # Stripe + Tempo SDK wrappers
├── infra/
│   ├── docker/         # docker-compose.yml (dev) + ci.yml
│   └── terraform/      # GCP (default) + AWS modules
├── .github/workflows/  # CI, deploy-staging, deploy-prod
└── scripts/            # setup.sh, seed.ts
```

## Adding a New API Route

1. Create `apps/web/src/app/api/v1/<your-route>/route.ts`
2. Use `repos.*` from `@/lib/db` for all DB access (never raw Prisma in routes)
3. Return errors using `problemDetails()` from `@/types/index` (RFC 9457)
4. For MPP-gated routes, wrap with `withMppAuth()` from `@agent-exchange/mpp`
5. Add tests in `apps/web/src/__tests__/`

## Running Tests

```bash
# Start dependencies
docker compose -f infra/docker/docker-compose.yml up -d postgres redis

# Run all tests
pnpm test

# Run specific package
pnpm --filter @agent-exchange/web test
```

## Deployment

### Vercel (current hosting)

Push to `main` → auto-deploys to Vercel preview via GitHub Actions.

Production deploy: manually trigger `Deploy Production` workflow in GitHub Actions.

Required secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### Self-hosted (any Node 20 host)

```bash
pnpm build
node apps/web/.next/standalone/server.js
```

No Vercel-specific APIs used in application code — portable by design.

## Infrastructure (Terraform)

GCP is the default cloud provider:

```bash
cd infra/terraform
terraform init
terraform apply \
  -var="cloud_provider=gcp" \
  -var="gcp_project_id=YOUR_PROJECT" \
  -var="app_image=gcr.io/YOUR_PROJECT/agent-exchange:latest" \
  -var="db_password=YOUR_SECURE_PASSWORD" \
  -var-file="environments/production/terraform.tfvars"
```

To switch to AWS, set `cloud_provider=aws` — same module interface, different resources.

## Contributing

1. Create a feature branch from `main`
2. Run `pnpm lint && pnpm typecheck` before opening a PR
3. CI must pass (lint + typecheck + tests) for merge
4. No `any` types. Money values use `Decimal` from `decimal.js`. All DB access through repositories.
