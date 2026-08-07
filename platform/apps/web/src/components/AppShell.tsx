'use client';

import { useEffect } from 'react';
import { BottomNavigation } from '@movvo/ui';
import { Home, Settings, Dumbbell, LineChart } from 'lucide-react';
import { PathnameSyncProvider } from '@/components/layout/PathnameSyncProvider';
import { LayoutProvider, useLayout } from '@/components/layout/LayoutProvider';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { Footer } from '@/components/layout/Footer';
import { CommandPalette } from '@/components/search/CommandPalette';
import { PageTransition } from '@/components/ux/PageTransition';
import { AuthNavProvider, useAuthNav } from '@/components/auth/AuthNavProvider';
import { StudentRouteGuard } from '@/components/auth/StudentRouteGuard';
import { ProfessorRouteGuard } from '@/components/auth/ProfessorRouteGuard';
import { MovvoChatWidget } from '@/modules/bi/components/MovvoChatWidget';
import { useFeatureFlags } from '@/components/FeatureFlagsProvider';
import { useUiPreferences } from '@/hooks/useUiPreferences';
import { ProductTour } from '@/components/ux/ProductTour';

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
  const { studentOnly } = useAuthNav();
  const { enabled } = useFeatureFlags();
  const { prefs } = useUiPreferences();

  useEffect(() => {
    document.documentElement.classList.toggle('ui-dense', prefs.denseLayout);
    return () => document.documentElement.classList.remove('ui-dense');
  }, [prefs.denseLayout]);

  const bottomItems = studentOnly
    ? [
        { href: '/app/portal', label: 'Início', icon: Home, match: (p: string) => p === '/app/portal' },
        {
          href: '/app/portal/treinos',
          label: 'Treinos',
          icon: Dumbbell,
          match: (p: string) => p.startsWith('/app/portal/treinos'),
        },
        {
          href: '/app/portal/evolucao',
          label: 'Evolução',
          icon: LineChart,
          match: (p: string) => p.startsWith('/app/portal/evolucao'),
        },
        {
          href: '/app/profile',
          label: 'Perfil',
          icon: Settings,
          match: (p: string) => p.startsWith('/app/profile') || p.startsWith('/app/help'),
        },
      ]
    : undefined;

  return (
    <div
      className={`movvo-shell movvo-shell-px2 ${collapsed ? 'sidebar-collapsed' : ''}${prefs.denseLayout ? ' is-dense' : ''}${prefs.widgetsCompact ? ' widgets-compact' : ''}`}
    >
      <a href="#movvo-main-content" className="movvo-skip-link">
        Ir para o conteúdo
      </a>
      <StudentRouteGuard />
      <ProfessorRouteGuard />
      <Sidebar userName={userName} />
      <div className="movvo-main-column">
        <Topbar accessToken={accessToken} userName={userName} />
        <main id="movvo-main-content" className="movvo-main" tabIndex={-1}>
          <div className="movvo-main-inner">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
        <Footer />
      </div>
      <BottomNavigation items={bottomItems} />
      <CommandPalette accessToken={accessToken} />
      {!studentOnly ? <ProductTour /> : null}
      {enabled('ai') ? <MovvoChatWidget accessToken={accessToken} /> : null}
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
        <AuthNavProvider accessToken={accessToken}>
          <ShellInner accessToken={accessToken} userName={userName}>
            {children}
          </ShellInner>
        </AuthNavProvider>
      </LayoutProvider>
    </PathnameSyncProvider>
  );
}
