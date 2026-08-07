import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card } from '@athena/ui';

export default async function Page() {
  await requireAccessToken();
  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'App', href: '/app' }, { label: 'Platform' }, { label: 'Ambientes' }]} />
      <h1 className="athena-title text-3xl">Ambientes</h1>
      <div className="grid gap-3 md:grid-cols-3" data-testid="saas-environments">
        {['development', 'homologation', 'production'].map((e) => (
          <Card key={e}>
            <h3 className="athena-title text-base">{e}</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">Configurações independentes (API clients sandbox/production + saas_environment_settings).</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
