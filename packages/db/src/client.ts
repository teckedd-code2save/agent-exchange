import "./config/load-env";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  // Strip the Prisma-specific pgbouncer hint (pg doesn't understand it), then
  // use libpq-compat TLS semantics explicitly. This avoids the self-signed
  // certificate chain failure we were seeing against Supabase's pooler on Vercel.
  const raw = process.env.DATABASE_URL ?? "";
  const withoutPgbouncerHint = raw.replace(/[?&]pgbouncer=true/g, "");
  const separator = withoutPgbouncerHint.includes("?") ? "&" : "?";
  const connectionString =
    withoutPgbouncerHint + `${separator}uselibpqcompat=true&sslmode=require`;

  const pool = new Pool({
    connectionString,
    // Do not pass a parallel ssl object here; let the connection string drive
    // TLS behavior consistently for pg + Supabase pooler.
    // Serverless-safe defaults: keep the local pool tiny because Supabase already
    // sits behind its own pooler. Large per-instance pools on Vercel can cause
    // checkout timeouts under light burst traffic.
    max: 1,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 10_000,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export type { PrismaClient } from "@prisma/client";
export * from "@prisma/client";
