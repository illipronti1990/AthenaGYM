import { Injectable } from '@nestjs/common';
import type { AuthContext, Permission, Role } from '@athena/shared';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class RolesService {
  constructor(private readonly supabase: SupabaseService) {}

  async list(auth: AuthContext): Promise<Role[]> {
    const admin = this.supabase.getAdmin();
    const { data } = await admin
      .from('roles')
      .select('*')
      .is('deleted_at', null)
      .or(
        auth.isSuperAdmin
          ? 'company_id.is.null'
          : `company_id.is.null,company_id.in.(${auth.companyIds.join(',') || '00000000-0000-0000-0000-000000000000'})`,
      )
      .order('name');

    const roles = ((data || []) as Array<Record<string, unknown>>).map((r) => ({
      id: String(r.id),
      companyId: r.company_id ? String(r.company_id) : null,
      name: String(r.name),
      slug: String(r.slug),
      description: (r.description as string) || null,
      isSystem: Boolean(r.is_system),
    }));

    const ids = roles.map((r) => r.id);
    if (!ids.length) return roles;

    const rp = await admin
      .from('role_permissions')
      .select('role_id, permissions(id, module, action, code, description)')
      .in('role_id', ids);

    const byRole = new Map<string, Permission[]>();
    for (const row of (rp.data || []) as Array<Record<string, unknown>>) {
      const p = row.permissions as Record<string, unknown> | null;
      if (!p) continue;
      const list = byRole.get(String(row.role_id)) || [];
      list.push({
        id: String(p.id),
        module: String(p.module),
        action: String(p.action),
        code: String(p.code),
        description: (p.description as string) || null,
      });
      byRole.set(String(row.role_id), list);
    }

    return roles.map((r) => ({ ...r, permissions: byRole.get(r.id) || [] }));
  }
}
