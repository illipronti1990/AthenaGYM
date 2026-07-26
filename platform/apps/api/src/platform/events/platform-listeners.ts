import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { mapInternalToPublic } from '@athena/event-sdk';
import { PlatformService } from '../platform.service';
import {
  API_CLIENT_CREATED,
  PLUGIN_INSTALLED,
  PLUGIN_REMOVED,
  PUBLIC_EVENT_FANOUT,
  WEBHOOK_DELIVERY_QUEUED,
} from './platform.events';

@Injectable()
export class PlatformEventListeners {
  constructor(private readonly platform: PlatformService) {}

  @OnEvent(API_CLIENT_CREATED)
  onClientCreated(payload: { companyId: string; clientId: string }) {
    // observability hook — usage dashboard picks up from api_usage_logs
    void payload;
  }

  @OnEvent(WEBHOOK_DELIVERY_QUEUED)
  onDeliveryQueued(payload: { deliveryId: string }) {
    void payload;
  }

  @OnEvent(PLUGIN_INSTALLED)
  onPluginInstalled(payload: { slug: string }) {
    void payload;
  }

  @OnEvent(PLUGIN_REMOVED)
  onPluginRemoved(payload: { installationId: string }) {
    void payload;
  }

  @OnEvent(PUBLIC_EVENT_FANOUT)
  onPublicFanout(payload: { eventType: string }) {
    void payload;
  }

  /** Bridge internal domain events → public webhook fanout */
  @OnEvent('sales.contract_signed')
  async onContractSigned(payload: { companyId: string; contractId?: string }) {
    const type = mapInternalToPublic('sales.contract_signed');
    if (!type || !payload.companyId) return;
    await this.platform.fanoutPublicEvent(payload.companyId, type, payload as Record<string, unknown>);
  }

  @OnEvent('finance.payment_confirmed')
  async onPaymentConfirmed(payload: { companyId: string }) {
    const type = mapInternalToPublic('finance.payment_confirmed');
    if (!type || !payload.companyId) return;
    await this.platform.fanoutPublicEvent(payload.companyId, type, payload as Record<string, unknown>);
  }
}
