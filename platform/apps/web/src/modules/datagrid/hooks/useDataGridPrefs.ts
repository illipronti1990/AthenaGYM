'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DataGridSort, SavedFilter, TablePreferences } from '@athena/shared';
import type { TablePreferencesState } from '@athena/ui';
import { datagridApi } from '../services/datagridApi';

const cache = new Map<string, TablePreferencesState>();

export function useDataGridPrefs(accessToken: string, tableName: string) {
  const [preferences, setPreferences] = useState<Partial<TablePreferencesState>>(
    () => cache.get(tableName) || { pageSize: 20, columns: [], columnOrder: [], columnWidths: {}, sort: null },
  );
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [prefs, filters] = await Promise.all([
          datagridApi.getPreferences(accessToken, tableName),
          datagridApi.listSavedFilters(accessToken, tableName),
        ]);
        if (cancelled) return;
        if (prefs) {
          const mapped: TablePreferencesState = {
            columns: prefs.columns || [],
            columnOrder: prefs.columnOrder || [],
            columnWidths: prefs.columnWidths || {},
            pageSize: prefs.pageSize || 20,
            sort: prefs.sort,
          };
          cache.set(tableName, mapped);
          setPreferences(mapped);
        }
        setSavedFilters(filters);
      } catch {
        /* offline / first use — local defaults */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, tableName]);

  const onPreferencesChange = useCallback(
    (patch: Partial<TablePreferencesState>) => {
      setPreferences((prev) => {
        const next = { ...prev, ...patch } as TablePreferencesState;
        cache.set(tableName, next);
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          void datagridApi
            .savePreferences(accessToken, {
              tableName,
              columns: next.columns,
              columnOrder: next.columnOrder,
              columnWidths: next.columnWidths,
              pageSize: next.pageSize,
              sort: next.sort,
            })
            .catch(() => undefined);
        }, 400);
        return next;
      });
    },
    [accessToken, tableName],
  );

  const refreshSavedFilters = useCallback(async () => {
    const filters = await datagridApi.listSavedFilters(accessToken, tableName);
    setSavedFilters(filters);
  }, [accessToken, tableName]);

  const saveFilter = useCallback(
    async (name: string, filters: Record<string, string>, search: string, sort: DataGridSort | null) => {
      await datagridApi.createSavedFilter(accessToken, {
        tableName,
        name,
        filters,
        search,
        sort,
      });
      await refreshSavedFilters();
    },
    [accessToken, tableName, refreshSavedFilters],
  );

  const deleteFilter = useCallback(
    async (id: string) => {
      await datagridApi.deleteSavedFilter(accessToken, id);
      await refreshSavedFilters();
    },
    [accessToken, refreshSavedFilters],
  );

  return {
    ready,
    preferences,
    onPreferencesChange,
    savedFilters,
    saveFilter,
    deleteFilter,
  };
}

export type { TablePreferences };
