import type { CacheAdapter } from './types';
import { MemoryAdapter } from './adapters/memory';
import { IoRedisAdapter } from './adapters/ioredis';

type CacheProvider = 'memory' | 'ioredis' | 'upstash';

let instance: CacheAdapter | undefined;

export function getCacheAdapter(): CacheAdapter {
  if (instance) return instance;

  const provider = (process.env['CACHE_PROVIDER'] ?? 'memory') as CacheProvider;

  switch (provider) {
    case 'memory':
      instance = new MemoryAdapter();
      break;

    case 'ioredis': {
      const redisUrl = process.env['REDIS_URL'];
      if (!redisUrl) {
        throw new Error(
          '[cache] REDIS_URL must be set when CACHE_PROVIDER=ioredis',
        );
      }
      instance = new IoRedisAdapter(redisUrl);
      break;
    }

    case 'upstash': {
      // TODO: Phase 2 — uncomment when UpstashAdapter is implemented
      // const url = process.env['UPSTASH_REDIS_REST_URL'];
      // const token = process.env['UPSTASH_REDIS_REST_TOKEN'];
      // if (!url || !token) {
      //   throw new Error('[cache] UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN required');
      // }
      // instance = new UpstashAdapter(url, token);
      throw new Error('[cache] Upstash adapter is deferred to Phase 2. Use memory or ioredis.');
    }

    default:
      throw new Error(
        `[cache] Unknown CACHE_PROVIDER: "${provider}". Valid options: memory | ioredis | upstash`,
      );
  }

  return instance;
}

export function resetCacheAdapter(): void {
  instance = undefined;
}
