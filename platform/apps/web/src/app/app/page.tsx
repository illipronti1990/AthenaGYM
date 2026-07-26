import { requireAccessToken } from '@/lib/auth/token';
import { OpsDashboardPanel } from '@/modules/settings/components/OpsDashboardPanel';
import { Breadcrumb } from '@athena/ui';

export default async function AppHomePage() {
  const accessToken = await requireAccessToken();

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'App', href: '/app' }, { label: 'Hoje' }]} />
      <div>
        <h1 className="athena-title text-3xl">Hoje</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Visão operacional · use Ctrl+K para pesquisar
        </p>
      </div>
      <OpsDashboardPanel accessToken={accessToken} />
    </div>
  );
}
