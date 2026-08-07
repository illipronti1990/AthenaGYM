'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ESTOQUE_LINKS } from '../utils/estoqueLinks';

export function EstoqueNav({ excludeCurrent = true }: { excludeCurrent?: boolean }) {
  const pathname = usePathname();
  return (
    <>
      {ESTOQUE_LINKS.filter(([, href]) => !excludeCurrent || href !== pathname).map(([label, href]) => (
        <Link key={href} href={href} className="movvo-chip-nav" data-testid={`estoque-nav-${href.split('/').pop()}`}>
          {label}
        </Link>
      ))}
    </>
  );
}
