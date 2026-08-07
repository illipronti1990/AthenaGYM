import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthContext, Company } from '@movvo/shared';
import { AuthUser } from '../auth/auth.types';
import { SupabaseService } from '../supabase/supabase.service';

function mapCompany(row: Record<string, unknown>): Company {
  return {
    id: String(row.id),
    name: String(row.name),
    legalName: (row.legal_name as string) || null,
    document: (row.document as string) || null,
    status: String(row.status || 'active'),
    logoUrl: (row.logo_url as string) || null,
    faviconUrl: (row.favicon_url as string) || null,
    primaryColor: (row.primary_color as string) || null,
    secondaryColor: (row.secondary_color as string) || null,
    backgroundLogin: (row.background_login as string) || null,
    theme: (row.theme as string) || null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    deletedAt: row.deleted_at ? String(row.deleted_at) : null,
  };
}

@Injectable()
export class CompaniesService {
  constructor(private readonly supabase: SupabaseService) {}

  async list(_user: AuthUser, auth: AuthContext): Promise<Company[]> {
    if (auth.isSuperAdmin) {
      const { data, error } = await this.supabase
        .getAdmin()
        .from('companies')
        .select('*')
        .is('deleted_at', null)
        .order('name');
      if (error) throw error;
      return (data || []).map((r) => mapCompany(r as Record<string, unknown>));
    }
    const ids = auth.companyIds;
    if (ids.length === 0) return [];
    const { data, error } = await this.supabase
      .getAdmin()
      .from('companies')
      .select('*')
      .in('id', ids)
      .is('deleted_at', null)
      .order('name');
    if (error) throw error;
    return (data || []).map((r) => mapCompany(r as Record<string, unknown>));
  }

  async getById(_user: AuthUser, auth: AuthContext, id: string): Promise<Company> {
    if (!auth.isSuperAdmin && !auth.companyIds.includes(id)) {
      throw new NotFoundException('Company not found');
    }
    const { data, error } = await this.supabase
      .getAdmin()
      .from('companies')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Company not found');
    return mapCompany(data as Record<string, unknown>);
  }
}
