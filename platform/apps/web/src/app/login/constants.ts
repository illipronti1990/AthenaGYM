import {
  ATHENA_ACADEMIA_BRANDING,
  ATHENA_PRODUCT_NAME,
  ATHENA_PRODUCT_VERSION,
} from '@athena/shared';

/** Login/demo always show Athena Academia (first client + case study). */
export const ATHENA_SLOGAN = ATHENA_ACADEMIA_BRANDING.slogan;
export const ATHENA_TENANT_NAME = ATHENA_ACADEMIA_BRANDING.displayName;
export const ATHENA_PRODUCT = ATHENA_PRODUCT_NAME;
export const ATHENA_VERSION = ATHENA_PRODUCT_VERSION;
export const ATHENA_YEAR = 2026;

export const LOGIN_FEATURES = [
  'Financeiro',
  'Check-in',
  'Agenda',
  'Treinos',
] as const;

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_MS = 5 * 60 * 1000;
export const LOGIN_ATTEMPTS_KEY = 'athena.login.attempts';
export const REMEMBER_KEY = 'athena.rememberEmail';
