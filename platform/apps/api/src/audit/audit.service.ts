import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuditService {
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
  }): Promise<void> {
    const admin = this.supabase.getAdmin();
    await admin.from('audit_logs').insert({
      company_id: input.companyId,
      user_id: input.userId,
      module: input.module,
      action: input.action,
      entity: input.entity || null,
      entity_id: input.entityId || null,
      ip: input.ip || null,
      browser: input.browser || null,
      metadata: input.metadata || null,
    });
  }
}
