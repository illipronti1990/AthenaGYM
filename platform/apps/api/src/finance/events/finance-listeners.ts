import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CONTRACT_SIGNED, ContractSignedEvent } from '../../sales/events/sales.events';
import {
  STUDENT_CREATED,
  STUDENT_UPDATED,
  type StudentCreatedEvent,
  type StudentUpdatedEvent,
} from '../../students/events/student.events';
import { PAYMENT_CONFIRMED, PaymentConfirmedEvent } from './finance.events';
import { FinanceService } from '../finance.service';

@Injectable()
export class FinanceEventListeners {
  private readonly log = new Logger(FinanceEventListeners.name);

  constructor(private readonly finance: FinanceService) {}

  @OnEvent(CONTRACT_SIGNED)
  async onContractSigned(payload: ContractSignedEvent) {
    this.log.log(`Creating subscription/charge for contract ${payload.contractId}`);
    await this.finance.onContractSigned(payload);
  }

  @OnEvent(STUDENT_CREATED)
  async onStudentCreated(payload: StudentCreatedEvent) {
    if (!payload.planName) return;
    const sub = await this.finance.ensureSubscriptionFromPlanName({
      companyId: payload.companyId,
      studentId: payload.studentId,
      unitId: payload.unitId,
      planName: payload.planName,
    });
    if (sub) this.log.log(`Subscription ${sub.id} from student ${payload.studentId}`);
  }

  @OnEvent(STUDENT_UPDATED)
  async onStudentUpdated(payload: StudentUpdatedEvent) {
    if (!payload.planName) return;
    const sub = await this.finance.ensureSubscriptionFromPlanName({
      companyId: payload.companyId,
      studentId: payload.studentId,
      unitId: payload.unitId,
      planName: payload.planName,
    });
    if (sub) this.log.log(`Subscription ensured for student ${payload.studentId}`);
  }

  @OnEvent(PAYMENT_CONFIRMED)
  onPaymentConfirmed(payload: PaymentConfirmedEvent) {
    this.log.log(
      `[Access] Unlock student ${payload.studentId} after payment ${payload.receivableId}`,
    );
    this.log.log(`[Notify] Receipt/email/whatsapp queued via outbox for ${payload.amount}`);
  }
}
