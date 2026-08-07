import type { ResolvedCompanyBranding } from './types';

/** Product brand — Movvo ERP (not tenant). */
export const MOVVO_PRODUCT = {
  name: 'Movvo ERP',
  shortName: 'Movvo',
  slogan: 'Movimente sua gestão.',
  domain: 'movvoerp.com.br',
  url: 'https://movvoerp.com.br',
  mission:
    'Facilitar a gestão das academias através de tecnologia moderna, simples e inteligente.',
  vision: 'Ser o principal ERP para academias do Brasil.',
  values: [
    'Simplicidade',
    'Performance',
    'Segurança',
    'Inovação',
    'Inteligência',
    'Confiabilidade',
  ] as const,
  aiName: 'Movvo AI',
  version: '0.7.0-beta',
  buildLabel: '2026.08',
  supportEmail: 'suporte@movvoerp.com.br',
  og: {
    title: 'Movvo ERP',
    description: 'Movimente sua gestão.',
    imagePath: '/brand/social-preview.png',
  },
  assets: {
    logo: '/brand/logo.svg',
    logoDark: '/brand/logo-dark.svg',
    logoLight: '/brand/logo-light.svg',
    mark: '/brand/logo-mark.svg',
    favicon: '/brand/favicon.svg',
    faviconIco: '/brand/favicon.ico',
    aiMascot: '/brand/movvo-ai.svg',
  },
  colors: {
    primary: '#D90429',
    secondary: '#D4AF37',
  },
} as const;

/**
 * Demo tenant — first real client. Product is Movvo ERP; this is the academy brand.
 */
export const ATHENA_ACADEMIA_BRANDING: ResolvedCompanyBranding = {
  displayName: 'Athena Academia',
  logoUrl: MOVVO_PRODUCT.assets.logo,
  faviconUrl: MOVVO_PRODUCT.assets.favicon,
  primaryColor: MOVVO_PRODUCT.colors.primary,
  secondaryColor: MOVVO_PRODUCT.colors.secondary,
  backgroundLogin: 'movvo-red',
  theme: 'movvo',
  slogan: MOVVO_PRODUCT.slogan,
};

/** @deprecated Use MOVVO_PRODUCT.name */
export const ATHENA_PRODUCT_NAME = MOVVO_PRODUCT.name;
/** @deprecated Use MOVVO_PRODUCT.version */
export const ATHENA_PRODUCT_VERSION = MOVVO_PRODUCT.version;

export function resolveCompanyBranding(input?: {
  name?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  backgroundLogin?: string | null;
  theme?: string | null;
  slogan?: string | null;
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
    slogan: input.slogan?.trim() || base.slogan,
  };
}
