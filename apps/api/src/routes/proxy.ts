import { Hono } from "hono";
import { prisma } from "@agent-exchange/db";

type PricingConfig = { amount?: string; currency?: string };

export const proxy = new Hono();

async function handleProxy(c: any) {
  const slug = c.req.param("slug") as string;
  const wildcard = c.req.param("path") ?? "";
  const targetPath = "/" + (Array.isArray(wildcard) ? wildcard.join("/") : wildcard);
  const startTime = Date.now();

  try {
    const service = await prisma.service.findUnique({ where: { studioSlug: slug } });
    if (!service) return c.json({ error: "Service not found" }, 404);
    if (service.status === "draft" || service.status === "paused") {
      return c.json({ error: `Service is currently ${service.status}` }, 503);
    }

    const authHeader = (c.req.header("authorization") as string | undefined) ?? "";
    let isPaid = false;
    const isSandbox = service.status === "sandbox";

    let amount = "0.01";
    let currency = "USDC";
    if (service.pricingConfig && typeof service.pricingConfig === "object") {
      const conf = service.pricingConfig as PricingConfig;
      if (conf.amount) amount = conf.amount;
      if (conf.currency) currency = conf.currency;
    }

    if (isSandbox) {
      if (!authHeader.toLowerCase().startsWith("payment ")) {
        const challengeId = `sand_chal_${Math.random().toString(36).slice(2)}`;
        prisma.call
          .create({
            data: {
              serviceId: service.id,
              method: c.req.method,
              path: targetPath,
              status: 402,
              paymentType: "sandbox",
              amount: Number(amount),
              currency,
              challengeIssued: true,
              latencyMs: Date.now() - startTime,
              environment: "sandbox",
            },
          })
          .catch(console.error);

        return c.json(
          {
            type: "https://mpp.dev/problems/payment-required",
            title: "Payment Required",
            detail: `Sandbox payment required for ${service.name}`,
          },
          402,
          {
            "WWW-Authenticate": `Payment method="mpp", challenge="${challengeId}", amount="${amount}", currency="${currency}", methods="sandbox"`,
          }
        );
      }

      if (!authHeader.includes("sandbox-credential")) {
        return c.json({ error: "Invalid sandbox credential" }, 401);
      }
      isPaid = true;
    } else {
      isPaid = authHeader.toLowerCase().startsWith("payment ");
    }

    const url = new URL(c.req.url);
    const targetUrl = new URL(targetPath, service.endpoint);
    targetUrl.search = url.search;

    const forwardHeaders = new Headers();
    (c.req.raw.headers as Headers).forEach((value: string, key: string) => {
      if (key !== "host") forwardHeaders.set(key, value);
    });
    forwardHeaders.set("x-mpp-studio-env", service.status);
    forwardHeaders.set("x-mpp-paid", String(isPaid));

    const reqBody = ["POST", "PUT", "PATCH"].includes(c.req.method)
      ? await c.req.text()
      : null;

    const upstream = await fetch(targetUrl.toString(), {
      method: c.req.method,
      headers: forwardHeaders,
      body: reqBody,
    });

    const latencyMs = Date.now() - startTime;
    prisma.call
      .create({
        data: {
          serviceId: service.id,
          method: c.req.method,
          path: targetPath,
          status: upstream.status,
          paymentType: isSandbox ? "sandbox" : ((service.supportedPayments[0] as any) ?? "stripe"),
          amount: Number(amount),
          currency,
          challengeIssued: true,
          challengeSolved: isPaid,
          receiptVerified: isPaid,
          latencyMs,
          environment: isSandbox ? "sandbox" : "production",
        },
      })
      .catch(console.error);

    const resHeaders: Record<string, string> = {};
    upstream.headers.forEach((v, k) => { resHeaders[k] = v; });
    if (isPaid) resHeaders["Payment-Receipt"] = `receipt_${Math.random().toString(36).slice(2)}`;

    return new Response(await upstream.arrayBuffer(), {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: resHeaders,
    });
  } catch (err) {
    console.error("[Proxy Error]", err);
    return c.json({ error: "Internal proxy error" }, 500);
  }
}

proxy.all("/:slug/*", (c) => handleProxy(c));
proxy.all("/:slug", (c) => handleProxy(c));
