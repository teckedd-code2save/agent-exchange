import "./config/load-env";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  // Strip pgbouncer hint (not a valid pg param), force sslmode=require so pg
  // sends SSLRequest immediately, disable cert verification for Supabase's
  // self-signed PgBouncer certificate.
  const base = (process.env.DATABASE_URL ?? "").replace(/[?&]pgbouncer=true/g, "");
  const connectionString = base + (base.includes("?") ? "&" : "?") + "sslmode=require";
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
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
