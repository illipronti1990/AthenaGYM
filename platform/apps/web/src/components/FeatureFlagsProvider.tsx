'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_FEATURE_FLAGS,
  type FeatureFlagKey,
  type FeatureFlags,
} from '@athena/shared';
import { featuresApi } from '@/services/featuresApi';

type FeatureFlagsCtx = {
  flags: FeatureFlags;
  loading: boolean;
  enabled: (key: FeatureFlagKey) => boolean;
  refresh: () => Promise<void>;
};

const Ctx = createContext<FeatureFlagsCtx | null>(null);

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>({ ...DEFAULT_FEATURE_FLAGS });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setFlags(await featuresApi.getFlags());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<FeatureFlagsCtx>(
    () => ({
      flags,
      loading,
      enabled: (key) => flags[key] !== false,
      refresh,
    }),
    [flags, loading, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFeatureFlags(): FeatureFlagsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      flags: DEFAULT_FEATURE_FLAGS,
      loading: false,
      enabled: () => true,
      refresh: async () => undefined,
    };
  }
  return ctx;
}
