import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { PipelineKanban } from '@/modules/sales/components/PipelineKanban';

export default async function SalesPipelinePage() {
  const accessToken = await requireAccessToken();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-sm text-zinc-600">Arraste o lead para mudar a etapa</p>
        </div>
        <Link href="/app/sales" className="text-sm text-[#A3001B] hover:underline">
          ← Comercial
        </Link>
      </div>
      <PipelineKanban accessToken={accessToken} />
    </div>
  );
}
