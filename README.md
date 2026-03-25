# MPP Studio

MPP Studio is a Next.js 14 platform for registering, testing, and operating paid AI services over the Machine Payments Protocol. Providers can onboard APIs, exercise sandbox `402 Payment Required` flows, inspect service contracts, and move toward testnet/live payment rails.

## Stack

- `apps/web` — Next.js 14 App Router app for dashboard + API routes
- `packages/db` — Prisma schema and database client
- `packages/cache` — memory, Redis, and Upstash cache adapters
- `packages/mpp` — MPP challenge, verification, and middleware helpers
- `packages/payments` — Stripe and Tempo integrations

## Local setup

```bash
pnpm install
cp .env.example apps/web/.env.local
pnpm dev
```

Required local env:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Useful commands

```bash
pnpm dev
pnpm build
pnpm typecheck
pnpm db:generate
pnpm db:migrate
pnpm seed:echo
pnpm test:payment
```

## Deploy to Vercel

Vercel is the recommended host for this repo.

Project settings:

- Root Directory: `apps/web`
- Framework: `Next.js`
- Node.js: `20`

See [`docs/DEPLOY_VERCEL.md`](docs/DEPLOY_VERCEL.md) for:

- required Vercel environment variables
- Supabase callback and recovery URLs
- staging vs production guidance

## Auth

Supabase handles authentication. The app is set up for:

- email + password sign-in
- magic links
- password recovery via `/forgot-password` and `/reset-password`

For Vercel or local development, make sure Supabase Auth includes the exact callback URLs you use, especially:

- `/callback`
- `/reset-password`

## Notes

- `DATABASE_URL` should be the pooled runtime connection.
- `DIRECT_URL` should be the direct Prisma connection.
- `NEXT_PUBLIC_APP_URL` is optional on Vercel; the app can infer its public URL from `VERCEL_URL`.
- The app is portable, but Vercel + Supabase + Upstash is the easiest path.
