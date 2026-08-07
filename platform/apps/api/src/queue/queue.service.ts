import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

export const QUEUE_NAMES = [
  'emails',
  'exports',
  'reports',
  'webhooks',
  'ai',
  'whatsapp',
  'reminders',
] as const;

export type QueueName = (typeof QUEUE_NAMES)[number];

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private connection: Redis | null = null;
  private queues = new Map<string, Queue>();
  private disabled = false;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('REDIS_URL');
    if (!url) {
      this.logger.warn('REDIS_URL not set — queue producers disabled');
      this.disabled = true;
      return;
    }
    this.connection = new Redis(url, { maxRetriesPerRequest: null, lazyConnect: true });
    void this.connection.connect().catch((e) => {
      this.logger.warn(`Queue redis connect failed: ${e instanceof Error ? e.message : e}`);
      this.disabled = true;
    });
    for (const name of QUEUE_NAMES) {
      this.queues.set(name, new Queue(name, { connection: this.connection }));
    }
  }

  async onModuleDestroy() {
    for (const q of this.queues.values()) await q.close().catch(() => undefined);
    if (this.connection) await this.connection.quit().catch(() => undefined);
  }

  async enqueue(
    name: QueueName,
    jobName: string,
    data: Record<string, unknown>,
    opts?: { delayMs?: number; jobId?: string },
  ) {
    if (this.disabled) {
      this.logger.debug(`skip enqueue ${name}/${jobName} (redis disabled)`);
      return { ok: false, reason: 'redis_disabled' as const };
    }
    const q = this.queues.get(name);
    if (!q) return { ok: false, reason: 'unknown_queue' as const };
    const job = await q.add(jobName, data, {
      delay: opts?.delayMs,
      jobId: opts?.jobId,
      removeOnComplete: 100,
      removeOnFail: 200,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
    return { ok: true as const, jobId: job.id };
  }

  async counts() {
    const out: Record<string, Record<string, number>> = {};
    if (this.disabled) return out;
    for (const [name, q] of this.queues) {
      try {
        out[name] = await q.getJobCounts(
          'waiting',
          'active',
          'completed',
          'failed',
          'delayed',
        );
      } catch {
        out[name] = {};
      }
    }
    return out;
  }
}
