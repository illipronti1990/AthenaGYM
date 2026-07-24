import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ACCESS_ALLOWED,
  ACCESS_DENIED,
  CHECKIN_CREATED,
  CLASS_ENROLLED,
  CLASS_WAITLISTED,
  WAITLIST_PROMOTED,
  type CheckinCreatedEvent,
  type ClassEnrolledEvent,
  type WaitlistPromotedEvent,
} from './operations.events';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class OperationsEventListeners {
  private readonly log = new Logger(OperationsEventListeners.name);

  constructor(private readonly supabase: SupabaseService) {}

  private async outbox(
    companyId: string,
    eventType: string,
    payload: Record<string, unknown>,
  ) {
    try {
      await this.supabase.getAdmin().from('outbox_events').insert({
        company_id: companyId,
        event_type: eventType,
        payload,
        status: 'pending',
      });
    } catch (e) {
      this.log.warn(`outbox insert failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  @OnEvent(CHECKIN_CREATED)
  async onCheckin(e: CheckinCreatedEvent) {
    this.log.log(`checkin ${e.checkinId} student=${e.studentId}`);
    await this.outbox(e.companyId, CHECKIN_CREATED, { ...e });
  }

  @OnEvent(CLASS_ENROLLED)
  async onEnrolled(e: ClassEnrolledEvent) {
    await this.outbox(e.companyId, CLASS_ENROLLED, { ...e });
  }

  @OnEvent(CLASS_WAITLISTED)
  async onWaitlisted(e: ClassEnrolledEvent) {
    await this.outbox(e.companyId, CLASS_WAITLISTED, { ...e });
  }

  @OnEvent(WAITLIST_PROMOTED)
  async onPromoted(e: WaitlistPromotedEvent) {
    await this.outbox(e.companyId, WAITLIST_PROMOTED, { ...e });
  }

  @OnEvent(ACCESS_ALLOWED)
  async onAllowed(payload: Record<string, unknown>) {
    this.log.debug(`access allowed ${JSON.stringify(payload)}`);
  }

  @OnEvent(ACCESS_DENIED)
  async onDenied(payload: Record<string, unknown>) {
    this.log.warn(`access denied ${JSON.stringify(payload)}`);
  }
}
