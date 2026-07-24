export type NotificationChannel = 'push' | 'email' | 'whatsapp' | 'sms' | 'internal';

export type SendNotificationInput = {
  to: string;
  title: string;
  body: string;
  channel: NotificationChannel;
  metadata?: Record<string, unknown>;
};

export type SendNotificationResult = {
  ok: boolean;
  provider: string;
  externalId?: string;
  message?: string;
};

export interface NotificationProvider {
  readonly name: string;
  readonly channel: NotificationChannel;
  send(input: SendNotificationInput): Promise<SendNotificationResult>;
}

export class StubPushProvider implements NotificationProvider {
  readonly name = 'stub-push';
  readonly channel: NotificationChannel = 'push';
  async send(input: SendNotificationInput): Promise<SendNotificationResult> {
    return { ok: true, provider: this.name, externalId: `push_${Date.now()}`, message: input.title };
  }
}

export class StubEmailProvider implements NotificationProvider {
  readonly name = 'stub-email';
  readonly channel: NotificationChannel = 'email';
  async send(input: SendNotificationInput): Promise<SendNotificationResult> {
    return { ok: true, provider: this.name, externalId: `email_${Date.now()}`, message: input.title };
  }
}

export class StubWhatsAppProvider implements NotificationProvider {
  readonly name = 'stub-whatsapp';
  readonly channel: NotificationChannel = 'whatsapp';
  async send(input: SendNotificationInput): Promise<SendNotificationResult> {
    return { ok: true, provider: this.name, externalId: `wa_${Date.now()}`, message: input.title };
  }
}

export function getNotificationProvider(channel: NotificationChannel): NotificationProvider {
  switch (channel) {
    case 'email':
      return new StubEmailProvider();
    case 'whatsapp':
      return new StubWhatsAppProvider();
    case 'sms':
      return new StubPushProvider();
    case 'push':
    case 'internal':
    default:
      return new StubPushProvider();
  }
}

/** Loyalty point rules */
export const LOYALTY_POINTS = {
  checkin: 10,
  workoutComplete: 20,
  referral: 100,
  earlyPayment: 50,
} as const;

export function loyaltyTier(points: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
  if (points >= 5000) return 'platinum';
  if (points >= 2000) return 'gold';
  if (points >= 500) return 'silver';
  return 'bronze';
}
