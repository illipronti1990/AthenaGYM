import { Injectable } from '@nestjs/common';
import type { DashboardLayoutItem } from '@movvo/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { normalizeLayout } from './dashboard.rules';

@Injectable()
export class DashboardRepository {
  constructor(private readonly supabase: SupabaseService) {}

  private admin() {
    return this.supabase.getAdmin();
  }

  /** Returns null when the user has never customized the layout. */
  async getLayout(companyId: string, userId: string): Promise<DashboardLayoutItem[] | null> {
    const { data } = await this.admin()
      .from('dashboard_layouts')
      .select('layout_json')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .maybeSingle();
    if (!data?.layout_json) return null;
    return normalizeLayout(data.layout_json);
  }

  async saveLayout(
    companyId: string,
    userId: string,
    layout: DashboardLayoutItem[],
  ): Promise<DashboardLayoutItem[]> {
    const normalized = normalizeLayout(layout);
    const { data, error } = await this.admin()
      .from('dashboard_layouts')
      .upsert(
        {
          company_id: companyId,
          user_id: userId,
          layout_json: normalized,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'company_id,user_id' },
      )
      .select('layout_json')
      .single();
    if (error) throw error;
    return normalizeLayout(data.layout_json);
  }
}
