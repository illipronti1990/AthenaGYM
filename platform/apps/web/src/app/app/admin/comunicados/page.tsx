import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { AnnouncementsPanel } from '@/modules/admin/AdminPanels';

export default async function Page() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'App', href: '/app' }, { label: 'Admin', href: '/app/admin/dashboard' }, { label: 'Comunicados' }]} />
      <div>
        <h1 className="movvo-title text-3xl">Mural interno</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Comunicados por público</p>
      </div>
      <AnnouncementsPanel accessToken={accessToken} />
    </div>
  );
}
