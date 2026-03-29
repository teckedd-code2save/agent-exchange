# Deploy MPP Studio To Vercel

## Recommended stack

- Vercel for `apps/web`
- Supabase for auth + Postgres
- Upstash Redis for cache and rate limiting

## Vercel project setup

1. Import the repository into Vercel.
2. Set the Root Directory to `apps/web`.
3. Keep the framework preset as `Next.js`.
4. Use Node.js 20.

## Required environment variables

Add these to both Preview and Production:

```bash
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
UPSTASH_REDIS_REST_URL=https://<instance>.upstash.io
UPSTASH_REDIS_REST_TOKEN=...
MPP_CHALLENGE_TTL_SECONDS=300
ADMIN_EMAILS=you@example.com
```

Optional payment rails:

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
TEMPO_API_KEY=...
TEMPO_WALLET_ADDRESS=0x...
TEMPO_WALLET_PRIVATE_KEY=...
```

## Supabase auth settings

Set your Supabase Auth URLs carefully.

### Site URL

- Production domain, for example `https://studio.example.com`

### Redirect URLs

- `https://studio.example.com/callback`
- `https://<your-preview>.vercel.app/callback`
- `http://localhost:3000/callback`

If you use password recovery, also allow:

- `https://studio.example.com/reset-password`
- `https://<your-preview>.vercel.app/reset-password`
- `http://localhost:3000/reset-password`

## Deployment notes

- `NEXT_PUBLIC_APP_URL` is optional on Vercel. The app falls back to `VERCEL_URL`.
- Keep `DATABASE_URL` as the pooled runtime connection.
- Keep `DIRECT_URL` as the Prisma migration/introspection connection.
  - Supabase with IPv4-friendly pooling: `DATABASE_URL` should use `:6543` with `?pgbouncer=true`, while `DIRECT_URL` should use the session-mode pooler on `:5432`.
  - Do not reuse the same pooled runtime URL for both.
- Use separate Supabase projects for staging and production.
