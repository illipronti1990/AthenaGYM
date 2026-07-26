'use client';

import Link from 'next/link';

export function Breadcrumb({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 text-sm text-zinc-500">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1">
            {i > 0 && <span>/</span>}
            {item.href ? (
              <Link href={item.href} className="hover:text-[#A3001B]">
                {item.label}
              </Link>
            ) : (
              <span className="text-zinc-800 dark:text-zinc-200">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
