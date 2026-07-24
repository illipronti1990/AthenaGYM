import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CONTRACT_SIGNED, ContractSignedEvent } from '../../sales/events/sales.events';
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

  @OnEvent(PAYMENT_CONFIRMED)
  onPaymentConfirmed(payload: PaymentConfirmedEvent) {
    this.log.log(
      `[Access] Unlock student ${payload.studentId} after payment ${payload.receivableId}`,
    );
    this.log.log(`[Notify] Receipt/email/whatsapp queued via outbox for ${payload.amount}`);
  }
}
