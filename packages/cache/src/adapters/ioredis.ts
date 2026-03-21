import Redis from 'ioredis';
import type { CacheAdapter } from '../types';

export class IoRedisAdapter implements CacheAdapter {
  private client: Redis;

  constructor(url: string) {
    this.client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
    });

    this.client.on('error', (err: Error) => {
      console.error('[cache:ioredis] connection error:', err.message);
    });
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds !== undefined) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.client.expire(key, ttlSeconds);
  }

  async exists(key: string): Promise<boolean> {
    const count = await this.client.exists(key);
    return count > 0;
  }

  async setnx(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    // Use SET ... NX EX via raw command array to satisfy ioredis v5 overloads
    let result: string | null;
    if (ttlSeconds !== undefined) {
      result = await this.client.set(key, value, 'EX', ttlSeconds, 'NX');
    } else {
      // SET key value NX
      const set = await this.client.setnx(key, value);
      return set === 1;
    }
    return result === 'OK';
  }

  async ping(): Promise<void> {
    await this.client.ping();
  }
}
