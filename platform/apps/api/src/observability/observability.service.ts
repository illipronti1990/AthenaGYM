import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisCacheService } from '../cache/redis-cache.service';
import { QueueService } from '../queue/queue.service';
import { SupabaseService } from '../supabase/supabase.service';
import { getPino } from './observability.core';

@Injectable()
export class ObservabilityService {
  private readonly logger = new Logger(ObservabilityService.name);
  private rumCount = 0;

  constructor(
    private readonly cache: RedisCacheService,
    private readonly queues: QueueService,
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
  ) {}

  ingestRum(
    body: { samples?: Array<Record<string, unknown>>; url?: string },
    requestId?: string,
  ) {
    // sample ~20%
    if (Math.random() > 0.2) return { ok: true, sampled: false };
    this.rumCount += 1;
    getPino().info(
      {
        type: 'rum',
        requestId: requestId || null,
        url: body.url || null,
        samples: (body.samples || []).slice(0, 20),
      },
      'rum_sample',
    );
    return { ok: true, sampled: true };
  }

  async platformStatus() {
    const redis = await this.cache.ping();
    const cacheStats = this.cache.stats();
    const queueCounts = await this.queues.counts();

    let dbOk = false;
    let dbMs: number | undefined;
    try {
      const t0 = Date.now();
      const { error } = await this.supabase.getAdmin().from('companies').select('id').limit(1);
      dbOk = !error;
      dbMs = Date.now() - t0;
    } catch {
      dbOk = false;
    }

    let worker: Record<string, unknown> = { status: 'unknown' };
    const workerUrl = this.config.get<string>('WORKER_HEALTH_URL');
    if (workerUrl) {
      try {
        const res = await fetch(workerUrl, { signal: AbortSignal.timeout(2000) });
        worker = { status: res.ok ? 'ok' : 'down', http: res.status };
        if (res.ok) {
          worker = { ...worker, ...(await res.json().catch(() => ({}))) };
        }
      } catch (e) {
        worker = {
          status: 'down',
          error: e instanceof Error ? e.message : 'unreachable',
        };
      }
    }

    return {
      generatedAt: new Date().toISOString(),
      api: { status: 'ok' },
      database: { status: dbOk ? 'ok' : 'down', latencyMs: dbMs },
      redis,
      cache: cacheStats,
      queues: queueCounts,
      worker,
      rumSamplesIngested: this.rumCount,
      sentryEnabled: !!this.config.get<string>('SENTRY_DSN'),
    };
  }
}
