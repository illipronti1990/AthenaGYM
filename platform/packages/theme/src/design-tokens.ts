import { movvoColorsDark, movvoColorsLight } from './colors';
import { movvoTypography } from './typography';

/** Official Movvo design system — single source for web / landing / mobile. */
export const DesignTokens = {
  colors: {
    dark: movvoColorsDark,
    light: movvoColorsLight,
  },
  typography: movvoTypography,
  spacing: {
    4: 4,
    8: 8,
    12: 12,
    16: 16,
    24: 24,
    32: 32,
    40: 40,
    48: 48,
    64: 64,
  },
  radius: {
    sm: 8,
    md: 10,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  shadow: {
    card: '0 4px 24px rgba(0, 0, 0, 0.28)',
    cardHover: '0 8px 32px rgba(217, 4, 41, 0.18)',
    focus: '0 0 0 3px rgba(212, 175, 55, 0.28)',
    elev1: '0 1px 2px rgba(0,0,0,0.2)',
    elev2: '0 4px 12px rgba(0,0,0,0.28)',
    elev3: '0 12px 40px rgba(0,0,0,0.4)',
  },
  elevation: {
    base: 0,
    raised: 1,
    overlay: 2,
    modal: 3,
  },
  motion: {
    fast: 150,
    normal: 200,
    slow: 400,
    hover: 150,
    dialog: 200,
    toast: 250,
    drawer: 300,
    sidebar: 250,
    page: 280,
    loading: 800,
    easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  },
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
    ultrawide: 1920,
  },
  zIndex: {
    base: 0,
    sticky: 20,
    dropdown: 40,
    sidebar: 50,
    overlay: 60,
    modal: 70,
    toast: 80,
    command: 90,
    max: 100,
  },
  opacity: {
    disabled: 0.45,
    muted: 0.7,
    hover: 0.9,
    overlay: 0.55,
  },
  icons: {
    sizes: { xs: 16, sm: 18, md: 20, lg: 24, xl: 32 } as const,
    stroke: 2,
  },
  charts: {
    revenue: '#22C55E',
    expense: '#EF4444',
    wellhub: '#3B82F6',
    totalPass: '#F97316',
    goal: '#D4AF37',
    checkins: '#D90429',
    workouts: '#F4D35E',
    finance: '#EF4444',
  },
  animation: {
    spin: 'movvo-spin 0.8s linear infinite',
    pulse: 'movvo-pulse 1.2s ease-in-out infinite',
    fadeIn: 'movvo-fade-in var(--motion-page) var(--motion-easing)',
  },
} as const;

export type DesignTokensType = typeof DesignTokens;
