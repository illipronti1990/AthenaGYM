import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SupabaseService } from '../../supabase/supabase.service';
import {
  EXPORT_REQUESTED,
  PREDICTIONS_RUN,
  REPORT_CREATED,
  REPORT_SCHEDULED,
  WAREHOUSE_SYNCED,
  type ExportRequestedEvent,
  type PredictionsRunEvent,
  type WarehouseSyncedEvent,
} from './analytics.events';

@Injectable()
export class AnalyticsEventListeners {
  private readonly log = new Logger(AnalyticsEventListeners.name);

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

  @OnEvent(WAREHOUSE_SYNCED)
  async onWarehouse(e: WarehouseSyncedEvent) {
    await this.outbox(e.companyId, WAREHOUSE_SYNCED, { ...e });
  }

  @OnEvent(EXPORT_REQUESTED)
  async onExport(e: ExportRequestedEvent) {
    await this.outbox(e.companyId, EXPORT_REQUESTED, { ...e });
  }

  @OnEvent(PREDICTIONS_RUN)
  async onPredictions(e: PredictionsRunEvent) {
    await this.outbox(e.companyId, PREDICTIONS_RUN, { ...e });
  }

  @OnEvent(REPORT_CREATED)
  async onReport(payload: Record<string, unknown>) {
    await this.outbox(String(payload.companyId), REPORT_CREATED, payload);
  }

  @OnEvent(REPORT_SCHEDULED)
  async onSchedule(payload: Record<string, unknown>) {
    await this.outbox(String(payload.companyId), REPORT_SCHEDULED, payload);
  }
}
