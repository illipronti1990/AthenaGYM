import { randomUUID } from 'crypto';
import {
  Injectable,
  LoggerService,
  NestMiddleware,
  Logger,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import pino, { type Logger as PinoLogger } from 'pino';

let root: PinoLogger | null = null;

export function getPino(): PinoLogger {
  if (!root) {
    root = pino({
      level: process.env.LOG_LEVEL || 'info',
      base: { service: 'movvo-api' },
      timestamp: pino.stdTimeFunctions.isoTime,
      redact: {
        paths: [
          'req.headers.authorization',
          'password',
          'token',
          'secret',
          'ciphertext',
        ],
        remove: true,
      },
    });
  }
  return root;
}

@Injectable()
export class PinoNestLogger implements LoggerService {
  private readonly logger = getPino();

  log(message: unknown, context?: string) {
    this.logger.info({ context }, String(message));
  }
  error(message: unknown, trace?: string, context?: string) {
    this.logger.error({ context, trace }, String(message));
  }
  warn(message: unknown, context?: string) {
    this.logger.warn({ context }, String(message));
  }
  debug?(message: unknown, context?: string) {
    this.logger.debug({ context }, String(message));
  }
  verbose?(message: unknown, context?: string) {
    this.logger.trace({ context }, String(message));
  }
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  private readonly nestLog = new Logger('HTTP');

  constructor(private readonly metrics: MetricsService) {}

  use(req: Request & { requestId?: string }, res: Response, next: NextFunction) {
    const requestId =
      String(req.headers['x-request-id'] || '') || randomUUID();
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);
    const started = Date.now();
    res.on('finish', () => {
      const durationMs = Date.now() - started;
      this.metrics.recordHttp(res.statusCode, durationMs);
      getPino().info({
        requestId,
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode: res.statusCode,
        durationMs,
        companyId: req.headers['x-company-id'] || null,
      }, 'http_request');
      this.nestLog.debug?.(
        `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`,
      );
    });
    next();
  }
}

/** Minimal in-process Prometheus text exposition */
@Injectable()
export class MetricsService {
  private httpRequests = 0;
  private httpErrors = 0;
  private latencies: number[] = [];

  recordHttp(status: number, durationMs: number) {
    this.httpRequests += 1;
    if (status >= 500) this.httpErrors += 1;
    this.latencies.push(durationMs);
    if (this.latencies.length > 2000) this.latencies.shift();
  }

  renderPrometheus(extra: Record<string, number> = {}): string {
    const avg =
      this.latencies.length === 0
        ? 0
        : this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length;
    const lines = [
      '# HELP movvo_http_requests_total Total HTTP requests',
      '# TYPE movvo_http_requests_total counter',
      `movvo_http_requests_total ${this.httpRequests}`,
      '# HELP movvo_http_errors_total Total HTTP 5xx',
      '# TYPE movvo_http_errors_total counter',
      `movvo_http_errors_total ${this.httpErrors}`,
      '# HELP movvo_http_latency_avg_ms Average latency ms',
      '# TYPE movvo_http_latency_avg_ms gauge',
      `movvo_http_latency_avg_ms ${avg.toFixed(2)}`,
    ];
    for (const [k, v] of Object.entries(extra)) {
      lines.push(`# TYPE ${k} gauge`, `${k} ${v}`);
    }
    return lines.join('\n') + '\n';
  }
}
