import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import type { AuthContext, MeResponse, Profile, Role, Unit, Company, Membership } from '@athenas/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthUser } from './auth.types';

@Injectable()
export class AuthContextService {
  constructor(private readonly supabase: SupabaseService) {}

  async buildContext(user: AuthUser): Promise<AuthContext> {
    const admin = this.supabase.getAdmin();

    const profileRes = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    const profile = profileRes.data as Record<string, unknown> | null;
    if (profile && String(profile.status || 'active') === 'inactive') {
      throw new ForbiddenException('User inactive');
    }

    const urRes = await admin
      .from('user_roles')
      .select('id, profile_id, role_id, company_id, unit_id, roles(id, name, slug, company_id, is_system)')
      .eq('profile_id', user.id)
      .is('deleted_at', null);

    const rows = (urRes.data || []) as Array<Record<string, unknown>>;
    const roles = [
      ...new Set(
        rows
          .map((r) => {
            const role = r.roles as Record<string, unknown> | null;
            return role ? String(role.slug) : '';
          })
          .filter(Boolean),
      ),
    ];

    const isSuperAdmin = roles.includes('super_admin');
    const unitIds = [
      ...new Set(rows.map((r) => (r.unit_id ? String(r.unit_id) : '')).filter(Boolean)),
    ];
    const companyIds = [
      ...new Set(rows.map((r) => String(r.company_id)).filter(Boolean)),
    ];

    const roleIds = [...new Set(rows.map((r) => String(r.role_id)))];
    let permissions: string[] = [];
    if (roleIds.length > 0) {
      const rp = await admin
        .from('role_permissions')
        .select('permission_id, permissions(code)')
        .in('role_id', roleIds);
      permissions = [
        ...new Set(
          ((rp.data || []) as Array<Record<string, unknown>>)
            .map((x) => {
              const p = x.permissions as Record<string, unknown> | null;
              return p ? String(p.code) : '';
            })
            .filter(Boolean),
        ),
      ];
    }

    if (isSuperAdmin && permissions.length === 0) {
      const all = await admin.from('permissions').select('code').is('deleted_at', null);
      permissions = ((all.data || []) as Array<{ code: string }>).map((p) => p.code);
    }

    return {
      userId: user.id,
      email: user.email || (profile?.email as string) || null,
      companyId: (profile?.company_id as string) || companyIds[0] || null,
      companyIds,
      defaultUnitId: (profile?.default_unit_id as string) || unitIds[0] || null,
      unitIds,
      roles,
      permissions,
      isSuperAdmin,
      status: String(profile?.status || 'active'),
    };
  }

  async getMe(user: AuthUser): Promise<MeResponse> {
    const admin = this.supabase.getAdmin();
    let profileRes = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (!profileRes.data) {
      const upsert = await admin
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email: user.email || null,
            full_name: user.email?.split('@')[0] || 'User',
            status: 'active',
          },
          { onConflict: 'id' },
        )
        .select('*')
        .single();
      if (upsert.error || !upsert.data) {
        throw new UnauthorizedException('Profile not found');
      }
      profileRes = upsert;
    }

    await admin
      .from('profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    const auth = await this.buildContext(user);

    const membershipsRes = await admin
      .from('memberships')
      .select('*')
      .eq('profile_id', user.id)
      .is('deleted_at', null)
      .eq('status', 'active');

    const memberships = (membershipsRes.data || []).map((r) =>
      this.mapMembership(r as Record<string, unknown>),
    );

    const companyIds = [
      ...new Set(
        [
          ...memberships.map((m) => m.companyId),
          ...(auth.companyId ? [auth.companyId] : []),
        ].filter(Boolean),
      ),
    ];

    let companies: Company[] = [];
    if (companyIds.length > 0) {
      const companiesRes = await admin
        .from('companies')
        .select('*')
        .in('id', companyIds)
        .is('deleted_at', null);
      companies = (companiesRes.data || []).map((r) =>
        this.mapCompany(r as Record<string, unknown>),
      );
    }

    let units: Unit[] = [];
    if (companyIds.length > 0) {
      const unitsRes = await admin
        .from('units')
        .select('*')
        .in('company_id', companyIds)
        .is('deleted_at', null);
      units = (unitsRes.data || []).map((r) => this.mapUnit(r as Record<string, unknown>));
    }

    const rolesRes = await admin
      .from('roles')
      .select('*')
      .or(`company_id.is.null,company_id.in.(${companyIds.join(',')})`)
      .is('deleted_at', null);

    const allRoles = ((rolesRes.data || []) as Array<Record<string, unknown>>).map((r) =>
      this.mapRole(r),
    );
    const roles = allRoles.filter((r) => auth.roles.includes(r.slug));

    return {
      profile: this.mapProfile(profileRes.data as Record<string, unknown>),
      memberships,
      companies,
      units,
      roles,
      permissions: auth.permissions,
      auth,
    };
  }

  mapProfile(row: Record<string, unknown>): Profile {
    return {
      id: String(row.id),
      companyId: row.company_id ? String(row.company_id) : null,
      defaultUnitId: row.default_unit_id ? String(row.default_unit_id) : null,
      fullName: (row.full_name as string) || null,
      email: (row.email as string) || null,
      phone: (row.phone as string) || null,
      avatarUrl: (row.avatar_url as string) || null,
      status: String(row.status || 'active'),
      lastLoginAt: row.last_login_at ? String(row.last_login_at) : null,
      locale: (row.locale as string) || null,
      timezone: (row.timezone as string) || null,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      deletedAt: row.deleted_at ? String(row.deleted_at) : null,
    };
  }

  mapMembership(row: Record<string, unknown>): Membership {
    return {
      id: String(row.id),
      profileId: String(row.profile_id),
      companyId: String(row.company_id),
      unitId: row.unit_id ? String(row.unit_id) : null,
      role: row.role as Membership['role'],
      status: String(row.status || 'active'),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      deletedAt: row.deleted_at ? String(row.deleted_at) : null,
    };
  }

  mapCompany(row: Record<string, unknown>): Company {
    return {
      id: String(row.id),
      name: String(row.name),
      legalName: (row.legal_name as string) || null,
      document: (row.document as string) || null,
      status: String(row.status || 'active'),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      deletedAt: row.deleted_at ? String(row.deleted_at) : null,
    };
  }

  mapUnit(row: Record<string, unknown>): Unit {
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

  mapRole(row: Record<string, unknown>): Role {
    return {
      id: String(row.id),
      companyId: row.company_id ? String(row.company_id) : null,
      name: String(row.name),
      slug: String(row.slug),
      description: (row.description as string) || null,
      isSystem: Boolean(row.is_system),
    };
  }
}
