import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SupabaseService } from '../../supabase/supabase.service';
import {
  CAMPAIGN_SENT,
  LOYALTY_POINTS_EARNED,
  MESSAGE_SENT,
  NOTIFICATION_SENT,
  type CampaignSentEvent,
  type MessageSentEvent,
  type NotificationSentEvent,
} from './engagement.events';

@Injectable()
export class EngagementEventListeners {
  private readonly log = new Logger(EngagementEventListeners.name);

  constructor(private readonly supabase: SupabaseService) {}

  private async outbox(companyId: string, eventType: string, payload: Record<string, unknown>) {
    try {
      await this.supabase.getAdmin().from('outbox_events').insert({
        company_id: companyId,
        event_type: eventType,
        payload,
        status: 'pending',
      });
    } catch (e) {
      this.log.warn(`outbox failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  @OnEvent(NOTIFICATION_SENT)
  async onNotification(e: NotificationSentEvent) {
    await this.outbox(e.companyId, NOTIFICATION_SENT, { ...e });
  }

  @OnEvent(MESSAGE_SENT)
  async onMessage(e: MessageSentEvent) {
    this.log.log(`message ${e.messageId} in ${e.conversationId}`);
    await this.outbox(e.companyId, MESSAGE_SENT, { ...e });
  }

  @OnEvent(CAMPAIGN_SENT)
  async onCampaign(e: CampaignSentEvent) {
    await this.outbox(e.companyId, CAMPAIGN_SENT, { ...e });
  }

  @OnEvent(LOYALTY_POINTS_EARNED)
  async onLoyalty(payload: Record<string, unknown>) {
    await this.outbox(String(payload.companyId), LOYALTY_POINTS_EARNED, payload);
  }
}
