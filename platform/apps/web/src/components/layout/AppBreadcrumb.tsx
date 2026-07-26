'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House } from 'lucide-react';
import { breadcrumbForPath } from '@/config/navigation';

export function AppBreadcrumb() {
  const pathname = usePathname() || '/app';
  const items = breadcrumbForPath(pathname);

  return (
    <nav aria-label="Breadcrumb" className="athena-breadcrumb" data-testid="app-breadcrumb">
      <ol>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`}>
              {i > 0 ? <span className="athena-breadcrumb-sep">›</span> : null}
              {i === 0 ? (
                item.href && !isLast ? (
                  <Link href={item.href} className="athena-breadcrumb-link" title="Dashboard">
                    <House size={14} aria-hidden />
                    <span className="sr-only">Dashboard</span>
                  </Link>
                ) : (
                  <span className="athena-breadcrumb-current inline-flex items-center gap-1">
                    <House size={14} aria-hidden />
                    <span className="hidden sm:inline">Dashboard</span>
                  </span>
                )
              ) : item.href && !isLast ? (
                <Link href={item.href} className="athena-breadcrumb-link">
                  {item.label}
                </Link>
              ) : (
                <span className="athena-breadcrumb-current">{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
