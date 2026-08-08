/** Movvo 8-point spacing scale — never use ad-hoc values outside this set. */
export const movvoSpacing = {
  8: 8,
  16: 16,
  24: 24,
  32: 32,
  48: 48,
  64: 64,
} as const;

export type MovvoSpacing = keyof typeof movvoSpacing;

export const space = {
  xs: movvoSpacing[8],
  sm: movvoSpacing[16],
  md: movvoSpacing[24],
  lg: movvoSpacing[32],
  xl: movvoSpacing[48],
  '2xl': movvoSpacing[64],
} as const;
