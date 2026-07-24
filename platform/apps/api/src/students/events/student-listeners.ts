import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  STUDENT_CREATED,
  STUDENT_STATUS_CHANGED,
  STUDENT_TRANSFERRED,
  STUDENT_UPDATED,
  StudentCreatedEvent,
  StudentStatusChangedEvent,
  StudentTransferredEvent,
  StudentUpdatedEvent,
} from './student.events';

/** Stub listeners — CRM / Finance / Agenda / Notifications wire-up in later sprints */
@Injectable()
export class StudentEventListeners {
  private readonly log = new Logger(StudentEventListeners.name);

  @OnEvent(STUDENT_CREATED)
  onCreated(payload: StudentCreatedEvent) {
    this.log.log(`[CRM stub] StudentCreated ${payload.studentId}`);
    this.log.log(`[Finance stub] StudentCreated ${payload.studentId}`);
    this.log.log(`[Agenda stub] StudentCreated ${payload.studentId}`);
    this.log.log(`[Notifications stub] StudentCreated ${payload.studentId}`);
  }

  @OnEvent(STUDENT_UPDATED)
  onUpdated(payload: StudentUpdatedEvent) {
    this.log.log(`[Audit stub] StudentUpdated ${payload.studentId}`);
  }

  @OnEvent(STUDENT_STATUS_CHANGED)
  onStatus(payload: StudentStatusChangedEvent) {
    this.log.log(
      `[CRM stub] Status ${payload.oldStatus} → ${payload.newStatus} (${payload.studentId})`,
    );
  }

  @OnEvent(STUDENT_TRANSFERRED)
  onTransfer(payload: StudentTransferredEvent) {
    this.log.log(
      `[Agenda stub] Transferred ${payload.fromUnitId} → ${payload.toUnitId} (${payload.studentId})`,
    );
  }
}
