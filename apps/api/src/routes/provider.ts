import { Hono } from "hono";
import { prisma } from "@agent-exchange/db";
import { authMiddleware } from "../middleware/auth.js";

export const provider = new Hono();
provider.use("*", authMiddleware);

// GET /api/v1/provider/analytics
provider.get("/analytics", async (c) => {
  const userId = c.get("userId") as string;

  const dbProvider = await prisma.provider.findUnique({ where: { userId } });
  if (!dbProvider) return c.json({ totalRevenue: 0, totalCalls: 0, services: [] });

  const services = await prisma.service.findMany({
    where: { providerId: dbProvider.id },
    include: {
      calls: {
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        select: {
          status: true,
          amount: true,
          environment: true,
          latencyMs: true,
          challengeSolved: true,
        },
      },
    },
  });

  const summary = services.map((svc) => {
    const calls = svc.calls;
    const successCalls = calls.filter((c) => c.status >= 200 && c.status < 300);
    const paidCalls = calls.filter((c) => c.challengeSolved);
    const revenue = paidCalls.reduce((sum, c) => sum + Number(c.amount), 0);
    const avgLatency =
      calls.length > 0
        ? Math.round(calls.reduce((sum, c) => sum + c.latencyMs, 0) / calls.length)
        : 0;

    return {
      serviceId: svc.id,
      name: svc.name,
      studioSlug: svc.studioSlug,
      status: svc.status,
      stats: {
        totalCallsAllTime: svc.totalCalls,
        callsLast30d: calls.length,
        successRate:
          calls.length > 0 ? Math.round((successCalls.length / calls.length) * 100) : 0,
        paidCalls: paidCalls.length,
        revenueUsd: revenue.toFixed(4),
        avgLatencyMs: avgLatency,
        byEnvironment: {
          sandbox: calls.filter((c) => c.environment === "sandbox").length,
          testnet: calls.filter((c) => c.environment === "testnet").length,
          production: calls.filter((c) => c.environment === "production").length,
        },
      },
    };
  });

  const totalRevenue = summary.reduce((sum, s) => sum + parseFloat(s.stats.revenueUsd), 0);
  const totalCalls = summary.reduce((sum, s) => sum + s.stats.callsLast30d, 0);

  return c.json({
    provider: {
      id: dbProvider.id,
      testnetBalance: dbProvider.testnetBalance,
      liveBalance: dbProvider.liveBalance,
    },
    summary: {
      totalRevenue: totalRevenue.toFixed(4),
      totalCallsLast30d: totalCalls,
      serviceCount: services.length,
    },
    services: summary,
  });
});

// GET /api/v1/provider/services
provider.get("/services", async (c) => {
  const userId = c.get("userId") as string;

  const dbProvider = await prisma.provider.findUnique({ where: { userId } });
  if (!dbProvider) return c.json({ results: [], message: "No services yet" });

  const services = await prisma.service.findMany({
    where: { providerId: dbProvider.id },
    include: { _count: { select: { calls: true, reviews: true } } },
    orderBy: { createdAt: "desc" },
  });

  return c.json({ results: services });
});

// GET /api/v1/provider/calls
provider.get("/calls", async (c) => {
  const userId = c.get("userId") as string;

  const dbProvider = await prisma.provider.findUnique({ where: { userId } });
  if (!dbProvider) return c.json({ results: [] });

  const serviceIds = (
    await prisma.service.findMany({
      where: { providerId: dbProvider.id },
      select: { id: true },
    })
  ).map((s) => s.id);

  if (serviceIds.length === 0) return c.json({ results: [] });

  const calls = await prisma.call.findMany({
    where: { serviceId: { in: serviceIds } },
    include: { service: { select: { name: true, studioSlug: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return c.json({ results: calls });
});

// GET /api/v1/provider/balance
provider.get("/balance", async (c) => {
  const userId = c.get("userId") as string;

  const dbProvider = await prisma.provider.findUnique({
    where: { userId },
    select: {
      testnetBalance: true,
      liveBalance: true,
      services: { select: { id: true, name: true, status: true } },
    },
  });

  return c.json(
    dbProvider ?? { testnetBalance: 0, liveBalance: 0, services: [] }
  );
});

// POST /api/v1/provider/services
provider.post("/services", async (c) => {
  const userId = c.get("userId") as string;
  const email = c.get("email") as string;

  const body = await c.req.json<{
    name: string;
    description: string;
    endpoint: string;
    category: string;
    endpoints?: unknown[];
    pricingConfig?: { amount?: string; currency?: string };
    pricingType?: string;
    tags?: string[];
    supportedPayments?: string[];
    mppChallengeEndpoint?: string;
    email?: string;
  }>();

  const { name, description, endpoint, category, pricingConfig } = body;
  if (!name || !description || !endpoint || !category) {
    return c.json(
      { error: "Missing required fields: name, description, endpoint, category" },
      400
    );
  }

  const dbProvider = await prisma.provider.upsert({
    where: { userId },
    update: {},
    create: { userId, email: body.email ?? email ?? `${userId}@mpp.studio` },
  });

  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  let slug = baseSlug;
  let counter = 1;
  while (await prisma.service.findUnique({ where: { studioSlug: slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const service = await prisma.service.create({
    data: {
      name,
      description,
      endpoint,
      studioSlug: slug,
      category,
      tags: body.tags ?? [],
      status: "sandbox",
      pricingType: (body.pricingType as any) ?? "fixed",
      pricingConfig: pricingConfig ?? { amount: "0.01", currency: "USDC" },
      endpoints: body.endpoints ?? null,
      supportedPayments: (body.supportedPayments as any) ?? ["sandbox"],
      mppChallengeEndpoint: body.mppChallengeEndpoint ?? null,
      providerId: dbProvider.id,
    },
  });

  const origin = new URL(c.req.url).origin;
  return c.json(
    {
      service,
      sandboxEndpoint: `${origin}/api/v1/proxy/${slug}`,
      message: "Service registered! Test it in sandbox mode using the sandboxEndpoint.",
      nextSteps: [
        "1. POST to sandboxEndpoint — you'll get a 402 challenge",
        "2. Resend with Authorization: Payment sandbox-credential",
        "3. Your endpoint will be called and the response proxied back",
        "4. Once tested, promote to testnet",
      ],
    },
    201
  );
});
