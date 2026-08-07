import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SecurityEventsService {
  private readonly logger = new Logger(SecurityEventsService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  async record(input: {
    companyId?: string | null;
    userId?: string | null;
    eventType: string;
    severity?: 'info' | 'low' | 'medium' | 'high' | 'critical';
    email?: string;
    ip?: string;
    fingerprint?: string;
    details?: Record<string, unknown>;
    lockedUntil?: string | null;
  }) {
    const admin = this.supabase.getAdmin();
    const { data, error } = await admin
      .from('security_events')
      .insert({
        company_id: input.companyId || null,
        user_id: input.userId || null,
        event_type: input.eventType,
        severity: input.severity || 'medium',
        email: input.email || null,
        ip: input.ip || null,
        fingerprint: input.fingerprint || null,
        details: input.details || {},
        locked_until: input.lockedUntil || null,
      })
      .select('id')
      .maybeSingle();

    if (error) {
      this.logger.error(`security_events insert failed: ${error.message}`);
    }

    await this.audit.log({
      companyId: input.companyId || null,
      userId: input.userId || null,
      module: 'security',
      action: input.eventType,
      entity: 'security_events',
      entityId: data?.id || null,
      ip: input.ip,
      severity: input.severity || 'medium',
      metadata: { email: input.email, ...input.details },
    });

    return data;
  }

  async isLocked(email: string, ip?: string): Promise<{ locked: boolean; until?: string }> {
    const admin = this.supabase.getAdmin();
    const now = new Date().toISOString();
    let q = admin
      .from('security_events')
      .select('locked_until')
      .eq('event_type', 'login.lockout')
      .gt('locked_until', now)
      .order('locked_until', { ascending: false })
      .limit(1);

    if (email) q = q.eq('email', email.trim().toLowerCase());
    const { data } = await q.maybeSingle();
    if (data?.locked_until) {
      return { locked: true, until: data.locked_until };
    }

    if (ip) {
      const { data: byIp } = await admin
        .from('security_events')
        .select('locked_until')
        .eq('event_type', 'login.lockout')
        .eq('ip', ip)
        .gt('locked_until', now)
        .order('locked_until', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (byIp?.locked_until) {
        return { locked: true, until: byIp.locked_until };
      }
    }

    return { locked: false };
  }

  async countRecentFailures(email: string, windowMinutes = 15): Promise<number> {
    const admin = this.supabase.getAdmin();
    const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();
    const { count } = await admin
      .from('security_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'login.failed')
      .eq('email', email.trim().toLowerCase())
      .gte('created_at', since);
    return count || 0;
  }
}
