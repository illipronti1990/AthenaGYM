import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { PipelineKanban } from '@/modules/sales/components/PipelineKanban';

export default async function SalesPipelinePage() {
  const accessToken = await requireAccessToken();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="athena-title text-3xl">Pipeline</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Arraste o lead para mudar a etapa</p>
        </div>
        <Link href="/app/sales" className="athena-link text-sm text-[var(--gold)]">
          ← Comercial
        </Link>
      </div>
      <PipelineKanban accessToken={accessToken} />
    </div>
  );
}
