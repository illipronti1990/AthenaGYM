'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  ATHENA_ACADEMIA_BRANDING,
  MOVVO_PRODUCT,
  resolveCompanyBranding,
} from '@athena/shared/branding/athena';
import type { Company, ResolvedCompanyBranding } from '@athena/shared';
import { applyBrandingToDocument } from '@/lib/branding/applyBranding';
import { brandingApi, type PublicBranding } from '@/services/brandingApi';

type BrandingCtx = {
  branding: ResolvedCompanyBranding;
  /** Convenience alias for shell consumers (Sidebar, Topbar, Footer). */
  logoUrl: string;
  product: PublicBranding | null;
  setCompany: (company: Company | null) => void;
};

const Ctx = createContext<BrandingCtx | null>(null);

export function BrandingProvider({
  children,
  initialCompany,
}: {
  children: ReactNode;
  /** When known (authenticated shell), apply company brand immediately. */
  initialCompany?: Company | null;
}) {
  const [company, setCompany] = useState<Company | null>(initialCompany || null);
  const [product, setProduct] = useState<PublicBranding | null>(null);

  useEffect(() => {
    let alive = true;
    void brandingApi
      .getPublic(company?.id)
      .then((b) => {
        if (alive) setProduct(b);
      })
      .catch(() => {
        if (alive) {
          setProduct({
            name: MOVVO_PRODUCT.name,
            shortName: MOVVO_PRODUCT.shortName,
            slogan: MOVVO_PRODUCT.slogan,
            logo: MOVVO_PRODUCT.assets.logo,
            favicon: MOVVO_PRODUCT.assets.favicon,
            colors: { ...MOVVO_PRODUCT.colors },
            domain: MOVVO_PRODUCT.domain,
            url: MOVVO_PRODUCT.url,
            aiName: MOVVO_PRODUCT.aiName,
            version: MOVVO_PRODUCT.version,
            buildLabel: MOVVO_PRODUCT.buildLabel,
            assets: { ...MOVVO_PRODUCT.assets },
            tenant: null,
          });
        }
      });
    return () => {
      alive = false;
    };
  }, [company?.id]);

  const branding = useMemo(() => {
    if (company) {
      return resolveCompanyBranding({
        name: company.name,
        logoUrl: company.logoUrl,
        faviconUrl: company.faviconUrl,
        primaryColor: company.primaryColor,
        secondaryColor: company.secondaryColor,
        backgroundLogin: company.backgroundLogin,
        theme: company.theme,
      });
    }
    if (product?.tenant) return product.tenant;
    return resolveCompanyBranding(null);
  }, [company, product]);

  useEffect(() => {
    applyBrandingToDocument(branding);
  }, [branding]);

  const value = useMemo(
    () => ({
      branding,
      logoUrl: branding.logoUrl,
      product,
      setCompany,
    }),
    [branding, product],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBranding() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      branding: ATHENA_ACADEMIA_BRANDING,
      logoUrl: ATHENA_ACADEMIA_BRANDING.logoUrl,
      product: null,
      setCompany: () => undefined,
    };
  }
  return ctx;
}
