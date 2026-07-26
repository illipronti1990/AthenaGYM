import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class DatagridRepository {
  constructor(private readonly supabase: SupabaseService) {}

  private admin() {
    return this.supabase.getAdmin();
  }

  listSavedFilters(companyId: string, userId: string, tableName: string) {
    return this.admin()
      .from('saved_filters')
      .select('*')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .eq('table_name', tableName)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) throw error;
        return data || [];
      });
  }

  createSavedFilter(row: {
    companyId: string;
    userId: string;
    tableName: string;
    name: string;
    filters: Record<string, string>;
    search?: string | null;
    sort?: { id: string; desc: boolean } | null;
  }) {
    return this.admin()
      .from('saved_filters')
      .insert({
        company_id: row.companyId,
        user_id: row.userId,
        table_name: row.tableName,
        name: row.name,
        filters: row.filters,
        search: row.search || null,
        sort: row.sort || null,
      })
      .select('*')
      .single()
      .then(({ data, error }) => {
        if (error) throw error;
        return data;
      });
  }

  deleteSavedFilter(companyId: string, userId: string, id: string) {
    return this.admin()
      .from('saved_filters')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .then(({ error }) => {
        if (error) throw error;
      });
  }

  getPreferences(companyId: string, userId: string, tableName: string) {
    return this.admin()
      .from('table_preferences')
      .select('*')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .eq('table_name', tableName)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) throw error;
        return data;
      });
  }

  upsertPreferences(row: {
    companyId: string;
    userId: string;
    tableName: string;
    columns: string[];
    columnOrder: string[];
    columnWidths: Record<string, number>;
    pageSize: number;
    sort?: { id: string; desc: boolean } | null;
  }) {
    return this.admin()
      .from('table_preferences')
      .upsert(
        {
          company_id: row.companyId,
          user_id: row.userId,
          table_name: row.tableName,
          columns: row.columns,
          column_order: row.columnOrder,
          column_widths: row.columnWidths,
          page_size: row.pageSize,
          sort: row.sort || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'company_id,user_id,table_name' },
      )
      .select('*')
      .single()
      .then(({ data, error }) => {
        if (error) throw error;
        return data;
      });
  }
}
