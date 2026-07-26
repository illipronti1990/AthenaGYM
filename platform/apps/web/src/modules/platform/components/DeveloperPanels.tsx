'use client';

import { useEffect, useState } from 'react';
import type { ApiClient, ApiUsageSummary, SandboxEnvironment, WebhookSubscription } from '@athena/shared';
import { OAUTH_SCOPES } from '@athena/shared';
import { platformApi } from '../services/platformApi';

export function DeveloperOverview({ accessToken }: { accessToken: string }) {
  const [docs, setDocs] = useState<Record<string, unknown> | null>(null);
  const [usage, setUsage] = useState<ApiUsageSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([platformApi.docs(accessToken), platformApi.usage(accessToken)])
      .then(([d, u]) => {
        setDocs(d);
        setUsage(u);
      })
      .catch((e: Error) => setError(e.message));
  }, [accessToken]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!docs || !usage) return <p className="text-sm text-zinc-500">Carregando portal…</p>;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">API pública</h2>
        <p className="text-sm text-zinc-600">
          Base: <code>{String(docs.basePath)}</code> · Gateway:{' '}
          <code>{String(docs.gatewayAlias)}</code> · OAuth: <code>{String(docs.oauth)}</code>
        </p>
        <ul className="list-inside list-disc text-sm text-zinc-700">
          {(docs.endpoints as string[] | undefined)?.map((e) => (
            <li key={e}>
              <code>{e}</code>
            </li>
          ))}
        </ul>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Consumo (7 dias)</h2>
        <p className="text-sm text-zinc-700">
          {usage.totalCalls} chamadas · {usage.errorCount} erros · latência média{' '}
          {usage.avgLatencyMs} ms
        </p>
      </section>
    </div>
  );
}

export function ApiClientsPanel({ accessToken }: { accessToken: string }) {
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [name, setName] = useState('Minha integração');
  const [scopes, setScopes] = useState<string[]>(['students.read']);
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = () =>
    platformApi
      .clients(accessToken)
      .then(setClients)
      .catch((e: Error) => setError(e.message));

  useEffect(() => {
    reload();
  }, [accessToken]);

  const create = async () => {
    setError(null);
    try {
      const created = await platformApi.createClient(accessToken, {
        name,
        scopes,
        environment: 'sandbox',
      });
      setSecret(created.clientSecret);
      await reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const toggleScope = (s: string) => {
    setScopes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Aplicações / API Keys</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {secret && (
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
          Client secret (copie agora): <code data-testid="client-secret">{secret}</code>
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Nome
          <input
            data-testid="client-name"
            className="rounded border border-zinc-300 px-2 py-1.5"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button
          type="button"
          data-testid="create-client"
          onClick={create}
          className="rounded bg-[#A3001B] px-4 py-2 text-sm text-white"
        >
          Criar aplicação
        </button>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {OAUTH_SCOPES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => toggleScope(s)}
            className={`rounded border px-2 py-1 ${
              scopes.includes(s) ? 'border-[#A3001B] text-[#A3001B]' : 'border-zinc-300'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <ul className="divide-y divide-zinc-200 text-sm" data-testid="clients-list">
        {clients.map((c) => (
          <li key={c.id} className="flex justify-between py-2">
            <span>
              {c.name} · <code>{c.clientId}</code>
            </span>
            <span className="text-zinc-500">
              {c.environment} · {c.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WebhooksPanel({ accessToken }: { accessToken: string }) {
  const [hooks, setHooks] = useState<WebhookSubscription[]>([]);
  const [url, setUrl] = useState('https://example.com/hooks/athena');
  const [secret, setSecret] = useState<string | null>(null);

  useEffect(() => {
    platformApi.webhooks(accessToken).then(setHooks).catch(() => setHooks([]));
  }, [accessToken]);

  const create = async () => {
    const created = await platformApi.createWebhook(accessToken, {
      url,
      events: ['student.created', 'payment.confirmed', 'checkin.created'],
    });
    setSecret(created.secret);
    setHooks(await platformApi.webhooks(accessToken));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Webhooks</h2>
      {secret && (
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
          Signing secret: <code>{secret}</code>
        </p>
      )}
      <div className="flex gap-2">
        <input
          data-testid="webhook-url"
          className="flex-1 rounded border border-zinc-300 px-2 py-1.5 text-sm"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          type="button"
          data-testid="create-webhook"
          onClick={create}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:border-[#A3001B]"
        >
          Assinar
        </button>
      </div>
      <ul className="text-sm">
        {hooks.map((h) => (
          <li key={h.id}>
            {h.url} · {h.events.join(', ')}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SandboxPanel({ accessToken }: { accessToken: string }) {
  const [items, setItems] = useState<SandboxEnvironment[]>([]);

  useEffect(() => {
    platformApi.sandboxes(accessToken).then(setItems).catch(() => setItems([]));
  }, [accessToken]);

  const create = async () => {
    await platformApi.createSandbox(accessToken, `sandbox-${Date.now()}`);
    setItems(await platformApi.sandboxes(accessToken));
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Sandbox</h2>
      <button
        type="button"
        data-testid="create-sandbox"
        onClick={create}
        className="rounded border border-zinc-300 px-3 py-1.5 text-sm"
      >
        Criar ambiente sandbox
      </button>
      <ul className="text-sm">
        {items.map((s) => (
          <li key={s.id}>
            {s.name} · {s.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
