import 'dotenv/config';
import { createHmac } from 'crypto';
import { createServer as createHttpServer } from 'http';
import { createClient } from '@supabase/supabase-js';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

/** Retry delays in minutes: 1 → 5 → 15 → 60 → 1440 → DLQ */
const WEBHOOK_RETRY_MINUTES = [1, 5, 15, 60, 1440];

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const API_URL = process.env.API_URL || 'http://localhost:3001/api/v1';
const DRAIN_MS = Number(process.env.OUTBOX_DRAIN_MS || 5000);
const WORKER_PORT = Number(
  process.env.PORT || process.env.WORKER_PORT || 3011,
);
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const EMAIL_FROM = process.env.MARKETING_EMAIL_FROM || 'Movvo <noreply@movvoerp.com.br>';

const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

const queues = {
  outbox: new Queue('outbox-drain', { connection }),
  webhooks: new Queue('webhooks', { connection }),
  charges: new Queue('charges', { connection }),
  emails: new Queue('emails', { connection }),
  whatsapp: new Queue('whatsapp', { connection }),
  reports: new Queue('reports', { connection }),
  reminders: new Queue('reminders', { connection }),
  checkins: new Queue('checkins', { connection }),
  access: new Queue('access-sync', { connection }),
  progress: new Queue('progress', { connection }),
  ai: new Queue('ai', { connection }),
  push: new Queue('push', { connection }),
  campaigns: new Queue('campaigns', { connection }),
  analytics: new Queue('analytics', { connection }),
  predictions: new Queue('predictions', { connection }),
  warehouse: new Queue('warehouse', { connection }),
  exports: new Queue('exports', { connection }),
};

const admin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

const metrics = {
  jobsCompleted: 0,
  jobsFailed: 0,
  emailsSent: 0,
  webhooksDelivered: 0,
};

function log(msg: string, extra?: unknown) {
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      level: 'info',
      service: 'movvo-worker',
      msg,
      extra: extra ?? null,
      ts: new Date().toISOString(),
    }),
  );
}

async function drainOutbox() {
  if (!admin) {
    log('Supabase admin not configured — skip outbox drain');
    return;
  }

  let rows: Array<Record<string, unknown>> = [];
  const { data: claimed, error: claimErr } = await admin.rpc('claim_outbox_batch', {
    p_limit: 50,
  });
  if (!claimErr && Array.isArray(claimed)) {
    rows = claimed as Array<Record<string, unknown>>;
  } else {
    // fallback legacy select
    const { data, error } = await admin
      .from('outbox_events')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50);
    if (error) {
      log('outbox query failed', error.message);
      return;
    }
    rows = (data || []) as Array<Record<string, unknown>>;
    for (const row of rows) {
      await admin.from('outbox_events').update({ status: 'processing' }).eq('id', row.id);
    }
  }

  for (const row of rows) {
    const id = String(row.id);
    const eventType = String(row.event_type);
    const payload = (row.payload || {}) as Record<string, unknown>;
    try {
      if (eventType === 'platform.webhook.deliver' || eventType.startsWith('platform.webhook')) {
        await queues.webhooks.add('deliver', payload, {
          attempts: WEBHOOK_RETRY_MINUTES.length + 1,
        });
      } else if (eventType.startsWith('webhook.')) {
        await queues.webhooks.add('process', payload);
      } else if (eventType.includes('export') || eventType.startsWith('analytics.export')) {
        await queues.exports.add('export', payload);
        await queues.reports.add('export', payload);
      } else if (eventType.includes('report') || eventType.includes('dre')) {
        await queues.reports.add('report', payload);
      } else if (eventType.startsWith('workouts.workout_suggested') || eventType.includes('ai')) {
        await queues.ai.add('suggest', payload);
      } else if (eventType.includes('payment') || eventType.includes('Payment')) {
        await queues.charges.add('payment', payload);
        await queues.emails.add('receipt', payload);
      } else {
        await queues.emails.add('generic', payload);
      }
      await admin
        .from('outbox_events')
        .update({ status: 'done', processed_at: new Date().toISOString() })
        .eq('id', id);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await admin
        .from('outbox_events')
        .update({
          status: 'failed',
          last_error: message,
          attempts: Number(row.attempts || 0) + 1,
        })
        .eq('id', id);
      log(`outbox ${id} failed`, message);
      metrics.jobsFailed += 1;
    }
  }
}

