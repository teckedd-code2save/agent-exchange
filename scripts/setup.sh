#!/bin/bash
set -e

echo "→ Checking prerequisites..."
node --version
pnpm --version
docker --version

echo "→ Installing dependencies..."
pnpm install

echo "→ Starting local services (Postgres + Redis)..."
docker compose -f infra/docker/docker-compose.yml up -d postgres redis

echo "→ Waiting for Postgres..."
sleep 3

echo "→ Running migrations..."
pnpm db:migrate

echo "→ Seeding initial services from MPP registry..."
pnpm tsx scripts/seed.ts

echo "→ Copying env file..."
cp .env.example .env.local
echo "⚠  Edit .env.local and fill in your Supabase + Stripe keys"

echo "✓ Setup complete. Run: pnpm dev"
