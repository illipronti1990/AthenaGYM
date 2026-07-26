export const OAUTH_SCOPES = [
  'students.read',
  'students.write',
  'finance.read',
  'payments.create',
  'workouts.read',
  'crm.read',
  'analytics.read',
  'webhooks.manage',
  'checkins.create',
] as const;

export type OauthScope = (typeof OAUTH_SCOPES)[number];

export type ApiClientStatus = 'active' | 'suspended' | 'revoked';
export type PlatformEnvironment = 'production' | 'sandbox';

export type ApiClient = {
  id: string;
  companyId: string;
  name: string;
  clientId: string;
  scopes: string[];
  status: ApiClientStatus;
  environment: PlatformEnvironment;
  ipAllowlist: string[];
  rateLimitPerMinute: number;
  rateLimitPerDay: number;
  lastUsedAt: string | null;
  createdAt: string;
};

export type ApiClientCreated = ApiClient & {
  clientSecret: string;
};

export type OauthTokenResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  scope: string;
};

export type WebhookSubscription = {
  id: string;
  companyId: string;
  apiClientId: string | null;
  url: string;
  secretHint: string;
  events: string[];
  status: 'active' | 'paused' | 'disabled';
  environment: PlatformEnvironment;
  createdAt: string;
};

export type WebhookSubscriptionCreated = WebhookSubscription & {
  secret: string;
};

export type WebhookDelivery = {
  id: string;
  companyId: string;
  subscriptionId: string;
  eventType: string;
  status: 'pending' | 'delivering' | 'delivered' | 'failed' | 'dead';
  attempts: number;
  nextAttemptAt: string;
  lastStatusCode: number | null;
  lastError: string | null;
  responseMs: number | null;
  deliveredAt: string | null;
  createdAt: string;
};

export type MarketplacePlugin = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  version: string;
  publisher: string;
  category: string;
  permissions: string[];
  manifest: Record<string, unknown>;
  status: string;
};

export type MarketplaceInstallation = {
  id: string;
  companyId: string;
  pluginId: string;
  plugin?: MarketplacePlugin;
  status: 'installed' | 'configured' | 'disabled' | 'removed';
  config: Record<string, unknown>;
  installedAt: string;
};

export type SandboxEnvironment = {
  id: string;
  companyId: string;
  name: string;
  status: 'active' | 'resetting' | 'disabled';
  mockData: Record<string, unknown>;
  createdAt: string;
};

export type ApiUsageSummary = {
  totalCalls: number;
  errorCount: number;
  avgLatencyMs: number;
  byEndpoint: { endpoint: string; count: number; avgLatencyMs: number }[];
};

export type PublicApiContext = {
  companyId: string;
  clientId: string;
  apiClientDbId: string;
  scopes: string[];
  environment: PlatformEnvironment;
};

/** Public domain event names exposed to plugins / webhooks */
export const PUBLIC_DOMAIN_EVENTS = [
  'student.created',
  'student.updated',
  'payment.confirmed',
  'checkin.created',
  'contract.signed',
  'assessment.completed',
  'workout.published',
  'lead.converted',
] as const;

export type PublicDomainEvent = (typeof PUBLIC_DOMAIN_EVENTS)[number];

/** Webhook retry delays in minutes: 1 → 5 → 15 → 60 → 1440 */
export const WEBHOOK_RETRY_MINUTES = [1, 5, 15, 60, 1440] as const;
