import { BadRequestException, Injectable } from '@nestjs/common';
import type { AuthContext, AuditLogItem } from '@movvo/shared';
import { paginate } from '../common/pagination';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuditQueryService {
  constructor(private readonly supabase: SupabaseService) {}

  private companyIds(auth: AuthContext): string[] {
    if (auth.isSuperAdmin) {
      return auth.companyIds.length ? auth.companyIds : [];
    }
    return auth.companyIds;
  }

  async list(
    auth: AuthContext,
    query: {
      module?: string;
      action?: string;
      entity?: string;
      from?: string;
      to?: string;
      page?: number;
      pageSize?: number;
    },
  ): Promise<{ items: AuditLogItem[]; total: number; page: number; pageSize: number }> {
    const { page, pageSize, from, to } = paginate({
      page: query.page,
      pageSize: query.pageSize || 50,
      maxPageSize: 100,
    });

    const admin = this.supabase.getAdmin();
    let q = admin
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    const ids = this.companyIds(auth);
    if (!auth.isSuperAdmin) {
      if (ids.length === 0) {
        return { items: [], total: 0, page, pageSize };
      }
      q = q.in('company_id', ids);
    } else if (auth.companyId) {
      q = q.eq('company_id', auth.companyId);
    }

    if (query.module) q = q.eq('module', query.module);
    if (query.action) q = q.eq('action', query.action);
    if (query.entity) q = q.eq('entity', query.entity);
    if (query.from) q = q.gte('created_at', query.from);
    if (query.to) q = q.lte('created_at', query.to);

    const { data, error, count } = await q;
    if (error) throw new BadRequestException(error.message);

    const items: AuditLogItem[] = (data || []).map((row) => ({
      id: row.id,
      companyId: row.company_id,
      userId: row.user_id,
      module: row.module,
      action: row.action,
      entity: row.entity,
      entityId: row.entity_id,
      ip: row.ip,
      browser: row.browser,
      metadata: row.metadata,
      createdAt: row.created_at,
    }));

    return { items, total: count || 0, page, pageSize };
  }
}
