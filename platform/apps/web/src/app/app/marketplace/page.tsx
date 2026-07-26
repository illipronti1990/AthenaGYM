import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { MarketplacePanel } from '@/modules/platform/components/MarketplacePanel';

export default async function MarketplacePage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Marketplace</h1>
          <p className="text-sm text-zinc-600">Instale, configure e remova plugins sem alterar o núcleo</p>
        </div>
        <Link
          href="/app/developers"
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:border-[#A3001B] hover:text-[#A3001B]"
        >
          Portal do Desenvolvedor
        </Link>
      </div>
      <MarketplacePanel accessToken={accessToken} />
    </div>
  );
}
