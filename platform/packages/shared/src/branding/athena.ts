import type { ResolvedCompanyBranding } from './types';

/**
 * Athena Academia — first real client + demo environment.
 * Product name remains ATHENA ERP; this is the tenant brand.
 */
export const ATHENA_ACADEMIA_BRANDING: ResolvedCompanyBranding = {
  displayName: 'Athena Academia',
  logoUrl: '/brand/logo-gold.svg',
  faviconUrl: '/brand/favicon.svg',
  primaryColor: '#B10018',
  secondaryColor: '#D4AF37',
  backgroundLogin: 'athena-red',
  theme: 'athena',
  slogan: 'Gestão Inteligente para Academias',
};

export const ATHENA_PRODUCT_NAME = 'ATHENA ERP';
export const ATHENA_PRODUCT_VERSION = '1.0.0';

export function resolveCompanyBranding(input?: {
  name?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  backgroundLogin?: string | null;
  theme?: string | null;
} | null): ResolvedCompanyBranding {
  const base = ATHENA_ACADEMIA_BRANDING;
  if (!input) return { ...base };
  return {
    displayName: input.name?.trim() || base.displayName,
    logoUrl: input.logoUrl || base.logoUrl,
    faviconUrl: input.faviconUrl || base.faviconUrl,
    primaryColor: input.primaryColor || base.primaryColor,
    secondaryColor: input.secondaryColor || base.secondaryColor,
    backgroundLogin: input.backgroundLogin || base.backgroundLogin,
    theme: input.theme || base.theme,
    slogan: base.slogan,
  };
}
