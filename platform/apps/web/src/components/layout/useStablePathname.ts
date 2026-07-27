'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/** Keeps SSR and first client paint aligned via middleware `x-pathname`. */
export function useStablePathname(initialPathname: string) {
  const clientPath = usePathname();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return initialPathname || '/app';
  return clientPath || initialPathname || '/app';
}
