# Pre-Go-Live Checklist

This document covers every external dependency you need to activate before the Agent Exchange
goes live. Group by how long each takes to provision so you can parallelize.

---

## 1. Database — Supabase (1–5 min)

| What | Where |
|------|-------|
| Create project | https://supabase.com/dashboard → New project |
| Connection string | Settings → Database → Connection string (Transaction mode / Pooler) |
| Prisma migration URL | Settings → Database → Connection string (Session mode / IPv4-friendly pooler) |

**Env vars to set:**
```
DATABASE_URL=postgres://postgres.[ref]:6543/postgres?pgbouncer=true
DIRECT_URL=postgres://postgres.[ref]:5432/postgres
```

Notes:
- `DATABASE_URL` is the pooled runtime connection.
- `DIRECT_URL` is the Prisma migration/introspection connection.
- For Supabase's IPv4-friendly Prisma setup, `DIRECT_URL` may still use the pooler host on port `5432`.
- Do not point `DIRECT_URL` at the pooled runtime URL on port `6543`.

After credentials are ready:
```bash
pnpm --filter @agent-exchange/db migrate:deploy   # runs Prisma migrations
pnpm tsx packages/db/seed.ts                       # seed demo data
```

---

## 2. Auth — Supabase Auth (5 min)

Supabase Auth is already bundled with your project — no extra signup needed.

- [ ] Authentication → Providers → enable **Email** (already on by default)
- [ ] Authentication → URL Configuration → set **Site URL** to your production domain
- [ ] Add redirect URL: `https://yourdomain.com/callback`
- [ ] Copy **SUPABASE_URL** and **SUPABASE_ANON_KEY** from Settings → API

**Env vars:**
```
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # used server-side only, never expose to client
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
```

---

## 3. Tempo / MPP Payments (1–3 days lead time)

Tempo is the primary payment method powering the MPP 402 flow.

- [ ] Contact Tempo at https://www.tempo.finance or the mppx Discord to get API access
- [ ] Provision a **merchant wallet** (your exchange receives funds here)
- [ ] Get your wallet address + API credentials

**Env vars:**
```
TEMPO_WALLET_ADDRESS=tempo:0x...          # exchange fee-receiving wallet
TEMPO_API_KEY=...                          # for on-chain verification (Phase 2)
TEMPO_WEBHOOK_SECRET=...                   # for Tempo-initiated callbacks
```

> Phase 1 ships with `verifyProof` stubbed to `true` — real on-chain verification
> plugs into `packages/payments/src/tempo.ts` when Tempo SDK is available.

---

## 4. Stripe (30 min)

Used for subscription billing and fiat payouts to service providers.

- [ ] Sign up at https://dashboard.stripe.com
- [ ] Activate your account (provide business details)
- [ ] Create a **webhook** endpoint pointing to `https://yourdomain.com/api/v1/webhooks/stripe`
  - Events to subscribe: `payment_intent.succeeded`, `payment_intent.payment_failed`,
    `payout.paid`, `payout.failed`
- [ ] Enable **Connect** if you want marketplace payouts (Stripe → Settings → Connect)

**Env vars:**
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

For local webhook testing:
```bash
stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe
```

---

## 5. Lightning Network (optional, 1–7 days)

For micropayment support via Lightning.

**Option A — Hosted node (fastest):**
- [ ] Voltage.cloud or Alby.tools — provision a node, get REST credentials

**Option B — Self-hosted LND:**
- [ ] Run LND behind a domain with TLS cert
- [ ] Export macaroon + TLS cert

**Env vars:**
```
LIGHTNING_NODE_URL=https://your-lnd-node:8080
LIGHTNING_MACAROON=<hex-encoded admin.macaroon>
LIGHTNING_TLS_CERT=<base64 tls.cert>
```

---

## 6. Redis / Cache (5 min)

Used for MPP challenge TTL lookups and API response caching.

**Option A — Upstash (serverless, recommended for Cloud Run):**
- [ ] https://console.upstash.com → Create Redis → copy REST URL + token

**Option B — GCP Memorystore (provisioned via Terraform):**
- [ ] `terraform apply` in `infra/terraform/` creates a Memorystore instance
- [ ] Get the private IP from GCP Console → Memorystore

