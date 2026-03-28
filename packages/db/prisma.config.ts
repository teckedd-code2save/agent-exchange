import "./src/config/load-env.js";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use direct connection for migrations (bypasses PgBouncer prepared-statement issues)
    url: env("DIRECT_URL"),
  },
});
