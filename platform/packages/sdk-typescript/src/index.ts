/**
 * Official Movvo TypeScript SDK — client for Public API.
 * Auth: OAuth2 client credentials or access token.
 */

export type MovvoSdkOptions = {
  baseUrl?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  fetchImpl?: typeof fetch;
};

export class MovvoApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(message);
    this.name = 'MovvoApiError';
  }
}

export type Page<T> = {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
};

export class MovvoClient {
  private accessToken: string | null;
  private readonly baseUrl: string;
  private readonly clientId?: string;
  private readonly clientSecret?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: MovvoSdkOptions = {}) {
    this.baseUrl = (opts.baseUrl || 'http://localhost:3001/api/v1/public').replace(/\/$/, '');
    this.clientId = opts.clientId;
    this.clientSecret = opts.clientSecret;
    this.accessToken = opts.accessToken || null;
    this.fetchImpl = opts.fetchImpl || fetch;
  }

  async authenticate(): Promise<string> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('clientId and clientSecret required for authenticate()');
    }
    const res = await this.fetchImpl(`${this.oauthBase()}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        grantType: 'client_credentials',
        clientId: this.clientId,
        clientSecret: this.clientSecret,
      }),
    });
    const text = await res.text();
    if (!res.ok) throw new MovvoApiError('OAuth token failed', res.status, text);
    const json = JSON.parse(text) as { accessToken: string };
    this.accessToken = json.accessToken;
    return this.accessToken;
  }

  private oauthBase(): string {
    // /api/v1/public → /api/v1
    return this.baseUrl.replace(/\/public$/, '');
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    if (!this.accessToken && this.clientId && this.clientSecret) {
      await this.authenticate();
    }
    if (!this.accessToken) throw new Error('Missing accessToken — call authenticate() first');

    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) throw new MovvoApiError(`${method} ${path} failed`, res.status, text);
    return text ? (JSON.parse(text) as T) : (undefined as T);
  }

  listStudents(params?: { page?: number; pageSize?: number }) {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    const qs = q.toString() ? `?${q}` : '';
    return this.request<Page<Record<string, unknown>>>('GET', `/alunos${qs}`);
  }

  listPlans() {
    return this.request<Record<string, unknown>[]>('GET', '/plans');
  }

  listUnits() {
    return this.request<Record<string, unknown>[]>('GET', '/units');
  }

  listWorkouts(params?: { page?: number }) {
    const qs = params?.page ? `?page=${params.page}` : '';
    return this.request<Page<Record<string, unknown>>>('GET', `/workouts${qs}`);
  }

  listPayments(params?: { page?: number }) {
    const qs = params?.page ? `?page=${params.page}` : '';
    return this.request<Page<Record<string, unknown>>>('GET', `/payments${qs}`);
  }

  createCheckin(body: { studentId: string; unitId?: string }) {
    return this.request<Record<string, unknown>>('POST', '/checkins', body);
  }

  createWebhook(body: { url: string; events: string[] }) {
    return this.request<Record<string, unknown>>('POST', '/webhooks', body);
  }
}
