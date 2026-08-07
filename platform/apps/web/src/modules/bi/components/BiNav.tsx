'use client';

import Link from 'next/link';
import { PageFilters } from '@movvo/ui';
import { useAuthNav } from '@/components/auth/AuthNavProvider';
import { isProfessorOnly } from '@/config/navAccess';
import { BI_LINKS } from '../utils/biLinks';

export function BiNav({ current }: { current?: string }) {
  const { auth } = useAuthNav();
  const professorOnly = isProfessorOnly(auth.roles);
  const links = professorOnly
    ? BI_LINKS.filter(([, href]) => href === '/app/bi/relatorios')
    : BI_LINKS;

  return (
    <PageFilters>
      {links
        .filter(([, href]) => href !== current)
        .map(([label, href]) => (
          <Link key={href} href={href} className="movvo-chip-nav">
            {label}
          </Link>
        ))}
    </PageFilters>
  );
}
