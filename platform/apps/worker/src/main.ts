import 'dotenv/config';
import { createHmac } from 'crypto';
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

function log(msg: string, extra?: unknown) {
  // eslint-disable-next-line no-console
  console.log(`[worker] ${msg}`, extra ?? '');
}

async function drainOutbox() {
  if (!admin) {
    log('Supabase admin not configured — skip outbox drain');
    return;
  }
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
  for (const row of data || []) {
    const id = String(row.id);
    await admin.from('outbox_events').update({ status: 'processing' }).eq('id', id);
    const eventType = String(row.event_type);
    try {
      if (eventType === 'platform.webhook.deliver' || eventType.startsWith('platform.webhook')) {
        await queues.webhooks.add('deliver', row.payload, {
          attempts: WEBHOOK_RETRY_MINUTES.length + 1,
          backoff: { type: 'custom' },
        });
      } else if (eventType.startsWith('webhook.')) {
        await queues.webhooks.add('process', row.payload);
      } else if (eventType.startsWith('operations.checkin')) {
        await queues.checkins.add('checkin', row.payload);
        await queues.reminders.add('checkin-stats', row.payload);
      } else if (
        eventType.startsWith('operations.class') ||
        eventType.startsWith('operations.waitlist')
      ) {
        await queues.reminders.add('class', row.payload);
        await queues.emails.add('class-notify', row.payload);
      } else if (eventType.startsWith('operations.access')) {
        await queues.access.add('access', row.payload);
      } else if (eventType === 'workouts.workout_suggested') {
        await queues.ai.add('suggest', row.payload);
        await queues.reminders.add('ai-review', row.payload);
      } else if (eventType.startsWith('workouts.')) {
        await queues.progress.add('workouts', row.payload);
        await queues.reminders.add('workouts', row.payload);
        if (eventType.includes('published')) {
          await queues.emails.add('workout-published', row.payload);
          await queues.whatsapp.add('workout-published', row.payload);
        }
      } else if (eventType.startsWith('engagement.notification')) {
        await queues.push.add('notification', row.payload);
      } else if (eventType.startsWith('engagement.message')) {
        await queues.push.add('chat', row.payload);
        await queues.reminders.add('chat', row.payload);
      } else if (eventType.startsWith('engagement.campaign')) {
        await queues.campaigns.add('campaign', row.payload);
        await queues.push.add('campaign', row.payload);
        await queues.emails.add('campaign', row.payload);
        await queues.whatsapp.add('campaign', row.payload);
      } else if (eventType.startsWith('engagement.')) {
        await queues.reminders.add('engagement', row.payload);
      } else if (eventType.startsWith('analytics.warehouse')) {
        await queues.warehouse.add('sync', row.payload);
        await queues.analytics.add('refresh', row.payload);
      } else if (eventType.startsWith('analytics.predictions')) {
        await queues.predictions.add('run', row.payload);
        await queues.ai.add('predictions', row.payload);
      } else if (eventType.startsWith('analytics.export')) {
        await queues.exports.add('export', row.payload);
        await queues.reports.add('export', row.payload);
      } else if (eventType.startsWith('analytics.')) {
        await queues.analytics.add('analytics', row.payload);
        await queues.reports.add('analytics', row.payload);
      } else if (eventType.includes('payment') || eventType.includes('Payment')) {
        await queues.charges.add('payment', row.payload);
        await queues.emails.add('receipt', row.payload);
        await queues.whatsapp.add('notify', row.payload);
      } else if (eventType.includes('subscription') || eventType.includes('Subscription')) {
        await queues.charges.add('subscription', row.payload);
        await queues.reminders.add('subscription', row.payload);
      } else if (eventType.includes('report') || eventType.includes('dre')) {
        await queues.reports.add('report', row.payload);
      } else {
        await queues.emails.add('generic', row.payload);
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
    }
  }
}

function startWorkers() {
  new Worker(
    'webhooks',
    async (job) => {
      if (job.name !== 'deliver') {
        log('webhook job', job.data);
        return;
      }
      const data = job.data as {
        deliveryId?: string;
        subscriptionId?: string;
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
            'X-Athena-Signature': `sha256=${signature}`,
            'X-Athena-Event': String(data.eventType || ''),
            'User-Agent': 'ATHENA-Webhooks/0.10',
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
        log('webhook delivered', data.deliveryId);
      } catch (e) {
        const attempt = Number(data.attempt || 0);
        const delayMin = WEBHOOK_RETRY_MINUTES[attempt];
        const message = e instanceof Error ? e.message : String(e);
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
  );

  new Worker(
    'charges',
    async (job) => {
      log('charges job', job.name);
      if (job.name === 'renew') {
        try {
          await fetch(`${API_URL}/finance/subscriptions/renew-due`, { method: 'POST' });
        } catch (e) {
          log('renew call failed (auth may be required — cron uses service path later)', e);
        }
      }
    },
    { connection },
  );

  new Worker(
    'emails',
    async (job) => {
      log(`[email stub] send for`, job.data);
    },
    { connection },
  );

  new Worker(
    'whatsapp',
    async (job) => {
      log(`[whatsapp stub] send for`, job.data);
    },
    { connection },
  );

  new Worker(
    'reports',
    async (job) => {
      log(`[pdf/report stub]`, job.data);
    },
    { connection },
  );

  new Worker(
    'reminders',
    async (job) => {
      log(`[reminder stub] ${job.name}`, job.data);
    },
    { connection },
  );

  new Worker(
    'checkins',
    async (job) => {
      log(`[checkin notify/stats stub]`, job.data);
    },
    { connection },
  );

  new Worker(
    'access-sync',
    async (job) => {
      log(`[access sync / biometric stub]`, job.data);
    },
    { connection },
  );

  new Worker(
    'progress',
    async (job) => {
      log(`[progress/stats stub]`, job.data);
    },
    { connection },
  );

  new Worker(
    'ai',
    async (job) => {
      log(`[ai recommendation stub]`, job.data);
    },
    { connection },
  );

  new Worker(
    'push',
    async (job) => {
      log(`[push stub]`, job.name, job.data);
    },
    { connection },
  );

  new Worker(
    'campaigns',
    async (job) => {
      log(`[campaign automation stub]`, job.data);
    },
    { connection },
  );

  new Worker(
    'analytics',
    async (job) => {
      log(`[analytics kpi refresh stub]`, job.name, job.data);
    },
    { connection },
  );

  new Worker(
    'predictions',
    async (job) => {
      log(`[prediction engine stub]`, job.data);
    },
    { connection },
  );

  new Worker(
    'warehouse',
    async (job) => {
      log(`[warehouse ETL stub]`, job.data);
    },
    { connection },
  );

  new Worker(
    'exports',
    async (job) => {
      log(`[export excel/pdf/csv stub]`, job.data);
    },
    { connection },
  );

  new Worker(
    'outbox-drain',
    async () => {
      await drainOutbox();
    },
    { connection },
  );
}

async function main() {
  log(`connecting redis ${REDIS_URL}`);
  startWorkers();
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
  log(
    'ATHENA worker online — queues: outbox, webhooks, charges, emails, whatsapp, reports, reminders, checkins, access, progress, ai, push, campaigns, analytics, predictions, warehouse, exports',
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
