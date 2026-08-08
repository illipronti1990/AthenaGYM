export const movvoTypography = {
  h1: {
    fontSize: '2rem',
    lineHeight: 1.2,
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontSize: '1.5rem',
    lineHeight: 1.25,
    fontWeight: 700,
    letterSpacing: '-0.015em',
  },
  h3: {
    fontSize: '1.125rem',
    lineHeight: 1.35,
    fontWeight: 600,
    letterSpacing: '-0.01em',
  },
  body: {
    fontSize: '0.9375rem',
    lineHeight: 1.5,
    fontWeight: 400,
    letterSpacing: '0',
  },
  caption: {
    fontSize: '0.75rem',
    lineHeight: 1.4,
    fontWeight: 500,
    letterSpacing: '0.02em',
  },
  button: {
    fontSize: '0.875rem',
    lineHeight: 1.2,
    fontWeight: 600,
    letterSpacing: '0.01em',
  },
} as const;

export type MovvoTypographyKey = keyof typeof movvoTypography;
