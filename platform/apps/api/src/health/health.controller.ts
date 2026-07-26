import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { SystemHealth } from '@athena/shared';
import { SupabaseService } from '../supabase/supabase.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  async health(): Promise<SystemHealth> {
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

    if (process.env.REDIS_URL || process.env.WORKER_HEALTH_URL) {
      try {
        if (process.env.WORKER_HEALTH_URL) {
          const res = await fetch(process.env.WORKER_HEALTH_URL, {
            signal: AbortSignal.timeout(2000),
          });
          checks.worker = { status: res.ok ? 'ok' : 'down' };
        } else {
          checks.worker = { status: 'unknown', error: 'REDIS_URL set; no HTTP probe' };
        }
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
      checks.worker.status === 'down';

    return {
      status: criticalDown ? 'down' : anyDown ? 'degraded' : 'ok',
      service: 'athena-platform-api',
      version: '0.11.0',
      timestamp,
      checks,
    };
  }
}
