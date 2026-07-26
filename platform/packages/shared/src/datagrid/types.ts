export type DataGridSort = { id: string; desc: boolean };

export interface SavedFilter {
  id: string;
  companyId: string;
  userId: string;
  tableName: string;
  name: string;
  filters: Record<string, string>;
  search: string | null;
  sort: DataGridSort | null;
  createdAt: string;
}

export interface TablePreferences {
  id: string;
  companyId: string;
  userId: string;
  tableName: string;
  columns: string[];
  columnOrder: string[];
  columnWidths: Record<string, number>;
  pageSize: number;
  sort: DataGridSort | null;
  updatedAt: string;
}
