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
} from '@movvo/ui';
import { ThemeProvider } from '@/components/ThemeProvider';
import { BrandingProvider } from '@/components/BrandingProvider';
import { FeatureFlagsProvider } from '@/components/FeatureFlagsProvider';
import { QueryProvider } from '@/lib/query-client';
import { GlobalErrorListeners } from '@/components/ux/GlobalErrorListeners';
import { ConfirmProvider } from '@/components/ux/ConfirmProvider';

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
        <FeatureFlagsProvider>
          <QueryProvider>
            <AccessibilityProvider>
              <NetworkStatusProvider
                healthCheckUrl={`${API_URL.replace(/\/$/, '')}/health`}
                intervalMs={20_000}
              >
                <TooltipProvider>
                  <ToastProvider>
                    <ConfirmProvider>
                      <PerformanceMonitor
                        rumEndpoint={`${API_URL.replace(/\/$/, '')}/observability/rum`}
                      />
                      <GlobalErrorListeners />
                      <NetworkChrome>{children}</NetworkChrome>
                    </ConfirmProvider>
                  </ToastProvider>
                </TooltipProvider>
              </NetworkStatusProvider>
            </AccessibilityProvider>
          </QueryProvider>
        </FeatureFlagsProvider>
      </BrandingProvider>
    </ThemeProvider>
  );
}
