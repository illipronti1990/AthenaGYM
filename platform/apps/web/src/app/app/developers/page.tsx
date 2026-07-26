import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import {
  ApiClientsPanel,
  DeveloperOverview,
  SandboxPanel,
  WebhooksPanel,
} from '@/modules/platform/components/DeveloperPanels';

const links = [
  ['Marketplace', '/app/marketplace'],
  ['OpenAPI', 'http://localhost:3001/api/v1/docs'],
] as const;

export default async function DevelopersPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Portal do Desenvolvedor</h1>
          <p className="text-sm text-zinc-600">
            API pública, OAuth2, webhooks, sandbox e limites de uso
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded border border-zinc-300 px-3 py-1.5 hover:border-[#A3001B] hover:text-[#A3001B]"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <DeveloperOverview accessToken={accessToken} />
      <ApiClientsPanel accessToken={accessToken} />
      <WebhooksPanel accessToken={accessToken} />
      <SandboxPanel accessToken={accessToken} />
    </div>
  );
}
