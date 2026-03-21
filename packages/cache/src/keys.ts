export const CacheKeys = {
  mppChallenge: (id: string) => `challenge:${id}`,
  rateLimit: (wallet: string, path: string) => `rl:agent:${wallet}:${path}`,
  rateLimitIp: (ip: string, path: string) => `rl:ip:${ip}:${path}`,
  servicesCatalogue: () => `cache:services:v1`,
  serviceHealth: (id: string) => `health:${id}`,
  discoveryDedup: (hash: string) => `dedup:discovery:${hash}`,
  sessionHeartbeat: (id: string) => `session:${id}:heartbeat`,
};
