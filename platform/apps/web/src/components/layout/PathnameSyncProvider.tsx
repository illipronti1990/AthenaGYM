'use client';

import { createContext, useContext, type ReactNode } from 'react';

const PathnameSyncContext = createContext('/app');

export function PathnameSyncProvider({
  initialPathname,
  children,
}: {
  initialPathname: string;
  children: ReactNode;
}) {
  return (
    <PathnameSyncContext.Provider value={initialPathname || '/app'}>
      {children}
    </PathnameSyncContext.Provider>
  );
}

export function useInitialPathname() {
  return useContext(PathnameSyncContext);
}
