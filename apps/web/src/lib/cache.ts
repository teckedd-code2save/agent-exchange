import { getCacheAdapter } from '@agent-exchange/cache';
import type { CacheAdapter } from '@agent-exchange/cache';

let _cache: CacheAdapter | undefined;

export function getCache(): CacheAdapter {
  if (!_cache) {
    _cache = getCacheAdapter();
  }
  return _cache;
}
