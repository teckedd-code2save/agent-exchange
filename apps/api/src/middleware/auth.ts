import { createClient } from "@supabase/supabase-js";
import type { Context, Next } from "hono";

export async function authMiddleware(c: Context, next: Next) {
  if (process.env["AUTH_BYPASS"] === "true") {
    c.set("userId", "dev-bypass-user");
    c.set("email", "dev@localhost");
    c.set("isBypass", true);
    return next();
  }

  const authHeader = c.req.header("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.slice(7);
  const supabase = createClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return c.json({ error: "Unauthorized" }, 401);

  c.set("userId", user.id);
  c.set("email", user.email ?? "");
  c.set("isBypass", false);
  return next();
}
