import type {
  ApiClient,
  ApiClientCreated,
  ApiUsageSummary,
  MarketplaceInstallation,
  MarketplacePlugin,
  SandboxEnvironment,
  WebhookDelivery,
  WebhookSubscription,
  WebhookSubscriptionCreated,
} from '@movvo/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function apiFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    ...(init?.headers as Record<string, string>),
  };
  if (init?.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: 'no-store' });
  if (!res.ok) throw new Error(`${path} failed (${res.status}): ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const platformApi = {
  docs: (t: string) => apiFetch<Record<string, unknown>>('/platform/docs', t),
  usage: (t: string) => apiFetch<ApiUsageSummary>('/platform/usage', t),
  clients: (t: string) => apiFetch<ApiClient[]>('/platform/clients', t),
  createClient: (t: string, body: { name: string; scopes: string[]; environment?: string }) =>
    apiFetch<ApiClientCreated>('/platform/clients', t, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  webhooks: (t: string) => apiFetch<WebhookSubscription[]>('/platform/webhooks', t),
  createWebhook: (t: string, body: { url: string; events: string[] }) =>
    apiFetch<WebhookSubscriptionCreated>('/platform/webhooks', t, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  deliveries: (t: string) => apiFetch<WebhookDelivery[]>('/platform/webhooks/deliveries', t),
  sandboxes: (t: string) => apiFetch<SandboxEnvironment[]>('/platform/sandbox', t),
  createSandbox: (t: string, name: string) =>
    apiFetch<SandboxEnvironment>('/platform/sandbox', t, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  integrations: (t: string) =>
    apiFetch<{ category: string; name: string; status: string }[]>('/platform/integrations', t),
  plugins: (t: string) => apiFetch<MarketplacePlugin[]>('/marketplace/plugins', t),
  installations: (t: string) => apiFetch<MarketplaceInstallation[]>('/marketplace/installations', t),
  installPlugin: (t: string, pluginId: string) =>
    apiFetch<MarketplaceInstallation>(`/marketplace/plugins/${pluginId}/install`, t, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  removePlugin: (t: string, installationId: string) =>
    apiFetch<MarketplaceInstallation>(`/marketplace/installations/${installationId}/remove`, t, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
};
