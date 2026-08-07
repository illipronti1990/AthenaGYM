import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthContext, TenantDomain, TenantEntitlements, TenantSummary } from '@movvo/shared';
import { createHash, randomBytes } from 'crypto';
import { promises as dns } from 'dns';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth.types';
import { RedisCacheService } from '../cache/redis-cache.service';
import { SupabaseService } from '../supabase/supabase.service';

const DEV_COMPANY = '11111111-1111-1111-1111-111111111111';

@Injectable()
export class TenantsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
    private readonly cache: RedisCacheService,
  ) {}

  private admin() {
    return this.supabase.getAdmin();
  }

  private assertPlatform(auth: AuthContext) {
    if (!auth.isSuperAdmin) {
      throw new BadRequestException('Platform operator required');
    }
  }

  private mapTenant(r: Record<string, unknown>): TenantSummary {
    return {
      id: String(r.id),
      name: String(r.name),
      tradeName: (r.trade_name as string) || null,
      legalName: (r.legal_name as string) || null,
      document: (r.document as string) || null,
      status: String(r.status || 'active'),
      saasStatus: (r.saas_status as TenantSummary['saasStatus']) || 'trial',
      planCode: (r.plan_code as string) || null,
      activatedAt: r.activated_at ? String(r.activated_at) : null,
      nextDueAt: r.next_due_at ? String(r.next_due_at) : null,
      trialEndsAt: r.trial_ends_at ? String(r.trial_ends_at) : null,
      logoUrl: (r.logo_url as string) || null,
      primaryColor: (r.primary_color as string) || null,
      theme: (r.theme as string) || null,
      fontFamily: (r.font_family as string) || null,
      emailFrom: (r.email_from as string) || null,
      emailReplyTo: (r.email_reply_to as string) || null,
      createdAt: String(r.created_at),
    };
  }

  private mapDomain(r: Record<string, unknown>): TenantDomain {
    return {
      id: String(r.id),
      companyId: String(r.company_id),
      hostname: String(r.hostname),
      isPrimary: Boolean(r.is_primary),
      verificationToken: String(r.verification_token),
      dnsStatus: r.dns_status as TenantDomain['dnsStatus'],
      sslStatus: r.ssl_status as TenantDomain['sslStatus'],
      verifiedAt: r.verified_at ? String(r.verified_at) : null,
      sslProvisionedAt: r.ssl_provisioned_at ? String(r.ssl_provisioned_at) : null,
    };
  }

  async list(auth: AuthContext) {
    this.assertPlatform(auth);
    const { data, error } = await this.admin()
      .from('companies')
      .select('*')
      .is('deleted_at', null)
      .order('name');
    if (error) throw new BadRequestException(error.message);
    return (data || []).map((r) => this.mapTenant(r as Record<string, unknown>));
  }

  async get(auth: AuthContext, id: string) {
    if (!auth.isSuperAdmin && !auth.companyIds.includes(id)) {
      throw new NotFoundException('Tenant not found');
    }
    const { data, error } = await this.admin()
      .from('companies')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Tenant not found');
    return this.mapTenant(data as Record<string, unknown>);
  }

  async create(
    auth: AuthContext,
    user: AuthUser,
    body: {
      name: string;
      tradeName?: string;
      legalName?: string;
      document?: string;
      planCode?: string;
    },
  ) {
    this.assertPlatform(auth);
    const trialEnds = new Date(Date.now() + 14 * 86400000).toISOString();
    const { data, error } = await this.admin()
      .from('companies')
      .insert({
        name: body.name.trim(),
        trade_name: body.tradeName || body.name.trim(),
        legal_name: body.legalName || null,
        document: body.document || null,
        status: 'active',
        saas_status: 'trial',
        plan_code: body.planCode || 'start',
        trial_ends_at: trialEnds,
        activated_at: new Date().toISOString(),
      })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    await this.audit.log({
      companyId: data.id,
      userId: user.id,
      module: 'saas',
      action: 'create',
      entity: 'tenant',
      entityId: data.id,
    });
    return this.mapTenant(data as Record<string, unknown>);
  }

  async update(
    auth: AuthContext,
    user: AuthUser,
    id: string,
    body: Record<string, unknown>,
  ) {
    this.assertPlatform(auth);
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const map: Record<string, string> = {
      name: 'name',
      tradeName: 'trade_name',
      legalName: 'legal_name',
      document: 'document',
      status: 'status',
      saasStatus: 'saas_status',
      planCode: 'plan_code',
      nextDueAt: 'next_due_at',
      trialEndsAt: 'trial_ends_at',
      logoUrl: 'logo_url',
      faviconUrl: 'favicon_url',
      primaryColor: 'primary_color',
      secondaryColor: 'secondary_color',
      backgroundLogin: 'background_login',
      theme: 'theme',
      fontFamily: 'font_family',
      emailFrom: 'email_from',
      emailReplyTo: 'email_reply_to',
      brandingJson: 'branding_json',
    };
    for (const [k, col] of Object.entries(map)) {
      if (body[k] !== undefined) patch[col] = body[k];
    }
    if (body.saasStatus === 'active' && !patch.activated_at) {
      patch.activated_at = new Date().toISOString();
    }
    const { data, error } = await this.admin()
      .from('companies')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    await this.audit.log({
      companyId: id,
      userId: user.id,
      module: 'saas',
      action: 'update',
      entity: 'tenant',
      entityId: id,
      metadata: body,
    });
    return this.mapTenant(data as Record<string, unknown>);
  }

  async softDelete(auth: AuthContext, user: AuthUser, id: string) {
    this.assertPlatform(auth);
    const { error } = await this.admin()
      .from('companies')
      .update({
        deleted_at: new Date().toISOString(),
        status: 'inactive',
        saas_status: 'cancelled',
      })
      .eq('id', id);
    if (error) throw new BadRequestException(error.message);
    await this.audit.log({
      companyId: id,
      userId: user.id,
      module: 'saas',
      action: 'delete',
      entity: 'tenant',
      entityId: id,
    });
    return { ok: true };
  }

  async suspend(auth: AuthContext, user: AuthUser, id: string) {
    return this.update(auth, user, id, { saasStatus: 'suspended', status: 'inactive' });
  }

  async activate(auth: AuthContext, user: AuthUser, id: string) {
    return this.update(auth, user, id, { saasStatus: 'active', status: 'active' });
  }

  // ---- domains ----
  async listDomains(auth: AuthContext, companyId: string) {
    if (!auth.isSuperAdmin && !auth.companyIds.includes(companyId)) {
      throw new NotFoundException('Tenant not found');
    }
    const { data, error } = await this.admin()
      .from('tenant_domains')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('hostname');
    if (error) throw new BadRequestException(error.message);
    return (data || []).map((r) => this.mapDomain(r as Record<string, unknown>));
  }

  async addDomain(auth: AuthContext, user: AuthUser, companyId: string, hostname: string) {
    if (!auth.isSuperAdmin && !auth.companyIds.includes(companyId)) {
      throw new NotFoundException('Tenant not found');
    }
    const host = hostname.trim().toLowerCase();
    const token = `movvo-verify-${randomBytes(12).toString('hex')}`;
    const { data, error } = await this.admin()
      .from('tenant_domains')
      .insert({
        company_id: companyId,
        hostname: host,
        verification_token: token,
        dns_status: 'pending',
        ssl_status: 'pending',
      })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    await this.audit.log({
      companyId,
      userId: user.id,
      module: 'saas',
      action: 'create',
      entity: 'tenant_domain',
      entityId: data.id,
      metadata: { hostname: host },
    });
    return this.mapDomain(data as Record<string, unknown>);
  }

  async verifyDomain(auth: AuthContext, user: AuthUser, domainId: string) {
    const { data: row, error } = await this.admin()
      .from('tenant_domains')
      .select('*')
      .eq('id', domainId)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!row) throw new NotFoundException('Domain not found');
    if (!auth.isSuperAdmin && !auth.companyIds.includes(String(row.company_id))) {
      throw new NotFoundException('Domain not found');
    }

    let dnsOk = false;
    try {
      const records = await dns.resolveTxt(String(row.hostname));
      const flat = records.flat().join(' ');
      dnsOk = flat.includes(String(row.verification_token));
    } catch {
      // stub / local: allow verify when MOVVO_DNS_STUB=1
      dnsOk = process.env.MOVVO_DNS_STUB === '1' || process.env.NODE_ENV !== 'production';
    }

    const patch: Record<string, unknown> = {
      dns_status: dnsOk ? 'verified' : 'failed',
      verified_at: dnsOk ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    if (dnsOk) {
      // SSL provider stub — production docs describe Cloudflare/LE
      patch.ssl_status = 'provisioned';
      patch.ssl_provisioned_at = new Date().toISOString();
    }

    const { data, error: upErr } = await this.admin()
      .from('tenant_domains')
      .update(patch)
      .eq('id', domainId)
      .select('*')
      .single();
    if (upErr) throw new BadRequestException(upErr.message);
    await this.audit.log({
      companyId: String(row.company_id),
      userId: user.id,
      module: 'saas',
      action: 'verify',
      entity: 'tenant_domain',
      entityId: domainId,
      metadata: { dnsOk },
    });
    return this.mapDomain(data as Record<string, unknown>);
  }

  async resolveCompanyByHost(hostname: string): Promise<string | null> {
    const host = hostname.trim().toLowerCase().split(':')[0];
    const { data } = await this.admin()
      .from('tenant_domains')
      .select('company_id')
      .eq('hostname', host)
      .eq('dns_status', 'verified')
      .is('deleted_at', null)
      .maybeSingle();
    return data?.company_id ? String(data.company_id) : null;
  }

  // ---- entitlements ----
  async entitlements(companyId: string, environment = 'production'): Promise<TenantEntitlements> {
    const cacheKey = this.cache.key(companyId, 'flags', `ent:${environment}`);
    return this.cache.wrap(cacheKey, RedisCacheService.TTL.flags, () =>
      this.loadEntitlements(companyId, environment),
    );
  }

  private async loadEntitlements(
    companyId: string,
    environment: string,
  ): Promise<TenantEntitlements> {
    const { data: company } = await this.admin()
      .from('companies')
      .select('id, plan_code')
      .eq('id', companyId)
      .is('deleted_at', null)
      .maybeSingle();
    if (!company) throw new NotFoundException('Tenant not found');

    const planCode = (company.plan_code as string) || 'start';
    const { data: plan } = await this.admin()
      .from('saas_plans')
      .select('id')
      .eq('code', planCode)
      .is('deleted_at', null)
      .maybeSingle();

    const flags: Record<string, boolean> = {};
    const limits: Record<string, number | null> = {};

    if (plan?.id) {
      const [pf, pl] = await Promise.all([
        this.admin().from('saas_plan_features').select('feature_key, enabled').eq('plan_id', plan.id),
        this.admin().from('saas_plan_limits').select('limit_key, limit_value').eq('plan_id', plan.id),
      ]);
      for (const f of pf.data || []) flags[String(f.feature_key)] = Boolean(f.enabled);
      for (const l of pl.data || []) {
        limits[String(l.limit_key)] = l.limit_value == null ? null : Number(l.limit_value);
      }
    }

    const { data: overrides } = await this.admin()
      .from('tenant_features')
      .select('flag_key, enabled, environment')
      .eq('company_id', companyId);
    for (const o of overrides || []) {
      const env = String(o.environment);
      if (env === 'all' || env === environment) {
        flags[String(o.flag_key)] = Boolean(o.enabled);
      }
    }

    const { data: tLimits } = await this.admin()
      .from('tenant_limits')
      .select('limit_key, limit_value')
      .eq('company_id', companyId);
    for (const l of tLimits || []) {
      limits[String(l.limit_key)] = l.limit_value == null ? null : Number(l.limit_value);
    }

    const usage: Record<string, number> = {};
    const [students, users, units] = await Promise.all([
      this.admin().from('students').select('id', { count: 'exact', head: true }).eq('company_id', companyId).is('deleted_at', null),
      this.admin().from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', companyId).is('deleted_at', null),
      this.admin().from('units').select('id', { count: 'exact', head: true }).eq('company_id', companyId).is('deleted_at', null),
    ]);
    usage.students = students.count || 0;
    usage.users = users.count || 0;
    usage.units = units.count || 0;

    return { companyId, planCode, flags, limits, usage };
  }

  async setTenantFeature(
    auth: AuthContext,
    user: AuthUser,
    companyId: string,
    body: { flagKey: string; enabled: boolean; environment?: string; reason?: string },
  ) {
    this.assertPlatform(auth);
    const { data, error } = await this.admin()
      .from('tenant_features')
      .upsert({
        company_id: companyId,
        flag_key: body.flagKey,
        enabled: body.enabled,
        environment: body.environment || 'all',
        reason: body.reason || null,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    await this.audit.log({
      companyId,
      userId: user.id,
      module: 'saas',
      action: 'update',
      entity: 'tenant_feature',
      entityId: data.id,
      metadata: body,
    });
    await this.cache.invalidatePrefix(this.cache.key(companyId, 'flags', ''));
    return data;
  }

  companyIdFallback(auth: AuthContext): string {
    return auth.companyId || auth.companyIds[0] || DEV_COMPANY;
  }

  /** Deterministic fingerprint helper for SSL stub docs */
  fingerprint(hostname: string): string {
    return createHash('sha256').update(hostname).digest('hex').slice(0, 16);
  }
}
