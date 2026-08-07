'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthNav } from '@/components/auth/AuthNavProvider';
import { isProfessorBlockedPath, isProfessorOnly } from '@/config/navAccess';

/** Blocks BI dashboards for professor — Exportações only. */
export function ProfessorRouteGuard() {
  const pathname = usePathname() || '/app';
  const router = useRouter();
  const { loading, auth } = useAuthNav();
  const professorOnly = isProfessorOnly(auth.roles);

  useEffect(() => {
    if (loading || !professorOnly) return;
    if (isProfessorBlockedPath(pathname)) {
      router.replace('/app/bi/relatorios');
    }
  }, [loading, professorOnly, pathname, router]);

  return null;
}
