/** Movvo ERP — typography tokens (M-1). */
export const movvoTypography = {
  display: {
    family: 'Sora',
    cssVar: '--font-display',
    weights: [600, 700, 800] as const,
  },
  body: {
    family: 'Inter',
    cssVar: '--font-body',
    weights: [400, 500, 600, 700] as const,
  },
  mono: {
    family: 'JetBrains Mono',
    cssVar: '--font-mono',
    weights: [400, 500, 600] as const,
  },
} as const;