async function sendEmail(jobData: Record<string, unknown>) {
  const to = String(jobData.to || jobData.email || '');
  const subject = String(jobData.subject || 'Movvo ERP');
  const html = String(jobData.html || `<p>${JSON.stringify(jobData).slice(0, 500)}</p>`);
  if (!to) {
    log('email skipped — no recipient', jobData);
    return;
  }
  if (!RESEND_API_KEY) {
    log('email stub (no RESEND_API_KEY)', { to, subject });
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, html }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend ${res.status}: ${text}`);
  }
  metrics.emailsSent += 1;
  log('email sent', { to, subject });
}

async function processExport(jobData: Record<string, unknown>) {
  if (!admin) {
    log('export stub — no supabase', jobData);
    return;
  }
  const companyId = String(jobData.companyId || '');
  const format = String(jobData.format || 'json');
  const tables = (jobData.tables as string[]) || ['students'];
  const payload: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    companyId,
    format,
    data: {},
  };
  for (const table of tables.slice(0, 5)) {
    const { data } = await admin
      .from(table)
      .select('*')
      .eq('company_id', companyId)
      .limit(1000);
    (payload.data as Record<string, unknown>)[table] = data || [];
  }
  if (companyId) {
    const path = `companies/${companyId}/backups/v${Date.now()}/export-${format}.json`;
    await admin.storage
      .from('documents')
      .upload(path, Buffer.from(JSON.stringify(payload), 'utf8'), {
        contentType: 'application/json',
        upsert: false,
      });
    log('export stored', path);
  } else {
    log('export completed in-memory', { rows: Object.keys(payload.data as object).length });
  }
}

async function processReport(jobData: Record<string, unknown>) {
  log('report generated', {
    type: jobData.type || 'generic',
    companyId: jobData.companyId || null,
  });
  if (jobData.email) {
    await sendEmail({
      to: jobData.email,
      subject: `Relatório Movvo — ${jobData.type || 'report'}`,
      html: `<p>Relatório ${String(jobData.type || 'report')} pronto.</p>`,
    });
  }
}

async function processAi(jobData: Record<string, unknown>) {
  log('ai job processed', { name: jobData.kind || 'suggest', companyId: jobData.companyId });
  // Contract: persist stub suggestion marker if studentId present
  if (admin && jobData.studentId) {
    const { error } = await admin.from('outbox_events').insert({
      event_type: 'ai.suggestion.ready',
      payload: { studentId: jobData.studentId, at: new Date().toISOString() },
      status: 'done',
      processed_at: new Date().toISOString(),
    });
    if (error) log('ai outbox marker failed', { error: error.message });
  }
}

function startWorkers() {
  const workers: Worker[] = [];

  workers.push(
    new Worker(
      'webhooks',
      async (job) => {
        if (job.name !== 'deliver') {
          log('webhook job', job.data);
          metrics.jobsCompleted += 1;
          return;
        }
        const data = job.data as {
          deliveryId?: string;
          url?: string;
          signingSecret?: string;
          eventType?: string;
          payload?: Record<string, unknown>;
          attempt?: number;
        };
        if (!data.url || !data.signingSecret) {
          log('webhook deliver missing url/secret', data.deliveryId);
          return;
        }
        const body = JSON.stringify({
          id: data.deliveryId,
          type: data.eventType,
          data: data.payload || {},
          createdAt: new Date().toISOString(),
        });
        const signature = createHmac('sha256', data.signingSecret).update(body).digest('hex');
        const started = Date.now();
        let statusCode = 0;
        let errorMsg: string | null = null;
        try {
          const res = await fetch(data.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Movvo-Signature': `sha256=${signature}`,
              'X-Movvo-Event': String(data.eventType || ''),
              'User-Agent': 'Movvo-Webhooks/0.13',
            },
            body,
          });
          statusCode = res.status;
          if (!res.ok) {
            errorMsg = await res.text();
            throw new Error(`HTTP ${res.status}`);
          }
          if (admin && data.deliveryId) {
            await admin
              .from('webhook_deliveries')
              .update({
                status: 'delivered',
                attempts: Number(data.attempt || 0) + 1,
                last_status_code: statusCode,
                response_ms: Date.now() - started,
                delivered_at: new Date().toISOString(),
                last_error: null,
              })
              .eq('id', data.deliveryId);
          }
          metrics.webhooksDelivered += 1;
          metrics.jobsCompleted += 1;
          log('webhook delivered', data.deliveryId);
        } catch (e) {
          const attempt = Number(data.attempt || 0);
          const delayMin = WEBHOOK_RETRY_MINUTES[attempt];
          const message = e instanceof Error ? e.message : String(e);
          metrics.jobsFailed += 1;
          if (admin && data.deliveryId) {
            if (delayMin == null) {
              await admin
                .from('webhook_deliveries')
                .update({
                  status: 'dead',
                  attempts: attempt + 1,
                  last_status_code: statusCode || null,
                  last_error: errorMsg || message,
                  response_ms: Date.now() - started,
                })
                .eq('id', data.deliveryId);
              log('webhook dead-letter', data.deliveryId);
              return;
            }
            const next = new Date(Date.now() + delayMin * 60_000).toISOString();
            await admin
              .from('webhook_deliveries')
              .update({
                status: 'failed',
                attempts: attempt + 1,
                next_attempt_at: next,
                last_status_code: statusCode || null,
                last_error: errorMsg || message,
                response_ms: Date.now() - started,
              })
              .eq('id', data.deliveryId);
            await queues.webhooks.add(
              'deliver',
              { ...data, attempt: attempt + 1 },
              { delay: delayMin * 60_000 },
            );
          }
          log(`webhook retry in ${delayMin}m`, data.deliveryId);
        }
      },
      { connection },
    ),
  );

  workers.push(
    new Worker(
      'charges',
      async (job) => {
        log('charges job', job.name);
        if (job.name === 'renew') {
          try {
            await fetch(`${API_URL}/finance/subscriptions/renew-due`, { method: 'POST' });
          } catch (e) {
            log('renew call failed', e);
          }
        }
        metrics.jobsCompleted += 1;
      },
      { connection },
    ),
  );

  workers.push(
    new Worker(
      'emails',
      async (job) => {
        await sendEmail(job.data as Record<string, unknown>);
        metrics.jobsCompleted += 1;
      },
      { connection },
    ),
  );

  workers.push(
    new Worker(
      'exports',
      async (job) => {
        await processExport(job.data as Record<string, unknown>);
        metrics.jobsCompleted += 1;
      },
      { connection },
    ),
  );

  workers.push(
    new Worker(
      'reports',
      async (job) => {
        await processReport(job.data as Record<string, unknown>);
        metrics.jobsCompleted += 1;
      },
      { connection },
    ),
  );

  workers.push(
    new Worker(
      'ai',
      async (job) => {
        await processAi(job.data as Record<string, unknown>);
        metrics.jobsCompleted += 1;
      },
      { connection },
    ),
  );

  const stubQueues = [
    'whatsapp',
    'reminders',
    'checkins',
    'access-sync',
    'progress',
    'push',
    'campaigns',
    'analytics',
    'predictions',
    'warehouse',
  ] as const;
  for (const name of stubQueues) {
    workers.push(
      new Worker(
        name,
        async (job) => {
          log(`[${name}] processed`, { job: job.name, id: job.id });
          metrics.jobsCompleted += 1;
        },
        { connection },
      ),
    );
  }

  workers.push(
    new Worker(
      'outbox-drain',
      async () => {
        await drainOutbox();
        metrics.jobsCompleted += 1;
      },
      { connection },
    ),
  );

  return workers;
}

function startHealthServer() {
  const server = createHttpServer(async (req, res) => {
    if (req.url === '/health' || req.url === '/health/') {
      const body = {
        status: 'ok',
        service: 'movvo-worker',
        redis: REDIS_URL ? 'configured' : 'missing',
        metrics,
        ts: new Date().toISOString(),
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
      return;
    }
    if (req.url === '/metrics') {
      const lines = [
        '# HELP worker_jobs_completed_total Jobs completed',
        '# TYPE worker_jobs_completed_total counter',
        `worker_jobs_completed_total ${metrics.jobsCompleted}`,
        '# HELP worker_jobs_failed_total Jobs failed',
        '# TYPE worker_jobs_failed_total counter',
        `worker_jobs_failed_total ${metrics.jobsFailed}`,
        '# HELP worker_emails_sent_total Emails sent',
        '# TYPE worker_emails_sent_total counter',
        `worker_emails_sent_total ${metrics.emailsSent}`,
        '# HELP worker_webhooks_delivered_total Webhooks delivered',
        '# TYPE worker_webhooks_delivered_total counter',
        `worker_webhooks_delivered_total ${metrics.webhooksDelivered}`,
        '# HELP movvo_queue_waiting Jobs waiting',
        '# TYPE movvo_queue_waiting gauge',
        '# HELP movvo_queue_active Jobs active',
        '# TYPE movvo_queue_active gauge',
        '# HELP movvo_queue_failed Jobs failed',
        '# TYPE movvo_queue_failed gauge',
        '# HELP movvo_queue_delayed Jobs delayed',
        '# TYPE movvo_queue_delayed gauge',
        '# HELP movvo_queue_completed Jobs completed (window)',
        '# TYPE movvo_queue_completed gauge',
      ];
      for (const [name, q] of Object.entries(queues)) {
        try {
          const c = await q.getJobCounts(
            'waiting',
            'active',
            'completed',
            'failed',
            'delayed',
          );
          const label = `{queue="${name}"}`;
          lines.push(`movvo_queue_waiting${label} ${c.waiting || 0}`);
          lines.push(`movvo_queue_active${label} ${c.active || 0}`);
          lines.push(`movvo_queue_failed${label} ${c.failed || 0}`);
          lines.push(`movvo_queue_delayed${label} ${c.delayed || 0}`);
          lines.push(`movvo_queue_completed${label} ${c.completed || 0}`);
        } catch {
          /* skip queue */
        }
      }
      res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' });
      res.end(lines.join('\n') + '\n');
      return;
    }
    res.writeHead(404);
    res.end('not found');
  });
  server.listen(WORKER_PORT, '0.0.0.0', () => {
    log(`worker health on :${WORKER_PORT}/health`);
  });
  return server;
}

async function main() {
  if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    log(`otel endpoint ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}`);
  }
  log(`connecting redis ${REDIS_URL}`);
  const workers = startWorkers();
  const health = startHealthServer();

  await queues.outbox.add(
    'tick',
    {},
    { repeat: { every: DRAIN_MS }, removeOnComplete: true, removeOnFail: 50 },
  );
  await queues.charges.add(
    'renew',
    {},
    {
      repeat: { pattern: '0 6 * * *' },
      removeOnComplete: true,
    },
  );

  const shutdown = async () => {
    log('shutting down');
    await Promise.all(workers.map((w) => w.close()));
    health.close();
    await connection.quit();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());

  log(
    'Movvo worker online — queues ready (emails/exports/reports/webhooks/ai + stubs)',
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