**Env vars (one or the other):**
```
# Upstash
UPSTASH_REDIS_REST_URL=https://[id].upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# ioredis / Memorystore
REDIS_URL=redis://10.0.0.x:6379
CACHE_ADAPTER=ioredis   # or 'upstash' or 'memory'
```

---

## 7. GCP Infrastructure (1–2 hours)

```
Project → Cloud Run (web app) + Cloud SQL (Postgres) + Memorystore (Redis)
```

**One-time setup:**
```bash
gcloud auth login
gcloud projects create agent-exchange-prod
gcloud config set project agent-exchange-prod

# Enable APIs
gcloud services enable run.googleapis.com sqladmin.googleapis.com \
  secretmanager.googleapis.com artifactregistry.googleapis.com \
  redis.googleapis.com

# Create service account for CI/CD
gcloud iam service-accounts create github-actions \
  --display-name "GitHub Actions deployer"
gcloud projects add-iam-policy-binding agent-exchange-prod \
  --member serviceAccount:github-actions@agent-exchange-prod.iam.gserviceaccount.com \
  --role roles/run.admin
# (also add roles/cloudsql.client, roles/storage.admin, roles/secretmanager.secretAccessor)

# Export key for GitHub secret
gcloud iam service-accounts keys create gcp-sa-key.json \
  --iam-account github-actions@agent-exchange-prod.iam.gserviceaccount.com
```

Then `cd infra/terraform && terraform init && terraform apply`.

**Env vars:**
```
GCP_PROJECT_ID=agent-exchange-prod
GCP_REGION=us-central1
GCP_SA_KEY=<contents of gcp-sa-key.json>   # → GitHub secret only, never in code
```

---

## 8. Domain & TLS (10 min + DNS propagation)

- [ ] Register domain (Cloudflare Domains recommended — free WHOIS privacy)
- [ ] In GCP Console → Cloud Run → your service → **Custom Domains** → Map domain
- [ ] GCP auto-provisions a managed TLS cert (takes 10–30 min after DNS propagation)
- [ ] Add the CNAME/A records GCP gives you to your DNS provider

---

## 9. Transactional Email (15 min)

Used for service approval notifications, payout confirmations, auth emails.

- [ ] https://resend.com → create account → Domains → add your domain
- [ ] Add the 3 DNS records Resend provides (SPF, DKIM, DMARC)
- [ ] Create an API key

**Env vars:**
```
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com
```

---

## 10. GitHub Actions Secrets

Add all of the above to **Settings → Secrets → Actions** in your repo:

```
DATABASE_URL
DIRECT_URL
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXTAUTH_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
TEMPO_WALLET_ADDRESS
TEMPO_API_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
GCP_PROJECT_ID
GCP_REGION
GCP_SA_KEY
RESEND_API_KEY
```

---

## 11. Final Pre-Launch Checks

```bash
# Migrations applied to prod DB
pnpm --filter @agent-exchange/db migrate:deploy

# TypeScript clean
pnpm tsc --noEmit

# Build succeeds
pnpm build

# Smoke test all routes
curl https://yourdomain.com/api/v1/services
curl https://yourdomain.com/api/v1/services/your-slug/endpoints
```

- [ ] Test a full MPP 402 flow end-to-end (see `docs/PAYMENT_TEST.md`)
- [ ] Verify Stripe webhook arrives after a test payment
- [ ] Confirm admin panel approve/suspend actions work
- [ ] Check `/marketplace` loads real data (not seed data)

---

## Timeline Summary

| Item | Effort | Lead Time |
|------|--------|-----------|
| Supabase DB + Auth | 15 min | Instant |
| Redis (Upstash) | 5 min | Instant |
| Stripe | 30 min | Instant (test), 1–2 days (live) |
| Domain + DNS | 10 min | 1–24 hr propagation |
| Resend email | 15 min | 1–24 hr DNS |
| GCP + Terraform | 1–2 hr | Instant |
| Tempo / MPP | 1 hr setup | 1–3 days approval |
| Lightning (optional) | 2–4 hr | 1–7 days |
