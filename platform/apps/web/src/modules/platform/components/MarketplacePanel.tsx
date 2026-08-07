'use client';

import { useEffect, useState } from 'react';
import type { MarketplaceInstallation, MarketplacePlugin } from '@movvo/shared';
import { platformApi } from '../services/platformApi';

export function MarketplacePanel({ accessToken }: { accessToken: string }) {
  const [plugins, setPlugins] = useState<MarketplacePlugin[]>([]);
  const [installs, setInstalls] = useState<MarketplaceInstallation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    const [p, i] = await Promise.all([
      platformApi.plugins(accessToken),
      platformApi.installations(accessToken),
    ]);
    setPlugins(p);
    setInstalls(i);
  };

  useEffect(() => {
    reload().catch((e: Error) => setError(e.message));
  }, [accessToken]);

  const install = async (pluginId: string) => {
    setError(null);
    try {
      await platformApi.installPlugin(accessToken, pluginId);
      await reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const remove = async (installationId: string) => {
    await platformApi.removePlugin(accessToken, installationId);
    await reload();
  };

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <section>
        <h2 className="mb-2 text-lg font-semibold">Plugins disponíveis</h2>
        <ul className="space-y-3" data-testid="plugins-list">
          {plugins.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3"
            >
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-zinc-600">{p.description}</p>
                <p className="text-xs text-zinc-500">
                  {p.publisher} · v{p.version} · {p.category}
                </p>
              </div>
              <button
                type="button"
                data-testid={`install-${p.slug}`}
                onClick={() => install(p.id)}
                className="rounded bg-[#A3001B] px-3 py-1.5 text-sm text-white"
              >
                Instalar
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-semibold">Instalações</h2>
        <ul className="space-y-2 text-sm" data-testid="installations-list">
          {installs.map((i) => (
            <li key={i.id} className="flex justify-between gap-2">
              <span>
                {i.plugin?.name || i.pluginId} · {i.status}
              </span>
              <button
                type="button"
                data-testid={`remove-${i.id}`}
                onClick={() => remove(i.id)}
                className="text-[#A3001B] underline"
              >
                Remover
              </button>
            </li>
          ))}
          {!installs.length && <li className="text-zinc-500">Nenhum plugin instalado</li>}
        </ul>
      </section>
    </div>
  );
}
