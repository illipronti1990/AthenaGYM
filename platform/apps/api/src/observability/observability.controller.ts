import { Body, Controller, Get, Headers, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../common/decorators/rbac.decorators';
import { PermissionsGuard, CompanyGuard } from '../common/guards/rbac.guards';
import { RedisCacheService } from '../cache/redis-cache.service';
import { QueueService } from '../queue/queue.service';
import { MetricsService } from './observability.core';
import { ObservabilityService } from './observability.service';

@ApiTags('observability')
@Controller()
export class ObservabilityController {
  constructor(
    private readonly metrics: MetricsService,
    private readonly cache: RedisCacheService,
    private readonly queues: QueueService,
    private readonly obs: ObservabilityService,
  ) {}

  @Get('metrics')
  async prometheus(@Res() res: Response) {
    const stats = this.cache.stats();
    const extra: Record<string, number> = {
      movvo_cache_hits: stats.hits,
      movvo_cache_misses: stats.misses,
      movvo_cache_hit_rate: Number(stats.hitRate.toFixed(4)),
    };
    const queueCounts = await this.queues.counts();
    const labeled: string[] = [
      '# HELP movvo_queue_waiting Jobs waiting',
      '# TYPE movvo_queue_waiting gauge',
      '# HELP movvo_queue_active Jobs active',
      '# TYPE movvo_queue_active gauge',
      '# HELP movvo_queue_failed Jobs failed',
      '# TYPE movvo_queue_failed gauge',
      '# HELP movvo_queue_delayed Jobs delayed',
      '# TYPE movvo_queue_delayed gauge',
    ];
    for (const [name, c] of Object.entries(queueCounts)) {
      const label = `{queue="${name}"}`;
      labeled.push(`movvo_queue_waiting${label} ${Number(c.waiting || 0)}`);
      labeled.push(`movvo_queue_active${label} ${Number(c.active || 0)}`);
      labeled.push(`movvo_queue_failed${label} ${Number(c.failed || 0)}`);
      labeled.push(`movvo_queue_delayed${label} ${Number(c.delayed || 0)}`);
    }

    const body =
      this.metrics.renderPrometheus(extra) +
      (Object.keys(queueCounts).length ? `${labeled.join('\n')}\n` : '');
    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    res.send(body);
  }

  @Post('observability/rum')
  rum(
    @Body()
    body: {
      samples?: Array<Record<string, unknown>>;
      url?: string;
    },
    @Headers('x-request-id') requestId?: string,
  ) {
    return this.obs.ingestRum(body, requestId);
  }

  @Get('observability/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard)
  @Permissions('observability.read', 'platform.manage', 'saas.read')
  status() {
    return this.obs.platformStatus();
  }
}
