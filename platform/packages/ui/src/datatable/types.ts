import type { ReactNode } from 'react';

export type DataGridSort = { id: string; desc: boolean };

export type DataGridColumn<T> = {
  id: string;
  header: string;
  accessor?: keyof T | ((row: T) => unknown);
  cell?: (row: T) => ReactNode;
  sortable?: boolean;
  sticky?: boolean;
  defaultVisible?: boolean;
  width?: number;
  minWidth?: number;
  /** Shown first in mobile card */
  mobilePrimary?: boolean;
  align?: 'left' | 'right' | 'center';
};

export type DataGridFilterDef = {
  id: string;
  label: string;
  type: 'select' | 'text';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
};

export type DataGridRowAction<T> = {
  id: string;
  label: string;
  onClick: (row: T) => void;
  danger?: boolean;
  hidden?: (row: T) => boolean;
};

export type DataGridBulkAction = {
  id: string;
  label: string;
  onClick: (ids: string[]) => void;
  danger?: boolean;
};

export type WorkPanel = {
  id: string;
  label: string;
  tone?: 'default' | 'danger' | 'success' | 'warn' | 'info';
  filters?: Record<string, string>;
  search?: string;
};

export type SavedFilterItem = {
  id: string;
  name: string;
  filters: Record<string, string>;
  search?: string | null;
  sort?: DataGridSort | null;
};

export type TablePreferencesState = {
  columns: string[];
  columnOrder: string[];
  columnWidths: Record<string, number>;
  pageSize: number;
  sort: DataGridSort | null;
};
