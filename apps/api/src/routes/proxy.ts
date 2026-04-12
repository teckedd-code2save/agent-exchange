import { Hono } from "hono";
import { prisma } from "@agent-exchange/db";
import { buildX402Details, verifyX402Payment } from "@agent-exchange/mpp";

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
    // x402 clients send their signed EIP-712 payload in X-PAYMENT instead of Authorization
    const xPaymentHeader = (c.req.header("x-payment") as string | undefined) ?? "";

    let isPaid = false;
    const isSandbox = service.status === "sandbox";
    const supportsX402 = service.supportedPayments.includes("x402" as any);

    let amount = "0.01";
    let currency = "USDC";
    if (service.pricingConfig && typeof service.pricingConfig === "object") {
      const conf = service.pricingConfig as PricingConfig;
      if (conf.amount) amount = conf.amount;
      if (conf.currency) currency = conf.currency;
    }

    // ── x402 native path: X-PAYMENT header ──────────────────────────────────
    // Accept this before the sandbox check so x402 works at every service status.
    if (xPaymentHeader && supportsX402) {
      const payTo = process.env["X402_PAY_TO_ADDRESS"];
      if (payTo) {
        const requirements = buildX402Details(
          amount,
          payTo,
          targetPath,
          process.env["X402_NETWORK"] ?? "base-sepolia",
        );
        isPaid = await verifyX402Payment(xPaymentHeader, requirements);
      }
    }

    // ── Sandbox path: Authorization: Payment sandbox-credential ─────────────
    if (!isPaid && isSandbox) {
      if (!authHeader.toLowerCase().startsWith("payment ")) {
        const challengeId = `sand_chal_${Math.random().toString(36).slice(2)}`;

        const wwwAuthParts = [
          `Payment method="mpp", challenge="${challengeId}", amount="${amount}", currency="${currency}", methods="sandbox"`,
        ];
        if (supportsX402 && process.env["X402_PAY_TO_ADDRESS"]) {
          // Advertise x402 as an additional method so sandbox services can also be tested with real USDC
          const x402Details = buildX402Details(
            amount,
            process.env["X402_PAY_TO_ADDRESS"],
            targetPath,
            process.env["X402_NETWORK"] ?? "base-sepolia",
          );
          wwwAuthParts.push(
            `Payment method="x402", challenge="${challengeId}", amount="${amount}", currency="${currency}", network="${x402Details.network}"`,
          );
        }

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
            methods: supportsX402 ? ["sandbox", "x402"] : ["sandbox"],
            ...(supportsX402 && process.env["X402_PAY_TO_ADDRESS"]
              ? {
                  x402: buildX402Details(
                    amount,
                    process.env["X402_PAY_TO_ADDRESS"],
                    targetPath,
                    process.env["X402_NETWORK"] ?? "base-sepolia",
                  ),
                }
              : {}),
          },
          402,
          { "WWW-Authenticate": wwwAuthParts.join(", ") },
        );
      }

      if (!authHeader.includes("sandbox-credential")) {
        return c.json({ error: "Invalid sandbox credential" }, 401);
      }
      isPaid = true;
    }

    // ── Non-sandbox: treat any valid Authorization: Payment header as paid ──
    // (Full MPP challenge/verify is handled by packages/mpp for consumers that
    //  use the issueChallenge/verifyCredential pipeline directly.)
    if (!isPaid) {
      isPaid = authHeader.toLowerCase().startsWith("payment ");
    }

    // ── Forward to upstream ──────────────────────────────────────────────────
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
    const paymentType = xPaymentHeader && isPaid
      ? "x402"
      : isSandbox
        ? "sandbox"
        : ((service.supportedPayments[0] as string) ?? "sandbox");

    prisma.call
      .create({
        data: {
          serviceId: service.id,
          method: c.req.method,
          path: targetPath,
          status: upstream.status,
          paymentType: paymentType as any,
          amount: Number(amount),
          currency,
          challengeIssued: true,
          challengeSolved: isPaid,
          receiptVerified: isPaid,
          latencyMs,
          environment: isSandbox ? "sandbox" : "testnet",
        },
      })
      .catch(console.error);

    const resHeaders: Record<string, string> = {};
    upstream.headers.forEach((v, k) => {
      resHeaders[k] = v;
    });
    if (isPaid) {
      resHeaders["Payment-Receipt"] = `receipt_${Math.random().toString(36).slice(2)}`;
      // Mirror x402 receipt header for native x402 clients
      if (paymentType === "x402") {
        resHeaders["X-Payment-Response"] = resHeaders["Payment-Receipt"];
      }
    }

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
