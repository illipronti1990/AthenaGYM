import { AppNav } from '@/components/AppNav';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { SessionManager } from '@/modules/auth/SessionManager';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SessionManager />
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  );
}
