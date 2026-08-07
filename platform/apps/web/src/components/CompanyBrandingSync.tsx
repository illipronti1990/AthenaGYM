'use client';

import { useEffect } from 'react';
import type { Company } from '@athena/shared';
import { useBranding } from '@/components/BrandingProvider';

/**
 * Syncs authenticated company brand into BrandingProvider after /auth/me.
 * Propagates logoUrl, colors, favicon, and backgroundLogin so shell consumers
 * can read `useBranding().logoUrl` / CSS `--brand-logo-url`.
 */
export function CompanyBrandingSync({ company }: { company: Company | null }) {
  const { setCompany } = useBranding();
  useEffect(() => {
    setCompany(company);
  }, [company, setCompany]);
  return null;
}
