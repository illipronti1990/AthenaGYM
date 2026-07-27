import { headers } from 'next/headers';
import { requireAccessToken } from '@/lib/auth/token';
import { apiGetMe } from '@/services/api';
import { AppShell } from '@/components/AppShell';
import { CompanyBrandingSync } from '@/components/CompanyBrandingSync';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { SessionManager } from '@/modules/auth/SessionManager';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const accessToken = await requireAccessToken();
  const pathname = (await headers()).get('x-pathname') || '/app';
  let userName: string | null = null;
  let company = null as Awaited<ReturnType<typeof apiGetMe>>['companies'][number] | null;
  try {
    const me = await apiGetMe(accessToken);
    userName = me.profile.fullName || me.profile.email;
    const activeId = me.auth.companyId || me.profile.companyId;
    company =
      me.companies.find((c) => c.id === activeId) || me.companies[0] || null;
  } catch {
    userName = null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)]">
      <CompanyBrandingSync company={company} />
      <SessionManager />
      <AppShell accessToken={accessToken} userName={userName} initialPathname={pathname}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </AppShell>
    </div>
  );
}
