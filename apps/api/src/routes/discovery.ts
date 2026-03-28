import { Hono } from "hono";
import { prisma } from "@agent-exchange/db";
import type { PaymentType } from "@agent-exchange/db";

const VALID_PAYMENT_TYPES: PaymentType[] = ["tempo", "stripe", "lightning", "sandbox"];

export const discovery = new Hono();

discovery.get("/", async (c) => {
  const params = new URL(c.req.url).searchParams;
  const category = params.get("category");
  const tags = params.get("tags")?.split(",").filter(Boolean) ?? [];
  const payment = params.get("payment");
  const env = params.get("env") ?? "live";
  const limit = Math.min(parseInt(params.get("limit") ?? "20"), 100);
  const cursor = params.get("cursor");

  const statusMap: Record<string, "sandbox" | "testnet" | "live"> = {
    sandbox: "sandbox",
    testnet: "testnet",
    live: "live",
  };
  const status = statusMap[env] ?? "live";
  const isValidPayment = payment ? VALID_PAYMENT_TYPES.includes(payment as PaymentType) : false;

  const rows = await prisma.service.findMany({
    where: {
      status,
      ...(category ? { category } : {}),
      ...(tags.length ? { tags: { hasEvery: tags } } : {}),
      ...(payment && isValidPayment ? { supportedPayments: { has: payment as PaymentType } } : {}),
    },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: [{ totalCalls: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      tags: true,
      status: true,
      pricingType: true,
      pricingConfig: true,
      supportedPayments: true,
      totalCalls: true,
      studioSlug: true,
    },
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;
  const origin = new URL(c.req.url).origin;

  return c.json({
    results: items.map((s) => ({
      ...s,
      proxyEndpoint: `${origin}/api/v1/proxy/${s.studioSlug}`,
    })),
    pagination: { limit, hasMore, nextCursor, total: items.length },
    _hint: "POST to proxyEndpoint with Authorization: Payment sandbox-credential to test in sandbox",
  });
});
