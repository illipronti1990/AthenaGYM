import { AppShell } from '@/components/AppShell';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { SessionManager } from '@/modules/auth/SessionManager';
import { requireAccessToken } from '@/lib/auth/token';
import { apiGetMe } from '@/services/api';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const accessToken = await requireAccessToken();
  let userName: string | null = null;
  try {
    const me = await apiGetMe(accessToken);
    userName = me.profile.fullName || me.profile.email;
  } catch {
    userName = null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)]">
      <SessionManager />
      <AppShell accessToken={accessToken} userName={userName}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </AppShell>
    </div>
  );
}
