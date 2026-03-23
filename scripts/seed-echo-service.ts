#!/usr/bin/env tsx
/**
 * Upserts a local echo test service into the DB.
 * The service points to http://localhost:3000/api/v1/echo so the gateway
 * can complete a full 200 flow locally without a real upstream.
 *
 * Usage:
 *   pnpm tsx scripts/seed-echo-service.ts
 *
 * After running, select "Local Echo (test)" in the Gateway Tester.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';

async function main() {
  console.log('→ Upserting echo test service...\n');

  // Reuse or create a system org
  const org = await prisma.organisation.upsert({
    where: { slug: 'agent-exchange-system' },
    update: {},
    create: {
      name: 'Agent Exchange System',
      slug: 'agent-exchange-system',
      tier: 'free',
      status: 'active',
      billingEmail: 'system@agentexchange.dev',
    },
  });

  // Upsert the echo service
  const service = await prisma.service.upsert({
    where: { slug: 'echo-test' },
    update: {
      serviceUrl: `${BASE_URL}/api/v1/echo`,
      status: 'active',
    },
    create: {
      organisationId: org.id,
      name: 'Local Echo (test)',
      slug: 'echo-test',
      description: 'A local echo service that reflects the request back as JSON. Use this to test the full MPP 402 gateway flow end-to-end without a real upstream.',
      tagline: 'Test the gateway payment flow locally',
      serviceUrl: `${BASE_URL}/api/v1/echo`,
      registrationType: 'self_serve',
      listingTier: 'free',
      status: 'active',
      dataClassification: 'public',
      healthScore: 100,
      verifiedAt: new Date(),
    },
  });

  console.log(`✓ Service: ${service.name} (${service.slug})`);
  console.log(`  serviceUrl: ${service.serviceUrl}`);

  // Endpoints
  const ep1 = await prisma.serviceEndpoint.upsert({
    where: { id: `echo-ep-get-${service.id}`.slice(0, 36).padEnd(36, '0') },
    update: {},
    create: {
      id: `echo-ep-get-${service.id}`.slice(0, 36).padEnd(36, '0'),
      serviceId: service.id,
      path: '/reflect',
      method: 'GET',
      name: 'Echo GET',
      description: 'Reflects headers, query params, and the injected wallet address back as JSON.',
      rateLimitRpm: 1000,
    },
  });

  const ep2 = await prisma.serviceEndpoint.upsert({
    where: { id: `echo-ep-pst-${service.id}`.slice(0, 36).padEnd(36, '0') },
    update: {},
    create: {
      id: `echo-ep-pst-${service.id}`.slice(0, 36).padEnd(36, '0'),
      serviceId: service.id,
      path: '/reflect',
      method: 'POST',
      name: 'Echo POST',
      description: 'Reflects body, headers, and the injected wallet address back as JSON.',
      rateLimitRpm: 1000,
    },
  });

  console.log(`✓ Endpoints: /reflect (GET), /reflect (POST)`);

  // Payment method — tempo
  const pm = await prisma.servicePaymentMethod.upsert({
    where: { id: `echo-pm-${service.id}`.slice(0, 36).padEnd(36, '0') },
    update: {},
    create: {
      id: `echo-pm-${service.id}`.slice(0, 36).padEnd(36, '0'),
      serviceId: service.id,
      method: 'tempo',
      intent: 'charge',
      isActive: true,
    },
  });

  console.log(`✓ Payment method: tempo`);

  // Pricing — flat 0.001 USDC per call
  await prisma.endpointPricing.upsert({
    where: { id: `echo-pr1-${service.id}`.slice(0, 36).padEnd(36, '0') },
    update: {},
    create: {
      id: `echo-pr1-${service.id}`.slice(0, 36).padEnd(36, '0'),
      endpointId: ep1.id,
      paymentMethodId: pm.id,
      pricingModel: 'flat',
      amount: 0.001,
      currency: 'USDC',
      unit: 'call',
    },
  });

  await prisma.endpointPricing.upsert({
    where: { id: `echo-pr2-${service.id}`.slice(0, 36).padEnd(36, '0') },
    update: {},
    create: {
      id: `echo-pr2-${service.id}`.slice(0, 36).padEnd(36, '0'),
      endpointId: ep2.id,
      paymentMethodId: pm.id,
      pricingModel: 'flat',
      amount: 0.001,
      currency: 'USDC',
      unit: 'call',
    },
  });

  console.log(`✓ Pricing: 0.001 USDC / call (flat)\n`);
  console.log(`✅ Echo service ready!`);
  console.log(`\n   Gateway tester → select "Local Echo (test)" → /reflect → GET`);
  console.log(`   Or run: pnpm test:payment`);
  console.log(`   (set SERVICE_SLUG=echo-test ENDPOINT=/reflect)\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
