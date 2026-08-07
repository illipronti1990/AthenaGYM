import {
  ATHENA_ACADEMIA_BRANDING,
  MOVVO_PRODUCT,
} from '@movvo/shared';

/** Product is Movvo; demo tenant remains Athena Academia. */
export const PRODUCT_NAME = MOVVO_PRODUCT.name;
export const PRODUCT_SLOGAN = MOVVO_PRODUCT.slogan;
export const PRODUCT_VERSION = MOVVO_PRODUCT.version;
export const TENANT_DEMO_NAME = ATHENA_ACADEMIA_BRANDING.displayName;
export const PRODUCT_YEAR = 2026;

export const LOGIN_FEATURES = [
  'Financeiro e caixa',
  'Check-in e acesso',
  'Agenda e aulas',
  'Treinos e evolução',
  'Estoque e PDV',
  'BI e Movvo AI',
] as const;

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_MS = 5 * 60 * 1000;
export const LOGIN_ATTEMPTS_KEY = 'movvo.login.attempts';
export const REMEMBER_KEY = 'movvo.rememberEmail';
