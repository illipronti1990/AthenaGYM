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
  resolveCompanyBranding,
  type Company,
  type ResolvedCompanyBranding,
} from '@athena/shared';
import { applyBrandingToDocument } from '@/lib/branding/applyBranding';

type BrandingCtx = {
  branding: ResolvedCompanyBranding;
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

  const branding = useMemo(
    () =>
      resolveCompanyBranding(
        company
          ? {
              name: company.name,
              logoUrl: company.logoUrl,
              faviconUrl: company.faviconUrl,
              primaryColor: company.primaryColor,
              secondaryColor: company.secondaryColor,
              backgroundLogin: company.backgroundLogin,
              theme: company.theme,
            }
          : null,
      ),
    [company],
  );

  useEffect(() => {
    applyBrandingToDocument(branding);
  }, [branding]);

  const value = useMemo(() => ({ branding, setCompany }), [branding]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBranding() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      branding: ATHENA_ACADEMIA_BRANDING,
      setCompany: () => undefined,
    };
  }
  return ctx;
}
