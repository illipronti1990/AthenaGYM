'use client';

import { Toaster, toast } from 'sonner';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';

export type ToastTone = 'ok' | 'error' | 'warn' | 'info';

const ToastCtx = createContext<{
  push: (message: string, tone?: ToastTone) => void;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const push = useCallback((message: string, tone: ToastTone = 'ok') => {
    if (tone === 'error') toast.error(message);
    else if (tone === 'warn') toast.warning(message);
    else if (tone === 'info') toast.info(message);
    else toast.success(message);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <Toaster
        theme="dark"
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{
          className: 'athena-sonner',
          duration: 4000,
        }}
      />
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast requires ToastProvider');
  return ctx;
}
