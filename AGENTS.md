# Repository Guidelines

## Project Structure & Module Organization
- `apps/web/` — Next.js 14 App Router app (API routes + dashboard UI).
- `packages/` — shared domain libraries:
  - `db/` Prisma schema and repositories
  - `cache/` provider-agnostic cache adapters
  - `mpp/` MPP 402 payment protocol engine
  - `payments/` Stripe + Tempo wrappers
- `infra/` — Docker and Terraform for local/dev/prod.
- `scripts/` — setup and seed utilities.
- `docs/` — product/tech docs.

## Build, Test, and Development Commands
- `pnpm dev` — run all dev servers via Turborepo.
- `pnpm build` — build all packages/apps.
- `pnpm lint` — lint all workspaces.
- `pnpm typecheck` — TypeScript checks across workspaces.
- `pnpm test` — run tests (when present).
- `pnpm db:migrate` — run Prisma migrate for `@agent-exchange/db`.
- `pnpm db:generate` — regenerate Prisma client.
- `pnpm test:payment` — run payment flow script.

Local deps (Postgres/Redis):
- `docker compose -f infra/docker/docker-compose.yml up -d postgres redis`

## Coding Style & Naming Conventions
- TypeScript is standard across the repo.
- Prettier enforces `tabWidth: 2`, `singleQuote: true`, `semi: true`, `printWidth: 100`.
- ESLint rules: no `any`, unused args must be prefixed with `_`, `console` is limited to `warn|error|info`.
- API routes: `apps/web/src/app/api/v1/<route>/route.ts`.
- DB access: use repositories from `@/lib/db` (avoid raw Prisma in routes).

## Testing Guidelines
- `vitest` is included in `apps/web`; tests are run via `pnpm test`.
- The README suggests adding tests under `apps/web/src/__tests__/` (create this if missing).
- Keep tests close to new behavior and name files `*.test.ts` or `*.spec.ts`.

## Commit & Pull Request Guidelines
- Commit messages follow Conventional Commits (examples: `feat: ...`, `fix: ...`).
- Branch from `main` and open PRs with a clear description and linked issues.
- UI changes should include screenshots or short clips.
- Before PR: run `pnpm lint && pnpm typecheck` and ensure CI passes (lint, typecheck, tests).
- Project rule: no `any` types; money values use `Decimal` (`decimal.js`).

## Security & Configuration Tips
- Configure `.env.local` from `.env.example` and keep secrets out of git.
- Required keys include Supabase, Stripe, and database credentials.
