export const API_CLIENT_CREATED = 'platform.api_client.created';
export const WEBHOOK_SUBSCRIBED = 'platform.webhook.subscribed';
export const WEBHOOK_DELIVERY_QUEUED = 'platform.webhook.delivery_queued';
export const PLUGIN_INSTALLED = 'platform.plugin.installed';
export const PLUGIN_REMOVED = 'platform.plugin.removed';
export const SANDBOX_CREATED = 'platform.sandbox.created';
export const PUBLIC_EVENT_FANOUT = 'platform.public_event.fanout';

export type ApiClientCreatedEvent = {
  companyId: string;
  clientId: string;
  environment: string;
};

export type WebhookDeliveryQueuedEvent = {
  companyId: string;
  deliveryId: string;
  subscriptionId: string;
  eventType: string;
};

export type PluginInstalledEvent = {
  companyId: string;
  pluginId: string;
  slug: string;
};

export type PublicEventFanoutEvent = {
  companyId: string;
  eventType: string;
  payload: Record<string, unknown>;
  environment: 'production' | 'sandbox';
};
