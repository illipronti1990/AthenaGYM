'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthNav } from '@/components/auth/AuthNavProvider';
import { isStudentBlockedPath } from '@/config/navAccess';

/** Keeps student-only sessions inside the portal surface. */
export function StudentRouteGuard() {
  const pathname = usePathname() || '/app';
  const router = useRouter();
  const { loading, studentOnly } = useAuthNav();

  useEffect(() => {
    if (loading || !studentOnly) return;
    if (isStudentBlockedPath(pathname)) {
      router.replace('/app/portal');
    }
  }, [loading, studentOnly, pathname, router]);

  return null;
}
