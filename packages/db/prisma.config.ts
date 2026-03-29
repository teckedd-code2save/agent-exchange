import "./src/config/load-env.js";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prisma uses DIRECT_URL for migrations/introspection.
    //
    // Local Docker: a normal Postgres URL on 5432 is fine.
    // Supabase (IPv4-friendly pooling setup): use the session-mode pooler URL on 5432.
    // Example:
    //   DIRECT_URL=postgresql://postgres.<ref>:<password>@aws-<region>.pooler.supabase.com:5432/postgres
    //
    // Do not point DIRECT_URL at the runtime pooled PgBouncer URL on 6543.
    url: env("DIRECT_URL"),
  },
});
