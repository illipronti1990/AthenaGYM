import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthContext, Permission, Role } from '@athena/shared';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth.types';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class RolesService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  private admin() {
    return this.supabase.getAdmin();
  }

  private companyId(auth: AuthContext): string | null {
    if (auth.isSuperAdmin) return auth.companyId || auth.companyIds[0] || null;
    return auth.companyId || auth.companyIds[0] || null;
  }

  async list(auth: AuthContext): Promise<Role[]> {
    const admin = this.admin();
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

  async create(
    auth: AuthContext,
    user: AuthUser,
    body: { name: string; slug: string; description?: string },
  ): Promise<Role> {
    const companyId = this.companyId(auth);
    if (!companyId && !auth.isSuperAdmin) {
      throw new BadRequestException('companyId required');
    }
    const slug = body.slug.trim().toLowerCase().replace(/\s+/g, '_');
    const { data, error } = await this.admin()
      .from('roles')
      .insert({
        company_id: companyId,
        name: body.name.trim(),
        slug,
        description: body.description || null,
        is_system: false,
      })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    await this.audit.log({
      companyId,
      userId: user.id,
      module: 'admin',
      action: 'create',
      entity: 'role',
      entityId: data.id,
    });
    return {
      id: data.id,
      companyId: data.company_id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      isSystem: false,
      permissions: [],
    };
  }

  async update(
    auth: AuthContext,
    user: AuthUser,
    id: string,
    body: { name?: string; description?: string },
  ): Promise<Role> {
    const existing = await this.admin()
      .from('roles')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    if (!existing.data) throw new NotFoundException('Role not found');
    const row = existing.data as Record<string, unknown>;
    if (row.is_system) throw new BadRequestException('Cannot edit system role name via this API');
    if (
      !auth.isSuperAdmin &&
      row.company_id &&
      !auth.companyIds.includes(String(row.company_id))
    ) {
      throw new NotFoundException('Role not found');
    }
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) patch.name = body.name.trim();
    if (body.description !== undefined) patch.description = body.description;
    const { data, error } = await this.admin()
      .from('roles')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    await this.audit.log({
      companyId: data.company_id,
      userId: user.id,
      module: 'admin',
      action: 'update',
      entity: 'role',
      entityId: id,
    });
    const listed = await this.list(auth);
    return listed.find((r) => r.id === id)!;
  }

  async setPermissions(
    auth: AuthContext,
    user: AuthUser,
    roleId: string,
    permissionIds: string[],
  ) {
    const role = await this.admin()
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .is('deleted_at', null)
      .maybeSingle();
    if (!role.data) throw new NotFoundException('Role not found');
    const row = role.data as Record<string, unknown>;
    if (
      !auth.isSuperAdmin &&
      row.company_id &&
      !auth.companyIds.includes(String(row.company_id))
    ) {
      throw new NotFoundException('Role not found');
    }
    if (row.is_system && String(row.slug) === 'super_admin' && !auth.isSuperAdmin) {
      throw new BadRequestException('Cannot modify super_admin permissions');
    }

    await this.admin().from('role_permissions').delete().eq('role_id', roleId);
    if (permissionIds.length) {
      const { error } = await this.admin().from('role_permissions').insert(
        permissionIds.map((permission_id) => ({ role_id: roleId, permission_id })),
      );
      if (error) throw new BadRequestException(error.message);
    }
    await this.audit.log({
      companyId: (row.company_id as string) || this.companyId(auth),
      userId: user.id,
      module: 'admin',
      action: 'update',
      entity: 'role_permissions',
      entityId: roleId,
      metadata: { count: permissionIds.length },
    });
    const listed = await this.list(auth);
    return listed.find((r) => r.id === roleId)!;
  }

  async assignUserRole(
    auth: AuthContext,
    user: AuthUser,
    body: { profileId: string; roleId: string; unitId?: string },
  ) {
    const companyId = this.companyId(auth);
    const { error } = await this.admin().from('user_roles').insert({
      profile_id: body.profileId,
      role_id: body.roleId,
      unit_id: body.unitId || null,
      company_id: companyId,
    });
    if (error) throw new BadRequestException(error.message);
    await this.audit.log({
      companyId,
      userId: user.id,
      module: 'admin',
      action: 'create',
      entity: 'user_role',
      entityId: body.profileId,
      metadata: { roleId: body.roleId },
    });
    return { ok: true };
  }
}
