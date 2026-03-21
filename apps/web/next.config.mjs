// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@agent-exchange/db',
    '@agent-exchange/cache',
    '@agent-exchange/mpp',
    '@agent-exchange/payments',
  ],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
};

export default nextConfig;
