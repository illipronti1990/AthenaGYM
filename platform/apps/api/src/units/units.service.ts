import { Injectable } from '@nestjs/common';
import type { AuthContext, Unit } from '@athenas/shared';
import { SupabaseService } from '../supabase/supabase.service';

function mapUnit(row: Record<string, unknown>): Unit {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    name: String(row.name),
    code: (row.code as string) || null,
    city: (row.city as string) || null,
    state: (row.state as string) || null,
    status: String(row.status || 'active'),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    deletedAt: row.deleted_at ? String(row.deleted_at) : null,
  };
}

@Injectable()
export class UnitsService {
  constructor(private readonly supabase: SupabaseService) {}

  async list(auth: AuthContext, companyId?: string): Promise<Unit[]> {
    const allowed = new Set(auth.companyIds);
    if (companyId && !auth.isSuperAdmin && !allowed.has(companyId)) return [];

    let q = this.supabase
      .getAdmin()
      .from('units')
      .select('*')
      .is('deleted_at', null)
      .order('name');

    if (companyId) {
      q = q.eq('company_id', companyId);
    } else if (!auth.isSuperAdmin) {
      const ids = [...allowed];
      if (ids.length === 0) return [];
      q = q.in('company_id', ids);
    }

    const { data, error } = await q;
    if (error) throw error;
    let units = (data || []).map((r) => mapUnit(r as Record<string, unknown>));
    if (!auth.isSuperAdmin && auth.unitIds.length > 0) {
      units = units.filter((u) => auth.unitIds.includes(u.id));
    }
    return units;
  }
}
