import type { DataGridSort, SavedFilter, TablePreferences } from '@movvo/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function apiFetch<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${accessToken}`,
    ...(init?.headers as Record<string, string>),
  };
  if (init?.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Erro ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const datagridApi = {
  listSavedFilters(accessToken: string, tableName: string) {
    return apiFetch<SavedFilter[]>(
      `/saved-filters?tableName=${encodeURIComponent(tableName)}`,
      accessToken,
    );
  },

  createSavedFilter(
    accessToken: string,
    body: {
      tableName: string;
      name: string;
      filters: Record<string, string>;
      search?: string;
      sort?: DataGridSort | null;
    },
  ) {
    return apiFetch<SavedFilter>('/saved-filters', accessToken, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  deleteSavedFilter(accessToken: string, id: string) {
    return apiFetch<{ ok: boolean }>(`/saved-filters/${id}`, accessToken, {
      method: 'DELETE',
    });
  },

  getPreferences(accessToken: string, tableName: string) {
    return apiFetch<TablePreferences | null>(
      `/table-preferences?tableName=${encodeURIComponent(tableName)}`,
      accessToken,
    );
  },

  savePreferences(
    accessToken: string,
    body: {
      tableName: string;
      columns?: string[];
      columnOrder?: string[];
      columnWidths?: Record<string, number>;
      pageSize?: number;
      sort?: DataGridSort | null;
    },
  ) {
    return apiFetch<TablePreferences>('/table-preferences', accessToken, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
};
