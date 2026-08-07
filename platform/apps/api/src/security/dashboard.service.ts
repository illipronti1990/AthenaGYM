import { BadRequestException, Injectable } from '@nestjs/common';
import type { AuthContext } from '@movvo/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthUser } from '../auth/auth.types';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SecurityDashboardService {
  constructor(private readonly supabase: SupabaseService) {}

  async kpis(auth: AuthContext) {
    const companyId = auth.companyId;
    const admin = this.supabase.getAdmin();
    const since24h = new Date(Date.now() - 24 * 3600_000).toISOString();
    const since7d = new Date(Date.now() - 7 * 86_400_000).toISOString();

    const companyFilter = (table: string) => {
      let q = admin.from(table).select('id', { count: 'exact', head: true });
      if (!auth.isSuperAdmin && companyId) q = q.eq('company_id', companyId);
      else if (auth.isSuperAdmin && companyId) q = q.eq('company_id', companyId);
      return q;
    };

    const [
      loginsOk,
      loginsFail,
      mfaUsers,
      sessionsActive,
      audit24h,
      events24h,
      lockouts,
    ] = await Promise.all([
      admin
        .from('audit_logs')
        .select('id', { count: 'exact', head: true })
        .eq('action', 'login.success')
        .gte('created_at', since24h)
        .then((r) => r.count || 0),
      admin
        .from('audit_logs')
        .select('id', { count: 'exact', head: true })
        .eq('action', 'login.failed')
        .gte('created_at', since24h)
        .then((r) => r.count || 0),
      admin
        .from('user_mfa')
        .select('id', { count: 'exact', head: true })
        .or('totp_enabled.eq.true,email_otp_enabled.eq.true')
        .then((r) => r.count || 0),
      admin
        .from('user_sessions')
        .select('id', { count: 'exact', head: true })
        .is('revoked_at', null)
        .then((r) => r.count || 0),
      companyFilter('audit_logs').gte('created_at', since24h).then((r) => r.count || 0),
      companyFilter('security_events').gte('created_at', since24h).then((r) => r.count || 0),
      admin
        .from('security_events')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'login.lockout')
        .gte('created_at', since7d)
        .then((r) => r.count || 0),
    ]);

    return {
      loginsSuccess24h: loginsOk,
      loginsFailed24h: loginsFail,
      mfaEnrolledUsers: mfaUsers,
      activeSessions: sessionsActive,
      auditEvents24h: audit24h,
      securityEvents24h: events24h,
      lockouts7d: lockouts,
      generatedAt: new Date().toISOString(),
    };
  }
}

@Injectable()
export class BackupLogsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  async list(auth: AuthContext) {
    const admin = this.supabase.getAdmin();
    let q = admin
      .from('backup_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(50);
    if (!auth.isSuperAdmin) {
      if (!auth.companyId) return { items: [] };
      q = q.eq('company_id', auth.companyId);
    } else if (auth.companyId) {
      q = q.eq('company_id', auth.companyId);
    }
    const { data, error } = await q;
    if (error) throw new BadRequestException(error.message);
    return { items: data || [] };
  }

  async start(
    auth: AuthContext,
    user: AuthUser,
    body: { backupType?: string; storagePath?: string; meta?: Record<string, unknown> },
  ) {
    const admin = this.supabase.getAdmin();
    const { data, error } = await admin
      .from('backup_logs')
      .insert({
        company_id: auth.companyId || null,
        backup_type: body.backupType || 'tenant_export',
        status: 'running',
        storage_path: body.storagePath || null,
        triggered_by: user.id,
        meta: body.meta || {},
      })
      .select('*')
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);

    await this.audit.log({
      companyId: auth.companyId || null,
      userId: user.id,
      module: 'backup',
      action: 'backup.started',
      entity: 'backup_logs',
      entityId: data?.id,
    });
    return data;
  }

  async finish(
    id: string,
    status: 'success' | 'failed',
    extra?: { bytes?: number; checksum?: string; error?: string; storagePath?: string },
  ) {
    const admin = this.supabase.getAdmin();
    const { data, error } = await admin
      .from('backup_logs')
      .update({
        status,
        finished_at: new Date().toISOString(),
        bytes: extra?.bytes ?? null,
        checksum: extra?.checksum ?? null,
        error: extra?.error ?? null,
        storage_path: extra?.storagePath,
      })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    return data;
  }
}
