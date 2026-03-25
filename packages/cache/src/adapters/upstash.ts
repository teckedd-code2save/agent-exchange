import type { CacheAdapter } from '../types';

type UpstashResponse<T> = {
  result: T;
  error?: string;
};

export class UpstashAdapter implements CacheAdapter {
  constructor(
    private readonly url: string,
    private readonly token: string,
  ) {}

  private async command<T>(args: Array<string | number>): Promise<T> {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
    });

    if (!response.ok) {
      throw new Error(`[cache:upstash] HTTP ${response.status}`);
    }

    const payload = (await response.json()) as UpstashResponse<T>;
    if (payload.error) {
      throw new Error(`[cache:upstash] ${payload.error}`);
    }

    return payload.result;
  }

  async get(key: string): Promise<string | null> {
    return this.command<string | null>(['GET', key]);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const args: Array<string | number> =
      ttlSeconds !== undefined ? ['SETEX', key, ttlSeconds, value] : ['SET', key, value];
    await this.command<string>(args);
  }

  async del(key: string): Promise<void> {
    await this.command<number>(['DEL', key]);
  }

  async incr(key: string): Promise<number> {
    return this.command<number>(['INCR', key]);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.command<number>(['EXPIRE', key, ttlSeconds]);
  }

  async exists(key: string): Promise<boolean> {
    const count = await this.command<number>(['EXISTS', key]);
    return count > 0;
  }

  async setnx(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    const result = await this.command<string | null>(
      ttlSeconds !== undefined
        ? ['SET', key, value, 'EX', ttlSeconds, 'NX']
        : ['SET', key, value, 'NX'],
    );
    return result === 'OK';
  }

  async ping(): Promise<void> {
    await this.command<string>(['PING']);
  }
}
