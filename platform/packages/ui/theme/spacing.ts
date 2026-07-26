/** Athena 8-point spacing scale — never use ad-hoc values outside this set. */
export const athenaSpacing = {
  8: 8,
  16: 16,
  24: 24,
  32: 32,
  48: 48,
  64: 64,
} as const;

export type AthenaSpacing = keyof typeof athenaSpacing;

export const space = {
  xs: athenaSpacing[8],
  sm: athenaSpacing[16],
  md: athenaSpacing[24],
  lg: athenaSpacing[32],
  xl: athenaSpacing[48],
  '2xl': athenaSpacing[64],
} as const;
