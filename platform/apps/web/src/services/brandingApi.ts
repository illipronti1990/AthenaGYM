import type { ResolvedCompanyBranding } from '@movvo/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export type PublicBranding = {
  name: string;
  shortName: string;
  slogan: string;
  logo: string;
  favicon: string;
  colors: { primary: string; secondary: string };
  domain: string;
  url: string;
  aiName: string;
  version: string;
  buildLabel: string;
  assets: {
    logo: string;
    logoDark: string;
    logoLight: string;
    mark: string;
    favicon: string;
    faviconIco: string;
    aiMascot: string;
  };
  tenant: ResolvedCompanyBranding | null;
};

export const brandingApi = {
  async getPublic(companyId?: string | null): Promise<PublicBranding> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (companyId) headers['X-Company-Id'] = companyId;
    const res = await fetch(`${API_URL}/branding`, {
      headers,
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`/branding failed (${res.status}): ${await res.text()}`);
    }
    return res.json() as Promise<PublicBranding>;
  },
};
