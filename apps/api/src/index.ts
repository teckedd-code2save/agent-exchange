import "./config/load-env.js";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { admin } from "./routes/admin.js";
import { discovery } from "./routes/discovery.js";
import { faucet } from "./routes/faucet.js";
import { provider } from "./routes/provider.js";
import { proxy } from "./routes/proxy.js";
import { services } from "./routes/services.js";
import { echo } from "./routes/echo.js";

const app = new Hono().basePath("/api/v1");

app.use(
  "*",
  cors({
    origin: process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000",
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.route("/admin", admin);
app.route("/discovery", discovery);
app.route("/faucet", faucet);
app.route("/provider", provider);
app.route("/proxy", proxy);
app.route("/services", services);
app.route("/echo", echo);

const port = parseInt(process.env["PORT"] ?? "3001");
serve({ fetch: app.fetch, port }, () => {
  console.log(`API running on http://localhost:${port}`);
});
