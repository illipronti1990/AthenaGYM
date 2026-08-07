import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export type CacheGetOptions = { ttlSeconds?: number };

/** `movvo:{env}:{companyId|global}:{domain}:{key}` */
export function buildCacheKey(
  env: string,
  companyId: string | null | undefined,
  domain: string,
  key: string,
): string {
  const c = companyId || 'global';
  return `movvo:${env}:${c}:${domain}:${key}`;
}

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private client: Redis | null = null;
  private readonly env: string;
  private hits = 0;
  private misses = 0;
  private disabled = false;

  constructor(private readonly config: ConfigService) {
    this.env = this.config.get<string>('NODE_ENV') || 'development';
    const url = this.config.get<string>('REDIS_URL');
    if (!url) {
      this.logger.warn('REDIS_URL not set — cache disabled (graceful degrade)');
      this.disabled = true;
      return;
    }
    try {
      this.client = new Redis(url, {
        maxRetriesPerRequest: 1,
        enableReadyCheck: true,
        lazyConnect: true,
        connectTimeout: 3000,
      });
      void this.client.connect().catch((e) => {
        this.logger.warn(`Redis connect failed: ${e instanceof Error ? e.message : e}`);
        this.disabled = true;
        this.client = null;
      });
    } catch (e) {
      this.logger.warn(`Redis init failed: ${e instanceof Error ? e.message : e}`);
      this.disabled = true;
      this.client = null;
    }
  }

  async onModuleDestroy() {
    if (this.client) await this.client.quit().catch(() => undefined);
  }

  key(companyId: string | null | undefined, domain: string, key: string): string {
    return buildCacheKey(this.env, companyId, domain, key);
  }

  async get<T>(fullKey: string): Promise<T | null> {
    if (this.disabled || !this.client) {
      this.misses += 1;
      return null;
    }
    try {
      const raw = await this.client.get(fullKey);
      if (raw == null) {
        this.misses += 1;
        return null;
      }
      this.hits += 1;
      return JSON.parse(raw) as T;
    } catch {
      this.misses += 1;
      return null;
    }
  }

  async set(fullKey: string, value: unknown, ttlSeconds = 60): Promise<void> {
    if (this.disabled || !this.client) return;
    try {
      await this.client.set(fullKey, JSON.stringify(value), 'EX', Math.max(1, ttlSeconds));
    } catch (e) {
      this.logger.debug(`cache set failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  async del(fullKey: string): Promise<void> {
    if (this.disabled || !this.client) return;
    try {
      await this.client.del(fullKey);
    } catch {
      /* ignore */
    }
  }

  async invalidatePrefix(prefix: string): Promise<void> {
    if (this.disabled || !this.client) return;
    try {
      let cursor = '0';
      do {
        const [next, keys] = await this.client.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
        cursor = next;
        if (keys.length) await this.client.del(...keys);
      } while (cursor !== '0');
    } catch {
      /* ignore */
    }
  }

  async wrap<T>(
    fullKey: string,
    ttlSeconds: number,
    loader: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.get<T>(fullKey);
    if (cached != null) return cached;
    const value = await loader();
    await this.set(fullKey, value, ttlSeconds);
    return value;
  }

  async ping(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
    if (this.disabled || !this.client) {
      return { ok: false, error: 'redis disabled or not configured' };
    }
    const t0 = Date.now();
    try {
      const pong = await this.client.ping();
      return { ok: pong === 'PONG', latencyMs: Date.now() - t0 };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'ping failed' };
    }
  }

  stats() {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total ? this.hits / total : 0,
      enabled: !this.disabled && !!this.client,
    };
  }

  /** TTL seconds aligned with web queryKeys */
  static readonly TTL = {
    kpis: 30,
    dashboard: 30,
    settings: 3600,
    plans: 1800,
    branding: 600,
    flags: 120,
    permissions: 60,
    default: 15,
  } as const;
}
