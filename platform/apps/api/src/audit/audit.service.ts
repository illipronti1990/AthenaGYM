import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async log(input: {
    companyId: string | null;
    userId: string | null;
    module: string;
    action: string;
    entity?: string | null;
    entityId?: string | null;
    ip?: string;
    browser?: string;
    metadata?: Record<string, unknown>;
    beforeData?: Record<string, unknown> | null;
    afterData?: Record<string, unknown> | null;
    requestId?: string | null;
    severity?: 'info' | 'low' | 'medium' | 'high' | 'critical';
  }): Promise<void> {
    const admin = this.supabase.getAdmin();
    const payload = {
      company_id: input.companyId,
      user_id: input.userId,
      module: input.module,
      action: input.action,
      entity: input.entity || null,
      entity_id: input.entityId || null,
      ip: input.ip || null,
      browser: input.browser || null,
      metadata: input.metadata || null,
      before_data: input.beforeData || null,
      after_data: input.afterData || null,
      request_id: input.requestId || null,
      severity: input.severity || 'info',
    };

    const { error } = await admin.from('audit_logs').insert(payload);
    if (error) {
      this.logger.error(
        `audit_logs insert failed action=${input.action}: ${error.message}`,
      );
      // one retry without optional columns (pre-migration safety)
      const { error: retryErr } = await admin.from('audit_logs').insert({
        company_id: payload.company_id,
        user_id: payload.user_id,
        module: payload.module,
        action: payload.action,
        entity: payload.entity,
        entity_id: payload.entity_id,
        ip: payload.ip,
        browser: payload.browser,
        metadata: {
          ...(payload.metadata || {}),
          before_data: payload.before_data,
          after_data: payload.after_data,
          request_id: payload.request_id,
          severity: payload.severity,
        },
      });
      if (retryErr) {
        this.logger.error(`audit_logs retry failed: ${retryErr.message}`);
      }
    }
  }
}
