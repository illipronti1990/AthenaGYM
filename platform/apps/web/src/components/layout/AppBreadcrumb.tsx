'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { House } from 'lucide-react';
import { breadcrumbForPath } from '@/config/navigation';
import { useInitialPathname } from './PathnameSyncProvider';
import { useStablePathname } from './useStablePathname';

export function AppBreadcrumb() {
  const initialPathname = useInitialPathname();
  const pathname = useStablePathname(initialPathname);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const items = breadcrumbForPath(hydrated ? pathname : initialPathname);

  return (
    <nav aria-label="Breadcrumb" className="movvo-breadcrumb" data-testid="app-breadcrumb">
      <ol>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`}>
              {i > 0 ? <span className="movvo-breadcrumb-sep">›</span> : null}
              {i === 0 ? (
                item.href && !isLast ? (
                  <Link href={item.href} className="movvo-breadcrumb-link" title="Dashboard">
                    <House size={14} aria-hidden />
                    <span className="sr-only">Dashboard</span>
                  </Link>
                ) : (
                  <span className="movvo-breadcrumb-current inline-flex items-center gap-1">
                    <House size={14} aria-hidden />
                    <span className="hidden sm:inline">Dashboard</span>
                  </span>
                )
              ) : item.href && !isLast ? (
                <Link href={item.href} className="movvo-breadcrumb-link">
                  {item.label}
                </Link>
              ) : isLast ? (
                <span className="movvo-breadcrumb-current">{item.label}</span>
              ) : (
                <span className="movvo-breadcrumb-link">{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
