import { Injectable } from '@nestjs/common';
import type {
  ApiClient,
  ApiUsageSummary,
  MarketplaceInstallation,
  MarketplacePlugin,
  SandboxEnvironment,
  WebhookDelivery,
  WebhookSubscription,
} from '@athena/shared';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class PlatformRepository {
  constructor(private readonly supabase: SupabaseService) {}

  private admin() {
    return this.supabase.getAdmin();
  }

  mapClient(row: Record<string, unknown>): ApiClient {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      name: String(row.name),
      clientId: String(row.client_id),
      scopes: (row.scopes as string[]) || [],
      status: row.status as ApiClient['status'],
      environment: row.environment as ApiClient['environment'],
      ipAllowlist: (row.ip_allowlist as string[]) || [],
      rateLimitPerMinute: Number(row.rate_limit_per_minute || 60),
      rateLimitPerDay: Number(row.rate_limit_per_day || 10000),
      lastUsedAt: row.last_used_at ? String(row.last_used_at) : null,
      createdAt: String(row.created_at),
    };
  }

  mapWebhook(row: Record<string, unknown>): WebhookSubscription {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      apiClientId: row.api_client_id ? String(row.api_client_id) : null,
      url: String(row.url),
      secretHint: String(row.secret_hint),
      events: (row.events as string[]) || [],
      status: row.status as WebhookSubscription['status'],
      environment: row.environment as WebhookSubscription['environment'],
      createdAt: String(row.created_at),
    };
  }

  mapPlugin(row: Record<string, unknown>): MarketplacePlugin {
    return {
      id: String(row.id),
      slug: String(row.slug),
      name: String(row.name),
      description: row.description ? String(row.description) : null,
      version: String(row.version),
      publisher: String(row.publisher),
      category: String(row.category),
      permissions: Array.isArray(row.permissions)
        ? (row.permissions as string[])
        : ((row.permissions as unknown[]) || []).map(String),
      manifest: (row.manifest as Record<string, unknown>) || {},
      status: String(row.status),
    };
  }

  mapInstallation(row: Record<string, unknown>): MarketplaceInstallation {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      pluginId: String(row.plugin_id),
      status: row.status as MarketplaceInstallation['status'],
      config: (row.config as Record<string, unknown>) || {},
      installedAt: String(row.installed_at),
    };
  }

  mapDelivery(row: Record<string, unknown>): WebhookDelivery {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      subscriptionId: String(row.subscription_id),
      eventType: String(row.event_type),
      status: row.status as WebhookDelivery['status'],
      attempts: Number(row.attempts || 0),
      nextAttemptAt: String(row.next_attempt_at),
      lastStatusCode: row.last_status_code == null ? null : Number(row.last_status_code),
      lastError: row.last_error ? String(row.last_error) : null,
      responseMs: row.response_ms == null ? null : Number(row.response_ms),
      deliveredAt: row.delivered_at ? String(row.delivered_at) : null,
      createdAt: String(row.created_at),
    };
  }

  mapSandbox(row: Record<string, unknown>): SandboxEnvironment {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      name: String(row.name),
      status: row.status as SandboxEnvironment['status'],
      mockData: (row.mock_data as Record<string, unknown>) || {},
      createdAt: String(row.created_at),
    };
  }

  async insertClient(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('api_clients').insert(row).select('*').single();
    if (error) throw new Error(error.message);
    return this.mapClient(data as Record<string, unknown>);
  }

  async listClients(companyId: string) {
    const { data, error } = await this.admin()
      .from('api_clients')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((r) => this.mapClient(r as Record<string, unknown>));
  }

  async findClientByClientId(clientId: string) {
    const { data, error } = await this.admin()
      .from('api_clients')
      .select('*')
      .eq('client_id', clientId)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? { mapped: this.mapClient(data as Record<string, unknown>), raw: data as Record<string, unknown> } : null;
  }

  async findClientById(id: string) {
    const { data, error } = await this.admin()
      .from('api_clients')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? { mapped: this.mapClient(data as Record<string, unknown>), raw: data as Record<string, unknown> } : null;
  }

  async touchClient(id: string) {
    await this.admin()
      .from('api_clients')
      .update({ last_used_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id);
  }

  async insertOauthToken(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('oauth_tokens').insert(row).select('*').single();
    if (error) throw new Error(error.message);
    return data as Record<string, unknown>;
  }

  async findOauthByAccessHash(hash: string) {
    const { data, error } = await this.admin()
      .from('oauth_tokens')
      .select('*')
      .eq('access_token_hash', hash)
      .is('revoked_at', null)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as Record<string, unknown> | null;
  }

  async findOauthByRefreshHash(hash: string) {
    const { data, error } = await this.admin()
      .from('oauth_tokens')
      .select('*')
      .eq('refresh_token_hash', hash)
      .is('revoked_at', null)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as Record<string, unknown> | null;
  }

  async revokeOauth(id: string) {
    await this.admin()
      .from('oauth_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id);
  }

  async insertWebhook(row: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('webhook_subscriptions')
      .insert(row)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return this.mapWebhook(data as Record<string, unknown>);
  }

  async listWebhooks(companyId: string) {
    const { data, error } = await this.admin()
      .from('webhook_subscriptions')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((r) => this.mapWebhook(r as Record<string, unknown>));
  }

  async findWebhookRaw(id: string) {
    const { data, error } = await this.admin()
      .from('webhook_subscriptions')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as Record<string, unknown> | null;
  }

  async listActiveWebhooksForEvent(companyId: string, eventType: string, environment: string) {
    const { data, error } = await this.admin()
      .from('webhook_subscriptions')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .eq('environment', environment)
      .is('deleted_at', null)
      .contains('events', [eventType]);
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  }

  async insertDelivery(row: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('webhook_deliveries')
      .insert(row)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return this.mapDelivery(data as Record<string, unknown>);
  }

  async listDeliveries(companyId: string, limit = 50) {
    const { data, error } = await this.admin()
      .from('webhook_deliveries')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data || []).map((r) => this.mapDelivery(r as Record<string, unknown>));
  }

  async listPlugins() {
    const { data, error } = await this.admin()
      .from('marketplace_plugins')
      .select('*')
      .eq('status', 'published')
      .order('name');
    if (error) throw new Error(error.message);
    return (data || []).map((r) => this.mapPlugin(r as Record<string, unknown>));
  }

  async findPluginById(id: string) {
    const { data, error } = await this.admin()
      .from('marketplace_plugins')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? this.mapPlugin(data as Record<string, unknown>) : null;
  }

  async findPluginBySlug(slug: string) {
    const { data, error } = await this.admin()
      .from('marketplace_plugins')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? this.mapPlugin(data as Record<string, unknown>) : null;
  }

  async upsertInstallation(row: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('marketplace_installations')
      .upsert(row, { onConflict: 'company_id,plugin_id' })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return this.mapInstallation(data as Record<string, unknown>);
  }

  async listInstallations(companyId: string) {
    const { data, error } = await this.admin()
      .from('marketplace_installations')
      .select('*')
      .eq('company_id', companyId)
      .neq('status', 'removed')
      .order('installed_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((r) => this.mapInstallation(r as Record<string, unknown>));
  }

  async updateInstallation(id: string, patch: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('marketplace_installations')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return this.mapInstallation(data as Record<string, unknown>);
  }

  async insertSandbox(row: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('sandbox_environments')
      .insert(row)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return this.mapSandbox(data as Record<string, unknown>);
  }

  async listSandboxes(companyId: string) {
    const { data, error } = await this.admin()
      .from('sandbox_environments')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((r) => this.mapSandbox(r as Record<string, unknown>));
  }

  async insertUsage(row: Record<string, unknown>) {
    await this.admin().from('api_usage_logs').insert(row);
  }

  async countUsageSince(apiClientId: string, sinceIso: string) {
    const { count, error } = await this.admin()
      .from('api_usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('api_client_id', apiClientId)
      .gte('created_at', sinceIso);
    if (error) throw new Error(error.message);
    return count || 0;
  }

  async usageSummary(companyId: string, sinceIso: string): Promise<ApiUsageSummary> {
    const { data, error } = await this.admin()
      .from('api_usage_logs')
      .select('endpoint,status_code,latency_ms')
      .eq('company_id', companyId)
      .gte('created_at', sinceIso)
      .limit(2000);
    if (error) throw new Error(error.message);
    const rows = (data || []) as { endpoint: string; status_code: number; latency_ms: number }[];
    const byMap = new Map<string, { count: number; latency: number }>();
    let errorCount = 0;
    let latencySum = 0;
    for (const r of rows) {
      if (r.status_code >= 400) errorCount += 1;
      latencySum += Number(r.latency_ms || 0);
      const cur = byMap.get(r.endpoint) || { count: 0, latency: 0 };
      cur.count += 1;
      cur.latency += Number(r.latency_ms || 0);
      byMap.set(r.endpoint, cur);
    }
    return {
      totalCalls: rows.length,
      errorCount,
      avgLatencyMs: rows.length ? Math.round(latencySum / rows.length) : 0,
      byEndpoint: [...byMap.entries()].map(([endpoint, v]) => ({
        endpoint,
        count: v.count,
        avgLatencyMs: v.count ? Math.round(v.latency / v.count) : 0,
      })),
    };
  }

  async insertOutbox(row: Record<string, unknown>) {
    await this.admin().from('outbox_events').insert(row);
  }

  async listStudents(companyId: string, page: number, pageSize: number) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await this.admin()
      .from('students')
      .select('id,full_name,status,unit_id,created_at', { count: 'exact' })
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .range(from, to);
    if (error) throw new Error(error.message);
    return {
      data: (data || []).map((r) => ({
        id: String(r.id),
        fullName: r.full_name,
        status: r.status,
        unitId: r.unit_id,
        createdAt: r.created_at,
      })),
      page,
      pageSize,
      total: count || 0,
    };
  }

  async listPlans(companyId: string) {
    const { data, error } = await this.admin()
      .from('plans')
      .select('id,name,price,status,billing_cycle')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .limit(100);
    if (error) {
      // table may differ — return empty rather than breaking public API in stub envs
      return [];
    }
    return (data || []).map((r) => ({
      id: String(r.id),
      name: r.name,
      price: r.price,
      status: r.status,
      billingCycle: r.billing_cycle,
    }));
  }

  async listUnits(companyId: string) {
    const { data, error } = await this.admin()
      .from('units')
      .select('id,name,code,city,state,status')
      .eq('company_id', companyId)
      .is('deleted_at', null);
    if (error) throw new Error(error.message);
    return (data || []).map((r) => ({
      id: String(r.id),
      name: r.name,
      code: r.code,
      city: r.city,
      state: r.state,
      status: r.status,
    }));
  }

  async listWorkouts(companyId: string, page: number, pageSize: number) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await this.admin()
      .from('workouts')
      .select('id,name,status,student_id,created_at', { count: 'exact' })
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .range(from, to);
    if (error) return { data: [], page, pageSize, total: 0 };
    return {
      data: (data || []).map((r) => ({
        id: String(r.id),
        name: r.name,
        status: r.status,
        studentId: r.student_id,
        createdAt: r.created_at,
      })),
      page,
      pageSize,
      total: count || 0,
    };
  }

  async listPayments(companyId: string, page: number, pageSize: number) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await this.admin()
      .from('receivables')
      .select('id,amount,status,due_date,paid_at,student_id', { count: 'exact' })
      .eq('company_id', companyId)
      .range(from, to);
    if (error) return { data: [], page, pageSize, total: 0 };
    return {
      data: (data || []).map((r) => ({
        id: String(r.id),
        amount: r.amount,
        status: r.status,
        dueDate: r.due_date,
        paidAt: r.paid_at,
        studentId: r.student_id,
      })),
      page,
      pageSize,
      total: count || 0,
    };
  }
}
