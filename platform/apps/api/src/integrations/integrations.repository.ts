import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import type { PartnerApiLog, PartnerHubItem } from '@athena/shared';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class IntegrationsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  private admin() {
    return this.supabase.getAdmin();
  }

  async listPartners(companyId: string): Promise<PartnerHubItem[]> {
    const { data, error } = await this.admin()
      .from('partners')
      .select('*')
      .eq('company_id', companyId)
      .order('name');
    if (error) throw error;
    return (data || []).map((r) => this.mapPartner(r as Record<string, unknown>));
  }

  mapPartner(row: Record<string, unknown>): PartnerHubItem {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      name: String(row.name),
      slug: String(row.slug),
      type: row.type as PartnerHubItem['type'],
      status: String(row.status),
      settings: (row.settings as Record<string, unknown>) || {},
    };
  }

  async getPartnerIntegration(companyId: string, provider: string) {
    const { data, error } = await this.admin()
      .from('partner_integrations')
      .select('*')
      .eq('company_id', companyId)
      .eq('provider', provider)
      .maybeSingle();
    if (error) throw error;
    return data as Record<string, unknown> | null;
  }

  async touchLastSync(companyId: string, provider: string) {
    await this.admin()
      .from('partner_integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('company_id', companyId)
      .eq('provider', provider);
  }

  async findLogByHash(companyId: string, provider: string, payloadHash: string) {
    const { data } = await this.admin()
      .from('partner_api_logs')
      .select('*')
      .eq('company_id', companyId)
      .eq('provider', provider)
      .eq('payload_hash', payloadHash)
      .maybeSingle();
    return data ? this.mapLog(data as Record<string, unknown>) : null;
  }

  async insertLog(row: Record<string, unknown>): Promise<PartnerApiLog> {
    const { data, error } = await this.admin()
      .from('partner_api_logs')
      .insert(row)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapLog(data as Record<string, unknown>);
  }

  async listLogs(companyId: string, provider?: string, limit = 50): Promise<PartnerApiLog[]> {
    let q = this.admin()
      .from('partner_api_logs')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (provider) q = q.eq('provider', provider);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map((r) => this.mapLog(r as Record<string, unknown>));
  }

  async getLog(companyId: string, id: string) {
    const { data } = await this.admin()
      .from('partner_api_logs')
      .select('*')
      .eq('company_id', companyId)
      .eq('id', id)
      .maybeSingle();
    return data ? this.mapLog(data as Record<string, unknown>) : null;
  }

  async updateLog(id: string, patch: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('partner_api_logs')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapLog(data as Record<string, unknown>);
  }

  mapLog(row: Record<string, unknown>): PartnerApiLog {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      provider: String(row.provider),
      endpoint: String(row.endpoint),
      status: String(row.status),
      httpStatus: row.http_status != null ? Number(row.http_status) : null,
      error: row.error ? String(row.error) : null,
      payload: (row.payload as Record<string, unknown>) || {},
      payloadHash: row.payload_hash ? String(row.payload_hash) : null,
      durationMs: row.duration_ms != null ? Number(row.duration_ms) : null,
      createdAt: String(row.created_at),
    };
  }

  async countPartnerCheckinsToday(companyId: string, partner: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { count } = await this.admin()
      .from('checkins')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('partner', partner)
      .gte('created_at', start.toISOString());
    return count || 0;
  }

  async countPendingAccessRequests(companyId: string, provider: string) {
    const { count } = await this.admin()
      .from('partner_access_requests')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('provider', provider)
      .eq('status', 'pending');
    return count || 0;
  }

  async findStudentByCpf(companyId: string, cpf: string) {
    const digits = cpf.replace(/\D/g, '');
    const { data } = await this.admin()
      .from('students')
      .select('id, full_name, unit_id, status')
      .eq('company_id', companyId)
      .eq('cpf', digits)
      .is('deleted_at', null)
      .maybeSingle();
    return data as Record<string, unknown> | null;
  }

  async findStudentByPartnerId(companyId: string, provider: string, externalId: string) {
    const col = provider === 'totalpass' ? 'totalpass_id' : 'wellhub_id';
    const { data } = await this.admin()
      .from('students')
      .select('id, full_name, unit_id, status')
      .eq('company_id', companyId)
      .eq(col, externalId)
      .is('deleted_at', null)
      .maybeSingle();
    return data as Record<string, unknown> | null;
  }

  async upsertStudentPartnerFields(
    companyId: string,
    studentId: string,
    provider: string,
    fields: {
      externalId: string;
      plan?: string;
      companyName?: string;
      status?: string;
    },
  ) {
    const patch: Record<string, unknown> = {
      partner_status: fields.status || 'active',
      partner_plan_name: fields.plan || null,
      partner_company_name: fields.companyName || null,
      partner_synced_at: new Date().toISOString(),
    };
    if (provider === 'totalpass') patch.totalpass_id = fields.externalId;
    else patch.wellhub_id = fields.externalId;
    await this.admin().from('students').update(patch).eq('company_id', companyId).eq('id', studentId);
  }

  async createPartnerStudent(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('students').insert(row).select('id').single();
    if (error) throw error;
    return String((data as { id: string }).id);
  }

  async insertCheckin(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('checkins').insert(row).select('*').single();
    if (error) {
      if (String(error.message || '').includes('idx_checkins_external_partner')) {
        return null;
      }
      throw error;
    }
    return data as Record<string, unknown>;
  }

  async insertAccessRequest(row: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('partner_access_requests')
      .insert(row)
      .select('*')
      .single();
    if (error) throw error;
    return data as Record<string, unknown>;
  }

  hashPayload(payload: unknown): string {
    return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  }

  redactPayload(payload: Record<string, unknown>): Record<string, unknown> {
    const clone = { ...payload };
    for (const key of Object.keys(clone)) {
      if (/token|secret|password|api.?key|authorization/i.test(key)) {
        clone[key] = '[REDACTED]';
      }
    }
    return clone;
  }
}
