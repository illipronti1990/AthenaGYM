import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { SystemHealth } from '@movvo/shared';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { RedisCacheService } from '../cache/redis-cache.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly cache: RedisCacheService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  async health(@Res({ passthrough: true }) res: Response): Promise<SystemHealth> {
    const body = await this.buildHealth();
    if (body.status === 'down') res.status(503);
    return body;
  }

  @Get('db')
  async healthDb(@Res({ passthrough: true }) res: Response) {
    const checks = await this.probeDb();
    if (checks.status !== 'ok') res.status(503);
    return { check: 'database', ...checks };
  }

  @Get('cache')
  async healthCache(@Res({ passthrough: true }) res: Response) {
    const redis = await this.cache.ping();
    if (!redis.ok) res.status(503);
    return {
      check: 'cache',
      status: redis.ok ? 'ok' : 'down',
      latencyMs: redis.latencyMs,
      error: redis.error,
      stats: this.cache.stats(),
    };
  }

  @Get('integrations')
  async healthIntegrations(@Res({ passthrough: true }) res: Response) {
    const admin = this.supabase.getAdmin();
    const t0 = Date.now();
    try {
      const { error } = await admin.from('companies').select('id').limit(1);
      if (error) {
        res.status(503);
        return { status: 'down', check: 'integrations', error: error.message };
      }
      return {
        status: 'ok',
        check: 'integrations',
        latencyMs: Date.now() - t0,
        providers: ['wellhub', 'totalpass', 'asaas', 'mercadopago'],
      };
    } catch (e) {
      res.status(503);
      return {
        status: 'down',
        check: 'integrations',
        error: e instanceof Error ? e.message : 'integrations check failed',
      };
    }
  }

  @Get('queues')
  async healthQueues() {
    const workerUrl = this.config.get<string>('WORKER_HEALTH_URL');
    if (!workerUrl) {
      return { status: 'unknown', check: 'queues', error: 'WORKER_HEALTH_URL not set' };
    }
    try {
      const r = await fetch(workerUrl, { signal: AbortSignal.timeout(2000) });
      const body = await r.json().catch(() => ({}));
      return { status: r.ok ? 'ok' : 'down', check: 'queues', ...body };
    } catch (e) {
      return {
        status: 'down',
        check: 'queues',
        error: e instanceof Error ? e.message : 'worker unreachable',
      };
    }
  }

  private async probeDb() {
    try {
      const admin = this.supabase.getAdmin();
      const t0 = Date.now();
      const { error } = await admin.from('companies').select('id').limit(1);
      if (error) return { status: 'down' as const, error: error.message };
      return { status: 'ok' as const, latencyMs: Date.now() - t0 };
    } catch (e) {
      return {
        status: 'down' as const,
        error: e instanceof Error ? e.message : 'db check failed',
      };
    }
  }

  private async buildHealth(): Promise<SystemHealth> {
    const timestamp = new Date().toISOString();
    const checks: SystemHealth['checks'] = {
      api: { status: 'ok' },
      database: { status: 'down' },
      supabase: { status: 'down' },
      storage: { status: 'down' },
      worker: { status: 'unknown' },
    };

    try {
      const admin = this.supabase.getAdmin();
      const t0 = Date.now();
      const { error } = await admin.from('companies').select('id').limit(1);
      if (error) {
        checks.database = { status: 'down', error: error.message };
        checks.supabase = { status: 'down', error: error.message };
      } else {
        checks.database = { status: 'ok', latencyMs: Date.now() - t0 };
        checks.supabase = { status: 'ok' };
      }

      const { data: buckets, error: bucketErr } = await admin.storage.listBuckets();
      if (bucketErr) {
        checks.storage = { status: 'down', error: bucketErr.message };
      } else {
        checks.storage = { status: 'ok', buckets: buckets?.length || 0 };
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'health check failed';
      checks.database = { status: 'down', error: msg };
      checks.supabase = { status: 'down', error: msg };
      checks.storage = { status: 'down', error: msg };
    }

    const redis = await this.cache.ping();
    checks.cache = {
      status: redis.ok ? 'ok' : 'down',
      latencyMs: redis.latencyMs,
      error: redis.error,
    };

    const workerUrl = this.config.get<string>('WORKER_HEALTH_URL');
    if (workerUrl) {
      try {
        const r = await fetch(workerUrl, { signal: AbortSignal.timeout(2000) });
        checks.worker = { status: r.ok ? 'ok' : 'down' };
      } catch (e) {
        checks.worker = {
          status: 'down',
          error: e instanceof Error ? e.message : 'worker unreachable',
        };
      }
    }

    const criticalDown =
      checks.database.status === 'down' || checks.supabase.status === 'down';
    const anyDown =
      criticalDown ||
      checks.storage.status === 'down' ||
      checks.worker.status === 'down' ||
      !redis.ok;

    return {
      status: criticalDown ? 'down' : anyDown ? 'degraded' : 'ok',
      service: 'movvo-platform-api',
      version: '0.14.0',
      timestamp,
      checks,
    };
  }
}
