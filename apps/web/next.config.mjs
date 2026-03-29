// @ts-check
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load root .env.local so NEXT_PUBLIC_* vars are available at build/dev time.
// apps/web has no .env.local — all config lives at the workspace root.
config({ path: path.resolve(__dirname, '../../.env.local') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Keep workspace packages and Prisma client external so Vercel/Next can resolve
    // the generated client and native query engine at runtime instead of bundling
    // a stale copy into the server output.
    serverComponentsExternalPackages: ['@agent-exchange/db', '@prisma/client', 'prisma', 'pg'],
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_AUTH_BYPASS: process.env.NEXT_PUBLIC_AUTH_BYPASS,
  },
};

export default nextConfig;
