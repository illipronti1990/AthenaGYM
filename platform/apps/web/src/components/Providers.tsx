'use client';

import { OfflineBanner, ToastProvider, TooltipProvider } from '@athena/ui';
import { ThemeProvider } from '@/components/ThemeProvider';
import { QueryProvider } from '@/lib/query-client';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

function OfflineGate({ children }: { children: React.ReactNode }) {
  const online = useOnlineStatus();
  return (
    <>
      <OfflineBanner online={online} />
      {children}
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider initialTheme="dark">
      <QueryProvider>
        <TooltipProvider>
          <ToastProvider>
            <OfflineGate>{children}</OfflineGate>
          </ToastProvider>
        </TooltipProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
