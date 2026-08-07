import { BadRequestException, Injectable } from '@nestjs/common';
import type { AuthContext, DataGridSort, SavedFilter, TablePreferences } from '@movvo/shared';
import { DatagridRepository } from './datagrid.repository';

const DEV_COMPANY = '00000000-0000-4000-8000-000000000001';

@Injectable()
export class DatagridService {
  constructor(private readonly repo: DatagridRepository) {}

  private companyId(auth: AuthContext) {
    const id =
      auth.companyId ||
      auth.companyIds[0] ||
      (process.env.DEV_AUTH_ENABLED === 'true' ? DEV_COMPANY : null);
    if (!id) throw new BadRequestException('companyId required');
    return id;
  }

  private mapFilter(row: Record<string, unknown>): SavedFilter {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      userId: String(row.user_id),
      tableName: String(row.table_name),
      name: String(row.name),
      filters: (row.filters as Record<string, string>) || {},
      search: (row.search as string) || null,
      sort: (row.sort as DataGridSort) || null,
      createdAt: String(row.created_at),
    };
  }

  private mapPrefs(row: Record<string, unknown>): TablePreferences {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      userId: String(row.user_id),
      tableName: String(row.table_name),
      columns: (row.columns as string[]) || [],
      columnOrder: (row.column_order as string[]) || [],
      columnWidths: (row.column_widths as Record<string, number>) || {},
      pageSize: Number(row.page_size || 20),
      sort: (row.sort as DataGridSort) || null,
      updatedAt: String(row.updated_at),
    };
  }

  async listSavedFilters(auth: AuthContext, tableName: string) {
    if (!tableName) throw new BadRequestException('tableName obrigatório');
    const rows = await this.repo.listSavedFilters(this.companyId(auth), auth.userId, tableName);
    return rows.map((r) => this.mapFilter(r as Record<string, unknown>));
  }

  async createSavedFilter(
    auth: AuthContext,
    body: {
      tableName: string;
      name: string;
      filters: Record<string, string>;
      search?: string;
      sort?: DataGridSort | null;
    },
  ) {
    if (!body.tableName || !body.name?.trim()) {
      throw new BadRequestException('tableName e name obrigatórios');
    }
    const row = await this.repo.createSavedFilter({
      companyId: this.companyId(auth),
      userId: auth.userId,
      tableName: body.tableName,
      name: body.name.trim(),
      filters: body.filters || {},
      search: body.search,
      sort: body.sort,
    });
    return this.mapFilter(row as Record<string, unknown>);
  }

  async deleteSavedFilter(auth: AuthContext, id: string) {
    await this.repo.deleteSavedFilter(this.companyId(auth), auth.userId, id);
    return { ok: true };
  }

  async getPreferences(auth: AuthContext, tableName: string) {
    if (!tableName) throw new BadRequestException('tableName obrigatório');
    const row = await this.repo.getPreferences(this.companyId(auth), auth.userId, tableName);
    return row ? this.mapPrefs(row as Record<string, unknown>) : null;
  }

  async savePreferences(
    auth: AuthContext,
    body: {
      tableName: string;
      columns?: string[];
      columnOrder?: string[];
      columnWidths?: Record<string, number>;
      pageSize?: number;
      sort?: DataGridSort | null;
    },
  ) {
    if (!body.tableName) throw new BadRequestException('tableName obrigatório');
    const current = await this.repo.getPreferences(
      this.companyId(auth),
      auth.userId,
      body.tableName,
    );
    const row = await this.repo.upsertPreferences({
      companyId: this.companyId(auth),
      userId: auth.userId,
      tableName: body.tableName,
      columns: body.columns ?? ((current?.columns as string[]) || []),
      columnOrder: body.columnOrder ?? ((current?.column_order as string[]) || []),
      columnWidths: body.columnWidths ?? ((current?.column_widths as Record<string, number>) || {}),
      pageSize: Math.min(200, Math.max(10, body.pageSize ?? Number(current?.page_size || 20))),
      sort: body.sort !== undefined ? body.sort : ((current?.sort as DataGridSort) || null),
    });
    return this.mapPrefs(row as Record<string, unknown>);
  }
}
