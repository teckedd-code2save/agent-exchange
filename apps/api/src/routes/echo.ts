import { Hono } from "hono";

export const echo = new Hono();

async function handleEcho(c: any) {
  const url = new URL(c.req.url);
  const wildcard = c.req.param("*") ?? "";
  const targetPath = "/" + wildcard;

  let body: unknown = null;
  const contentType = (c.req.header("content-type") as string | undefined) ?? "";
  if (!["GET", "HEAD"].includes(c.req.method) && c.req.raw.body) {
    try {
      body = contentType.includes("application/json")
        ? await c.req.json()
        : await c.req.text();
    } catch {
      body = null;
    }
  }

  const headers: Record<string, string> = {};
  (c.req.raw.headers as Headers).forEach((value: string, key: string) => {
    if (key !== "host") headers[key] = value;
  });

  return c.json({
    echo: true,
    method: c.req.method,
    path: targetPath,
    query: Object.fromEntries(url.searchParams),
    headers,
    body,
    receivedAt: new Date().toISOString(),
    agentWallet: (c.req.header("x-agent-wallet") as string | undefined) ?? null,
    exchangeTxHint: (c.req.header("x-agent-exchange-id") as string | undefined) ?? null,
  });
}

echo.all("/*", handleEcho);
