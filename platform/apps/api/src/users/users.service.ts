import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthContext, UserListItem } from '@movvo/shared';
import { AuthService } from '../auth/auth.service';
import { AuthUser } from '../auth/auth.types';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly authService: AuthService,
    private readonly audit: AuditService,
  ) {}

  async list(auth: AuthContext): Promise<UserListItem[]> {
    const admin = this.supabase.getAdmin();
    const companyIds = auth.isSuperAdmin ? null : auth.companyIds;
    let q = admin
      .from('profiles')
      .select('id, full_name, email, phone, status, last_login_at, company_id')
      .is('deleted_at', null)
      .order('full_name', { ascending: true });
    if (companyIds?.length) {
      q = q.in('company_id', companyIds);
    }
    const { data, error } = await q;
    if (error) throw new BadRequestException(error.message);
    const profiles = data || [];
    const ids = profiles.map((p) => p.id as string);
    if (!ids.length) return [];

    const ur = await admin
      .from('user_roles')
      .select('profile_id, unit_id, roles(slug)')
      .in('profile_id', ids)
      .is('deleted_at', null);

    const byProfile = new Map<string, { roles: string[]; unitIds: string[] }>();
    for (const row of (ur.data || []) as Array<Record<string, unknown>>) {
      const pid = String(row.profile_id);
      const cur = byProfile.get(pid) || { roles: [], unitIds: [] };
      const role = row.roles as Record<string, unknown> | null;
      if (role?.slug) cur.roles.push(String(role.slug));
      if (row.unit_id) cur.unitIds.push(String(row.unit_id));
      byProfile.set(pid, cur);
    }

    return profiles.map((p) => {
      const extra = byProfile.get(String(p.id)) || { roles: [], unitIds: [] };
      return {
        id: String(p.id),
        fullName: (p.full_name as string) || null,
        email: (p.email as string) || null,
        phone: (p.phone as string) || null,
        status: String(p.status || 'active'),
        lastLoginAt: p.last_login_at ? String(p.last_login_at) : null,
        roles: [...new Set(extra.roles)],
        unitIds: [...new Set(extra.unitIds)],
      };
    });
  }

  async create(actor: AuthUser, auth: AuthContext, dto: CreateUserDto) {
    return this.authService.invite(actor, auth, {
      email: dto.email,
      fullName: dto.fullName,
      phone: dto.phone,
      roleId: dto.roleId,
      unitId: dto.unitId,
      companyId: dto.companyId,
    });
  }

  async update(actor: AuthUser, auth: AuthContext, id: string, dto: UpdateUserDto) {
    const admin = this.supabase.getAdmin();
    const existing = await admin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    if (!existing.data) throw new NotFoundException('User not found');
    const row = existing.data as Record<string, unknown>;
    if (
      !auth.isSuperAdmin &&
      row.company_id &&
      !auth.companyIds.includes(String(row.company_id))
    ) {
      throw new NotFoundException('User not found');
    }

    const patch: Record<string, unknown> = {};
    if (dto.fullName !== undefined) patch.full_name = dto.fullName;
    if (dto.phone !== undefined) patch.phone = dto.phone;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.defaultUnitId !== undefined) patch.default_unit_id = dto.defaultUnitId;

    if (Object.keys(patch).length) {
      await admin.from('profiles').update(patch).eq('id', id);
    }

    if (dto.roleId) {
      const companyId = String(row.company_id || auth.companyId);
      await admin
        .from('user_roles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('profile_id', id)
        .eq('company_id', companyId)
        .is('deleted_at', null);
      await admin.from('user_roles').insert({
        profile_id: id,
        role_id: dto.roleId,
        company_id: companyId,
        unit_id: dto.unitId || row.default_unit_id || null,
      });
    }

    await this.audit.log({
      companyId: (row.company_id as string) || auth.companyId,
      userId: actor.id,
      module: 'users',
      action: 'update',
      entity: 'profile',
      entityId: id,
    });

    return { ok: true, id };
  }

  async remove(actor: AuthUser, auth: AuthContext, id: string) {
    const admin = this.supabase.getAdmin();
    const existing = await admin
      .from('profiles')
      .select('id, company_id')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    if (!existing.data) throw new NotFoundException('User not found');
    const row = existing.data as Record<string, unknown>;
    if (
      !auth.isSuperAdmin &&
      row.company_id &&
      !auth.companyIds.includes(String(row.company_id))
    ) {
      throw new NotFoundException('User not found');
    }

    await admin
      .from('profiles')
      .update({
        status: 'inactive',
        deleted_at: new Date().toISOString(),
      })
      .eq('id', id);

    await this.audit.log({
      companyId: (row.company_id as string) || auth.companyId,
      userId: actor.id,
      module: 'users',
      action: 'delete',
      entity: 'profile',
      entityId: id,
    });

    return { ok: true };
  }
}
