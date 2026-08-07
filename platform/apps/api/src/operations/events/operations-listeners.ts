import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ACCESS_ALLOWED,
  ACCESS_DENIED,
  ATTENDANCE_MARKED,
  CHECKIN_CREATED,
  CLASS_COMPLETED,
  CLASS_ENROLLED,
  CLASS_ENROLLMENT_CANCELLED,
  CLASS_WAITLISTED,
  WAITLIST_PROMOTED,
  type AttendanceMarkedEvent,
  type CheckinCreatedEvent,
  type ClassCompletedEvent,
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

  /** Stub engagement notification (G8.12) — no push provider required. */
  private async notifyStub(
    companyId: string,
    userId: string | null | undefined,
    title: string,
    body: string,
  ) {
    if (!userId) return;
    try {
      await this.supabase.getAdmin().from('notifications').insert({
        company_id: companyId,
        user_id: userId,
        title,
        body,
        channel: 'internal',
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
    } catch (e) {
      this.log.warn(`notification stub failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  private async resolveStudentUserId(studentId: string) {
    const { data } = await this.supabase
      .getAdmin()
      .from('students')
      .select('user_id')
      .eq('id', studentId)
      .maybeSingle();
    return data?.user_id ? String(data.user_id) : null;
  }

  @OnEvent(CHECKIN_CREATED)
  async onCheckin(e: CheckinCreatedEvent) {
    this.log.log(`checkin ${e.checkinId} student=${e.studentId}`);
    await this.outbox(e.companyId, CHECKIN_CREATED, { ...e });
  }

  @OnEvent(CLASS_ENROLLED)
  async onEnrolled(e: ClassEnrolledEvent) {
    await this.outbox(e.companyId, CLASS_ENROLLED, { ...e });
    const userId = await this.resolveStudentUserId(e.studentId);
    await this.notifyStub(
      e.companyId,
      userId,
      'Reserva confirmada',
      'Sua vaga na aula foi confirmada. Confira em Minha Agenda.',
    );
  }

  @OnEvent(CLASS_WAITLISTED)
  async onWaitlisted(e: ClassEnrolledEvent) {
    await this.outbox(e.companyId, CLASS_WAITLISTED, { ...e });
    const userId = await this.resolveStudentUserId(e.studentId);
    await this.notifyStub(
      e.companyId,
      userId,
      'Lista de espera',
      'A aula está lotada. Você entrou na lista de espera.',
    );
  }

  @OnEvent(CLASS_ENROLLMENT_CANCELLED)
  async onCancelled(e: ClassEnrolledEvent) {
    await this.outbox(e.companyId, CLASS_ENROLLMENT_CANCELLED, { ...e });
    const userId = await this.resolveStudentUserId(e.studentId);
    await this.notifyStub(
      e.companyId,
      userId,
      'Reserva cancelada',
      'Sua reserva de aula foi cancelada.',
    );
  }

  @OnEvent(WAITLIST_PROMOTED)
  async onPromoted(e: WaitlistPromotedEvent) {
    await this.outbox(e.companyId, WAITLIST_PROMOTED, { ...e });
    const userId = await this.resolveStudentUserId(e.studentId);
    await this.notifyStub(
      e.companyId,
      userId,
      'Vaga liberada',
      'Você saiu da lista de espera e ganhou uma vaga na aula.',
    );
  }

  @OnEvent(ATTENDANCE_MARKED)
  async onAttendance(e: AttendanceMarkedEvent) {
    await this.outbox(e.companyId, ATTENDANCE_MARKED, { ...e });
  }

  @OnEvent(CLASS_COMPLETED)
  async onCompleted(e: ClassCompletedEvent) {
    await this.outbox(e.companyId, CLASS_COMPLETED, { ...e });
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
