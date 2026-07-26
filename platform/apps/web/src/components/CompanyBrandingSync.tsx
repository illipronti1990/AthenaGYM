'use client';

import { useEffect } from 'react';
import type { Company } from '@athena/shared';
import { useBranding } from '@/components/BrandingProvider';

/** Syncs authenticated company brand into BrandingProvider after /auth/me. */
export function CompanyBrandingSync({ company }: { company: Company | null }) {
  const { setCompany } = useBranding();
  useEffect(() => {
    setCompany(company);
  }, [company, setCompany]);
  return null;
}
