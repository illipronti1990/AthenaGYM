import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { AuthContext } from '@movvo/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth.types';
import { SecretsCrypto } from './secrets-crypto';

const DEFAULTS: Record<string, number> = {
  logs: 365,
  audit: 730,
  files: 365,
  backup: 90,
  security_events: 365,
};

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  async list(auth: AuthContext) {
    const companyId = auth.companyId;
    if (!companyId) throw new BadRequestException('companyId required');
    const admin = this.supabase.getAdmin();
    const { data, error } = await admin
      .from('retention_policies')
      .select('*')
      .eq('company_id', companyId);
    if (error) throw new BadRequestException(error.message);

    const byResource = new Map((data || []).map((r) => [r.resource, r]));
    const items = Object.keys(DEFAULTS).map((resource) => {
      const row = byResource.get(resource);
      return {
        resource,
        retainDays: row?.retain_days ?? DEFAULTS[resource],
        active: row?.active ?? true,
        id: row?.id ?? null,
      };
    });
    return { items };
  }

  async upsert(
    auth: AuthContext,
    user: AuthUser,
    body: { resource: string; retainDays: number; active?: boolean },
  ) {
    const companyId = auth.companyId;
    if (!companyId) throw new BadRequestException('companyId required');
    if (!DEFAULTS[body.resource]) throw new BadRequestException('invalid resource');
    if (body.retainDays < 30) throw new BadRequestException('retainDays min 30');

    const admin = this.supabase.getAdmin();
    const { data, error } = await admin
      .from('retention_policies')
      .upsert(
        {
          company_id: companyId,
          resource: body.resource,
          retain_days: body.retainDays,
          active: body.active ?? true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'company_id,resource' },
      )
      .select('*')
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);

    await this.audit.log({
      companyId,
      userId: user.id,
      module: 'security',
      action: 'retention.upsert',
      entity: 'retention_policies',
      entityId: data?.id,
      afterData: body as unknown as Record<string, unknown>,
    });
    return data;
  }

  /** Purge old rows according to active policies. Intended for cron/script. */
  async runPurge(companyId?: string) {
    const admin = this.supabase.getAdmin();
    let q = admin.from('retention_policies').select('*').eq('active', true);
    if (companyId) q = q.eq('company_id', companyId);
    const { data: policies, error } = await q;
    if (error) throw new BadRequestException(error.message);

    const results: Array<{ resource: string; companyId: string; deleted: number }> = [];
    for (const p of policies || []) {
      const cutoff = new Date(Date.now() - p.retain_days * 86_400_000).toISOString();
      let deleted = 0;
      if (p.resource === 'audit') {
        const { count } = await admin
          .from('audit_logs')
          .delete({ count: 'exact' })
          .eq('company_id', p.company_id)
          .lt('created_at', cutoff);
        deleted = count || 0;
      } else if (p.resource === 'security_events') {
        const { count } = await admin
          .from('security_events')
          .delete({ count: 'exact' })
          .eq('company_id', p.company_id)
          .lt('created_at', cutoff);
        deleted = count || 0;
      } else if (p.resource === 'logs') {
        const { count } = await admin
          .from('api_usage_logs')
          .delete({ count: 'exact' })
          .eq('company_id', p.company_id)
          .lt('created_at', cutoff);
        deleted = count || 0;
      }
      results.push({ resource: p.resource, companyId: p.company_id, deleted });
      this.logger.log(`purge ${p.resource} company=${p.company_id} deleted=${deleted}`);
    }
    return { results, ranAt: new Date().toISOString() };
  }
}

@Injectable()
export class IntegrationSecretsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly crypto: SecretsCrypto,
    private readonly audit: AuditService,
  ) {
    this.crypto.warnIfDefaultKey();
  }

  async put(
    auth: AuthContext,
    user: AuthUser,
    body: {
      provider: string;
      keyName: string;
      value: string;
      environment?: 'development' | 'homologation' | 'production';
    },
  ) {
    const companyId = auth.companyId;
    if (!companyId) throw new BadRequestException('companyId required');
    const { ciphertext, iv } = this.crypto.encrypt(body.value);
    const admin = this.supabase.getAdmin();
    const { data, error } = await admin
      .from('integration_secrets')
      .upsert(
        {
          company_id: companyId,
          provider: body.provider,
          environment: body.environment || 'production',
          key_name: body.keyName,
          ciphertext,
          iv,
          rotated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'company_id,provider,environment,key_name' },
      )
      .select('id, provider, environment, key_name, rotated_at, updated_at')
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);

    await this.audit.log({
      companyId,
      userId: user.id,
      module: 'integrations',
      action: 'secret.upsert',
      entity: 'integration_secrets',
      entityId: data?.id,
      severity: 'high',
      afterData: { provider: body.provider, keyName: body.keyName },
    });
    return data;
  }

  async listMeta(auth: AuthContext) {
    const companyId = auth.companyId;
    if (!companyId) throw new BadRequestException('companyId required');
    const admin = this.supabase.getAdmin();
    const { data, error } = await admin
      .from('integration_secrets')
      .select('id, provider, environment, key_name, rotated_at, updated_at, key_version')
      .eq('company_id', companyId)
      .order('provider');
    if (error) throw new BadRequestException(error.message);
    return { items: data || [] };
  }

  async getPlain(
    companyId: string,
    provider: string,
    keyName: string,
    environment = 'production',
  ): Promise<string | null> {
    const admin = this.supabase.getAdmin();
    const { data } = await admin
      .from('integration_secrets')
      .select('ciphertext, iv')
      .eq('company_id', companyId)
      .eq('provider', provider)
      .eq('key_name', keyName)
      .eq('environment', environment)
      .maybeSingle();
    if (!data) return null;
    return this.crypto.decrypt(data.ciphertext, data.iv);
  }
}
