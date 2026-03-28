import { Hono } from "hono";
import { prisma } from "@agent-exchange/db";

export const services = new Hono();

services.get("/:slug", async (c) => {
  const slug = c.req.param("slug");

  const service = await prisma.service.findFirst({
    where: { OR: [{ id: slug }, { studioSlug: slug }] },
    include: {
      reviews: {
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { rating: true, comment: true, createdAt: true },
      },
      _count: { select: { calls: true, reviews: true } },
    },
  });

  if (!service) return c.json({ error: "Service not found" }, 404);

  const origin = new URL(c.req.url).origin;
  const avgRating = service.reviews.length
    ? service.reviews.reduce((s, r) => s + r.rating, 0) / service.reviews.length
    : null;

  return c.json({
    id: service.id,
    name: service.name,
    description: service.description,
    category: service.category,
    tags: service.tags,
    status: service.status,
    endpoints: service.endpoints,
    pricing: { type: service.pricingType, config: service.pricingConfig },
    payment: {
      methods: service.supportedPayments,
      challengeEndpoint:
        service.mppChallengeEndpoint ?? `${origin}/api/v1/proxy/${service.studioSlug}`,
    },
    proxy: { endpoint: `${origin}/api/v1/proxy/${service.studioSlug}`, environment: service.status },
    stats: {
      totalCalls: service.totalCalls,
      callsThisMonth: service._count.calls,
      avgRating,
      reviewCount: service._count.reviews,
    },
    recentReviews: service.reviews,
    usageHint: {
      step1: "Make a request to proxy.endpoint — you will receive a 402 with WWW-Authenticate header",
      step2: "Parse the challenge from the WWW-Authenticate header",
      step3: "For sandbox: send Authorization: Payment sandbox-credential",
      step4: "For testnet/live: use mppx SDK to sign a real payment credential",
    },
  });
});
