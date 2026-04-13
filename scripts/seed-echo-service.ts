#!/usr/bin/env tsx
/**
 * Upserts a local echo test service into the DB.
 * The service points to http://localhost:3000/api/v1/echo so the gateway
 * can complete a full 402 flow locally without a real upstream.
 *
 * Usage:
 *   pnpm seed:echo
 *
 * After running, select "Local Echo (test)" in the Gateway Tester.
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// Load from .env.local at the repo root (where DIRECT_URL lives)
config({ path: resolve(process.cwd(), '.env.local') });

const directUrl = process.env.DIRECT_URL;
if (!directUrl) {
  process.stderr.write('Error: DIRECT_URL is not set. Add it to .env.local\n');
  process.exit(1);
}

// Use the pg adapter directly so we can disable SSL for local Docker postgres.
const pool = new Pool({
  connectionString: directUrl,
  ssl: false,
  max: 1,
  idleTimeoutMillis: 5_000,
  connectionTimeoutMillis: 10_000,
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const BASE_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';

async function main() {
  console.log('→ Upserting echo test service...\n');

  // Reuse or create a system provider (no real Supabase user needed for seeding)
  const provider = await prisma.provider.upsert({
    where: { userId: 'system-seed-user' },
    update: {},
    create: {
      userId: 'system-seed-user',
      email: 'system@agentexchange.dev',
      name: 'Agent Exchange System',
      company: 'Agent Exchange',
    },
  });

  console.log(`✓ Provider: ${provider.email}`);

  // Upsert the echo service
  const service = await prisma.service.upsert({
    where: { studioSlug: 'echo-test' },
    update: {
      endpoint: `${BASE_URL}/api/v1/echo`,
      status: 'sandbox',
    },
    create: {
      providerId: provider.id,
      name: 'Local Echo (test)',
      description:
        'A local echo service that reflects the request back as JSON. Use this to test the full MPP 402 gateway flow end-to-end without a real upstream.',
      studioSlug: 'echo-test',
      endpoint: `${BASE_URL}/api/v1/echo`,
      status: 'sandbox',
      category: 'testing',
      tags: ['echo', 'test', 'local', 'dev'],
      pricingType: 'fixed',
      pricingConfig: { amount: '0.001', currency: 'USDC' },
      supportedPayments: ['tempo', 'sandbox'],
      endpoints: [
        {
          method: 'GET',
          path: '/reflect',
          name: 'Echo GET',
          description:
            'Reflects headers, query params, and the injected wallet address back as JSON.',
          supportsSandbox: true,
          supportsTestnet: true,
          supportsLive: false,
          liveSafe: false,
          sideEffects: false,
          idempotent: true,
          recommendedForTesting: true,
          isPrimaryTest: true,
        },
        {
          method: 'POST',
          path: '/reflect',
          name: 'Echo POST',
          description:
            'Reflects body, headers, and the injected wallet address back as JSON.',
          supportsSandbox: true,
          supportsTestnet: true,
          supportsLive: false,
          liveSafe: false,
          sideEffects: false,
          idempotent: true,
          recommendedForTesting: true,
          isPrimaryTest: false,
        },
      ],
      lifecycle: {
        sandboxReady: true,
        testnetReady: true,
        liveReady: false,
        recommendedFlow: 'sandbox',
      },
    },
  });

  console.log(`✓ Service: ${service.name} (${service.studioSlug})`);
  console.log(`  endpoint:     ${service.endpoint}`);
  console.log(`  status:       ${service.status}`);
  console.log(`  payments:     ${service.supportedPayments.join(', ')}`);
  console.log(`  endpoints:    /reflect (GET), /reflect (POST)\n`);

  console.log(`✅ Echo service ready!`);
  console.log(`\n   Gateway tester → select "Local Echo (test)" → /reflect → GET`);
  console.log(`   Or run: SERVICE_SLUG=echo-test ENDPOINT=/reflect pnpm test:payment\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
