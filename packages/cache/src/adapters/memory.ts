import type { CacheAdapter } from '../types';

interface Entry {
  value: string;
  expiresAt?: number;
}

export class MemoryAdapter implements CacheAdapter {
  private store = new Map<string, Entry>();

  private isExpired(entry: Entry): boolean {
    return entry.expiresAt !== undefined && Date.now() > entry.expiresAt;
  }

  private getEntry(key: string): Entry | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (this.isExpired(entry)) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }

  async get(key: string): Promise<string | null> {
    return this.getEntry(key)?.value ?? null;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds !== undefined ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async incr(key: string): Promise<number> {
    const entry = this.getEntry(key);
    const current = entry ? parseInt(entry.value, 10) : 0;
    const next = (isNaN(current) ? 0 : current) + 1;
    this.store.set(key, {
      value: String(next),
      expiresAt: entry?.expiresAt,
    });
    return next;
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    const entry = this.getEntry(key);
    if (entry) {
      this.store.set(key, { ...entry, expiresAt: Date.now() + ttlSeconds * 1000 });
    }
  }

  async exists(key: string): Promise<boolean> {
    return this.getEntry(key) !== undefined;
  }

  async setnx(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (this.getEntry(key) !== undefined) return false;
    await this.set(key, value, ttlSeconds);
    return true;
  }

  async ping(): Promise<void> {
    // In-memory always available — no-op
  }
}
