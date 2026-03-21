#!/usr/bin/env tsx
/**
 * Seed DB with MPP.dev services
 * Fetches all services from https://mpp.dev/api/services and inserts into the DB
 */

import { prisma } from '@agent-exchange/db';

interface MppService {
  id: string;
  name: string;
  url: string;
  description?: string;
  categories?: string[];
  slug?: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 63);
}

async function main() {
  console.info('→ Fetching services from mpp.dev...');

  let services: MppService[] = [];
  try {
    const resp = await fetch('https://mpp.dev/api/services', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) {
      console.warn(`mpp.dev returned ${resp.status} — seeding with fallback data`);
      services = getFallbackServices();
    } else {
      const data = (await resp.json()) as MppService[] | { services: MppService[] };
      services = Array.isArray(data) ? data : data.services ?? [];
    }
  } catch (err) {
    console.warn('Could not reach mpp.dev — seeding with fallback data:', (err as Error).message);
    services = getFallbackServices();
  }

  console.info(`→ Seeding ${services.length} services...`);

  for (const svc of services) {
    const slug = svc.slug ?? slugify(svc.name);

    // Check if already seeded
    const existing = await prisma.service.findUnique({ where: { slug } });
    if (existing) {
      console.info(`  skip: ${slug} (already exists)`);
      continue;
    }

    // Create organisation
    const org = await prisma.organisation.create({
      data: {
        name: svc.name,
        slug: `org-${slug}`,
        tier: 'free',
        status: 'active',
        billingEmail: `ops@${slug}.example`,
        metadata: { source: 'mpp.dev', mppId: svc.id },
      },
    });

    // Create service
    const service = await prisma.service.create({
      data: {
        organisationId: org.id,
        name: svc.name,
        slug,
        description: svc.description ?? `${svc.name} — discovered from MPP registry`,
        serviceUrl: svc.url,
        registrationType: 'curated',
        listingTier: 'free',
        status: 'active',
        dataClassification: 'public',
        healthScore: 100,
        verifiedAt: new Date(),
      },
    });

    // Create categories
    if (svc.categories && svc.categories.length > 0) {
      await prisma.serviceCategory.createMany({
        data: svc.categories.map((category) => ({
          serviceId: service.id,
          category,
        })),
        skipDuplicates: true,
      });
    }

    // Create MPP protocol
    await prisma.serviceProtocol.create({
      data: {
        serviceId: service.id,
        protocol: 'mpp',
        specUrl: `${svc.url}/.well-known/mpp`,
      },
    });

    // Create payment method (Tempo/USDC)
    await prisma.servicePaymentMethod.create({
      data: {
        serviceId: service.id,
        method: 'tempo',
        intent: 'charge',
        isActive: true,
        config: {},
      },
    });

    console.info(`  created: ${slug}`);
  }

  console.info('✓ Seeding complete');
  await prisma.$disconnect();
}

function getFallbackServices(): MppService[] {
  return [
    {
      id: 'fallback-1',
      name: 'Agent Exchange Demo',
      url: 'https://agentexchange.dev',
      description: 'Demo service for Agent Exchange',
      categories: ['demo', 'marketplace'],
      slug: 'agent-exchange-demo',
    },
  ];
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
