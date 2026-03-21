export interface CacheAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  incr(key: string): Promise<number>;
  expire(key: string, ttlSeconds: number): Promise<void>;
  exists(key: string): Promise<boolean>;
  setnx(key: string, value: string, ttlSeconds?: number): Promise<boolean>;
  ping(): Promise<void>;
}
