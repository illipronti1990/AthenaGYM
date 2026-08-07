export const FEATURE_FLAG_KEYS = [
  'inventory',
  'crm',
  'ai',
  'bi',
  'pdv',
  'marketplace',
  'whiteLabel',
  'mobile',
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];

export type FeatureFlags = Record<FeatureFlagKey, boolean>;

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  inventory: true,
  crm: true,
  ai: true,
  bi: true,
  pdv: true,
  marketplace: true,
  whiteLabel: true,
  mobile: true,
};

/**
 * Env override: MOVVO_FF_INVENTORY=0|false disables inventory.
 * CamelCase keys map to SNAKE: whiteLabel → MOVVO_FF_WHITE_LABEL (also MOVVO_FF_WHITELABEL).
 */
export function resolveFeatureFlags(
  env: Record<string, string | undefined> = {},
): FeatureFlags {
  const out: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS };
  for (const key of FEATURE_FLAG_KEYS) {
    const snake = key.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
    const compact = key.toUpperCase();
    const raw = env[`MOVVO_FF_${snake}`] ?? env[`MOVVO_FF_${compact}`];
    if (raw == null || raw === '') continue;
    out[key] = !['0', 'false', 'off', 'no'].includes(String(raw).toLowerCase());
  }
  return out;
}
