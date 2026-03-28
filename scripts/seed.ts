#!/usr/bin/env tsx
/**
 * Seed DB with MPP.dev services
 * Fetches all services from https://mpp.dev/api/services and inserts into the DB.
 *
 * Usage (from repo root):
 *   pnpm tsx scripts/seed.ts
 */
import path from "path";
import { config } from "dotenv";
// Load root .env.local before anything else so DATABASE_URL is set
config({ path: path.resolve(process.cwd(), ".env.local") });

import { prisma } from "@agent-exchange/db";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MppEndpoint {
  method: string;
  path: string;
  description?: string;
  payment?: {
    amount?: string;
    currency?: string;
    asset?: string;
  };
}

interface MppService {
  id: string;
  name: string;
  url: string;
  serviceUrl?: string;
  description?: string;
  categories?: string[];
  tags?: string[];
  status?: string;
  endpoints?: MppEndpoint[];
  methods?: {
    tempo?: { intents?: string[]; assets?: string[] };
  };
}

interface MppApiResponse {
  version?: number;
  services: MppService[];
}

// ── Category mapping ──────────────────────────────────────────────────────────

function mapCategory(categories: string[] = []): string {
  const cat = categories[0] ?? "other";
  const map: Record<string, string> = {
    ai: "text-generation",
    llm: "text-generation",
    blockchain: "data",
    data: "data",
    search: "search",
    web: "search",
    compute: "other",
    media: "image-generation",
    storage: "other",
    social: "other",
    audio: "audio",
    video: "video",
    embeddings: "embeddings",
    moderation: "moderation",
    code: "code",
  };
  return map[cat] ?? cat;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function ensureSystemProvider() {
  return prisma.provider.upsert({
    where: { userId: "system-mpp-seed" },
    update: {},
    create: {
      userId: "system-mpp-seed",
      email: "seed@mpp.studio",
      name: "MPP Registry",
    },
  });
}

async function fetchMppServices(): Promise<MppService[]> {
  console.info("→ Fetching services from mpp.dev...");
  try {
    const resp = await fetch("https://mpp.dev/api/services", {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    const data = (await resp.json()) as MppService[] | MppApiResponse;
    return Array.isArray(data) ? data : (data.services ?? []);
  } catch (err) {
    console.error("Could not reach mpp.dev:", (err as Error).message);
    process.exit(1);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.info("→ Seeding Agent Exchange with MPP.dev services...\n");

  const [provider, services] = await Promise.all([
    ensureSystemProvider(),
    fetchMppServices(),
  ]);

  console.info(`→ Upserting ${services.length} services...\n`);

  let created = 0;
  let skipped = 0;

  for (const svc of services) {
    const slug = svc.id; // mpp.dev IDs are already URL-safe slugs
    const endpoint = svc.serviceUrl ?? svc.url;
    const category = mapCategory(svc.categories);
    const tags = svc.tags ?? [];
    const supportedPayments = svc.methods?.tempo ? ["tempo"] : ["sandbox"];

    // Endpoints: map from mpp.dev shape, include only method/path/description/payment
    const endpoints: MppEndpoint[] = (svc.endpoints ?? []).map((ep) => ({
      method: ep.method,
      path: ep.path,
      description: ep.description,
      payment: ep.payment,
    }));

    // Derive default pricing from first endpoint with payment info
    const firstPriced = svc.endpoints?.find((ep) => ep.payment?.amount);
    const pricingConfig = firstPriced?.payment
      ? {
          amount: firstPriced.payment.amount ?? "0.001",
          currency: firstPriced.payment.currency ?? "USDC",
        }
      : { amount: "0.001", currency: "USDC" };

    const existing = await prisma.service.findUnique({
      where: { studioSlug: slug },
      select: { id: true },
    });

    if (existing) {
      skipped++;
      console.info(`  skip   ${slug}`);
      continue;
    }

    await prisma.service.create({
      data: {
        name: svc.name,
        description:
          svc.description ?? `${svc.name} via MPP Registry`,
        providerId: provider.id,
        endpoint,
        studioSlug: slug,
        status: "live",
        category,
        tags,
        pricingType: "fixed",
        pricingConfig,
        endpoints: endpoints.length > 0 ? endpoints : undefined,
        supportedPayments: supportedPayments as any,
      },
    });

    created++;
    console.info(`  created ${slug}`);
  }

  console.info(`\n✓ Done — ${created} created, ${skipped} skipped`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
