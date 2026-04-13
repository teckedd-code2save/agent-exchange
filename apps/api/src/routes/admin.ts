import { Hono } from "hono";
import { prisma } from "@agent-exchange/db";
import type { HonoVariables } from "../types.js";

export const admin = new Hono<{ Variables: HonoVariables }>();

// Simple admin key guard — replace with proper RBAC when ready
admin.use("*", async (c, next) => {
  const adminEmails = (process.env["ADMIN_EMAILS"] ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const isOpenAdminMode = adminEmails.length === 0;
  const isBypass = process.env["AUTH_BYPASS"] === "true";

  if (!isBypass && !isOpenAdminMode) {
    const userEmail = (c.get("email") as string | undefined)?.toLowerCase() ?? "";
    if (!adminEmails.includes(userEmail)) {
      return c.json({ error: "Forbidden" }, 403);
    }
  }

  return next();
});

// GET /api/v1/admin/overview
admin.get("/overview", async (c) => {
  const [providerCount, serviceCount, callCount] = await Promise.all([
    prisma.provider.count(),
    prisma.service.count(),
    prisma.call.count(),
  ]);

  const recentServices = await prisma.service.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { calls: true, reviews: true } } },
    take: 8,
  });

  return c.json({ providerCount, serviceCount, callCount, recentServices });
});

// GET /api/v1/admin/services
admin.get("/services", async (c) => {
  const services = await prisma.service.findMany({
    include: {
      provider: { select: { email: true, userId: true } },
      _count: { select: { calls: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return c.json({ results: services });
});

// PATCH /api/v1/admin/services/:id
admin.patch("/services/:id", async (c) => {
  const id = c.req.param("id");
  const { status } = await c.req.json<{ status: string }>();

  const service = await prisma.service.update({
    where: { id },
    data: { status: status as any },
  });

  return c.json({ service });
});

// GET /api/v1/admin/calls
admin.get("/calls", async (c) => {
  const calls = await prisma.call.findMany({
    include: { service: { select: { name: true, studioSlug: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return c.json({ results: calls });
});
