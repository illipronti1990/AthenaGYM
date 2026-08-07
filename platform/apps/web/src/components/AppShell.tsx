'use client';

import { useEffect } from 'react';
import { BottomNavigation } from '@athena/ui';
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
import { AthenaChatWidget } from '@/modules/bi/components/AthenaChatWidget';
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
      className={`athena-shell athena-shell-px2 ${collapsed ? 'sidebar-collapsed' : ''}${prefs.denseLayout ? ' is-dense' : ''}${prefs.widgetsCompact ? ' widgets-compact' : ''}`}
    >
      <a href="#athena-main-content" className="athena-skip-link">
        Ir para o conteúdo
      </a>
      <StudentRouteGuard />
      <ProfessorRouteGuard />
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
      <BottomNavigation items={bottomItems} />
      <CommandPalette accessToken={accessToken} />
      {!studentOnly ? <ProductTour /> : null}
      {enabled('ai') ? <AthenaChatWidget accessToken={accessToken} /> : null}
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
