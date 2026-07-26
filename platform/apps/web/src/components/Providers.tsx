'use client';

import {
  AccessibilityProvider,
  NetworkStatusProvider,
  OfflineBanner,
  PerformanceMonitor,
  ReconnectOverlay,
  ToastProvider,
  TooltipProvider,
  useNetworkStatus,
} from '@athena/ui';
import { ThemeProvider } from '@/components/ThemeProvider';
import { BrandingProvider } from '@/components/BrandingProvider';
import { QueryProvider } from '@/lib/query-client';
import { GlobalErrorListeners } from '@/components/ux/GlobalErrorListeners';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function NetworkChrome({ children }: { children: React.ReactNode }) {
  const { online } = useNetworkStatus();
  return (
    <>
      <OfflineBanner online={online} />
      <ReconnectOverlay />
      {children}
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider initialTheme="system">
      <BrandingProvider>
        <QueryProvider>
          <AccessibilityProvider>
            <NetworkStatusProvider
              healthCheckUrl={`${API_URL.replace(/\/$/, '')}/health`}
              intervalMs={20_000}
            >
              <TooltipProvider>
                <ToastProvider>
                  <PerformanceMonitor />
                  <GlobalErrorListeners />
                  <NetworkChrome>{children}</NetworkChrome>
                </ToastProvider>
              </TooltipProvider>
            </NetworkStatusProvider>
          </AccessibilityProvider>
        </QueryProvider>
      </BrandingProvider>
    </ThemeProvider>
  );
}
