import type { FeatureFlags } from '@athena/shared';
import { DEFAULT_FEATURE_FLAGS } from '@athena/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const featuresApi = {
  async getFlags(): Promise<FeatureFlags> {
    try {
      const res = await fetch(`${API_URL}/platform/features`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!res.ok) return { ...DEFAULT_FEATURE_FLAGS };
      const body = (await res.json()) as { flags?: FeatureFlags };
      return { ...DEFAULT_FEATURE_FLAGS, ...(body.flags || {}) };
    } catch {
      return { ...DEFAULT_FEATURE_FLAGS };
    }
  },
};
