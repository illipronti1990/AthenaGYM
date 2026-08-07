/** Integration Hub provider contracts — Sprint 9 + G-6 benefit partners */

export * from './benefit-partners';

export interface PaymentHubProvider {
  readonly name: string;
  createCustomer(input: { email: string; name: string; document?: string }): Promise<{ id: string }>;
  createSubscription(input: {
    customerId: string;
    planId: string;
    amount: number;
  }): Promise<{ id: string; status: string }>;
  createCharge(input: {
    customerId: string;
    amount: number;
    description: string;
  }): Promise<{ id: string; status: string }>;
  refund(chargeId: string, amount?: number): Promise<{ id: string; status: string }>;
  cancelSubscription(subscriptionId: string): Promise<{ id: string; status: string }>;
  webhook(headers: Record<string, string>, rawBody: string): Promise<{ event: string; data: unknown }>;
}

export class StubPaymentHubProvider implements PaymentHubProvider {
  readonly name = 'stub';

  async createCustomer(input: { email: string; name: string }) {
    return { id: `cust_${Buffer.from(input.email).toString('hex').slice(0, 12)}` };
  }

  async createSubscription(input: { customerId: string; planId: string; amount: number }) {
    return { id: `sub_${input.planId}`, status: 'active' };
  }

  async createCharge(input: { customerId: string; amount: number; description: string }) {
    return { id: `ch_${Date.now()}`, status: 'pending' };
  }

  async refund(chargeId: string) {
    return { id: `rf_${chargeId}`, status: 'refunded' };
  }

  async cancelSubscription(subscriptionId: string) {
    return { id: subscriptionId, status: 'cancelled' };
  }

  async webhook(_headers: Record<string, string>, rawBody: string) {
    return { event: 'payment.stub', data: JSON.parse(rawBody || '{}') };
  }
}

export function getPaymentHubProvider(name: string): PaymentHubProvider {
  // Future: mercado_pago | asaas | stripe | pagseguro | pagar_me | iugu
  return new StubPaymentHubProvider();
}

export interface WearableProvider {
  readonly name: string;
  syncSteps(userId: string, from: string, to: string): Promise<{ steps: number }>;
  syncHeartRate(userId: string, from: string, to: string): Promise<{ avgBpm: number }>;
  syncCalories(userId: string, from: string, to: string): Promise<{ calories: number }>;
  syncWorkout(userId: string, workoutId: string): Promise<{ synced: boolean }>;
}

export class StubWearableProvider implements WearableProvider {
  readonly name = 'stub';

  async syncSteps() {
    return { steps: 0 };
  }
  async syncHeartRate() {
    return { avgBpm: 0 };
  }
  async syncCalories() {
    return { calories: 0 };
  }
  async syncWorkout() {
    return { synced: true };
  }
}

export function getWearableProvider(name: string): WearableProvider {
  // Future: apple_health | google_fit | garmin | fitbit | samsung_health
  return new StubWearableProvider();
}

export interface AccountingProvider {
  readonly name: string;
  sendInvoice(input: { externalId: string; amount: number; customerId: string }): Promise<{ id: string }>;
  syncCustomers(): Promise<{ synced: number }>;
  syncPayments(): Promise<{ synced: number }>;
}

export class StubAccountingProvider implements AccountingProvider {
  readonly name = 'stub';
  async sendInvoice(input: { externalId: string }) {
    return { id: `inv_${input.externalId}` };
  }
  async syncCustomers() {
    return { synced: 0 };
  }
  async syncPayments() {
    return { synced: 0 };
  }
}

export function getAccountingProvider(name: string): AccountingProvider {
  // Future: conta_azul | omie | tiny | bling | sap_b1
  return new StubAccountingProvider();
}

export interface MessagingProvider {
  readonly name: string;
  sendEmail(input: { to: string; subject: string; body: string }): Promise<{ id: string }>;
  sendSMS(input: { to: string; body: string }): Promise<{ id: string }>;
  sendWhatsApp(input: { to: string; body: string }): Promise<{ id: string }>;
  sendPush(input: { deviceToken: string; title: string; body: string }): Promise<{ id: string }>;
}

export class StubMessagingProvider implements MessagingProvider {
  readonly name = 'stub';
  async sendEmail() {
    return { id: `email_${Date.now()}` };
  }
  async sendSMS() {
    return { id: `sms_${Date.now()}` };
  }
  async sendWhatsApp() {
    return { id: `wa_${Date.now()}` };
  }
  async sendPush() {
    return { id: `push_${Date.now()}` };
  }
}

export function getMessagingProvider(name: string): MessagingProvider {
  // Future: twilio | meta_whatsapp | firebase | aws_ses | sendgrid
  return new StubMessagingProvider();
}

export type ConnectorCategory = 'payments' | 'accounting' | 'wearables' | 'crm' | 'marketing';

export type ConnectorDescriptor = {
  category: ConnectorCategory;
  name: string;
  status: 'available' | 'planned';
};

export const INTEGRATION_CATALOG: ConnectorDescriptor[] = [
  { category: 'payments', name: 'mercado_pago', status: 'planned' },
  { category: 'payments', name: 'asaas', status: 'available' },
  { category: 'payments', name: 'stripe', status: 'planned' },
  { category: 'payments', name: 'pagseguro', status: 'planned' },
  { category: 'payments', name: 'pagar_me', status: 'planned' },
  { category: 'payments', name: 'iugu', status: 'planned' },
  { category: 'accounting', name: 'conta_azul', status: 'planned' },
  { category: 'accounting', name: 'omie', status: 'planned' },
  { category: 'accounting', name: 'tiny', status: 'planned' },
  { category: 'accounting', name: 'bling', status: 'planned' },
  { category: 'accounting', name: 'sap_b1', status: 'planned' },
  { category: 'wearables', name: 'apple_health', status: 'planned' },
  { category: 'wearables', name: 'google_fit', status: 'planned' },
  { category: 'wearables', name: 'garmin', status: 'planned' },
  { category: 'wearables', name: 'fitbit', status: 'planned' },
  { category: 'wearables', name: 'samsung_health', status: 'planned' },
  { category: 'crm', name: 'hubspot', status: 'planned' },
  { category: 'marketing', name: 'rd_station', status: 'planned' },
];
