'use client';

import { BottomNavigation } from '@athena/ui';
import { PathnameSyncProvider } from '@/components/layout/PathnameSyncProvider';
import { LayoutProvider, useLayout } from '@/components/layout/LayoutProvider';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { Footer } from '@/components/layout/Footer';
import { CommandPalette } from '@/components/search/CommandPalette';
import { PageTransition } from '@/components/ux/PageTransition';

function ShellInner({
  accessToken,
  children,
  userName,
}: {
  accessToken: string;
  children: React.ReactNode;
  userName?: string | null;
}) {
  const { collapsed } = useLayout();

  return (
    <div className={`athena-shell athena-shell-px2 ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar userName={userName} />
      <div className="athena-main-column">
        <Topbar accessToken={accessToken} userName={userName} />
        <main id="athena-main-content" className="athena-main" tabIndex={-1}>
          <div className="athena-main-inner">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
        <Footer />
      </div>
      <BottomNavigation />
      <CommandPalette accessToken={accessToken} />
    </div>
  );
}

export function AppShell({
  accessToken,
  children,
  userName,
  initialPathname = '/app',
}: {
  accessToken: string;
  children: React.ReactNode;
  userName?: string | null;
  initialPathname?: string;
}) {
  return (
    <PathnameSyncProvider initialPathname={initialPathname}>
      <LayoutProvider>
        <ShellInner accessToken={accessToken} userName={userName}>
          {children}
        </ShellInner>
      </LayoutProvider>
    </PathnameSyncProvider>
  );
}
