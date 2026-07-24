import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CONTRACT_SIGNED, ContractSignedEvent } from './sales.events';

@Injectable()
export class SalesEventListeners {
  private readonly log = new Logger(SalesEventListeners.name);

  @OnEvent(CONTRACT_SIGNED)
  onContractSigned(payload: ContractSignedEvent) {
    this.log.log(`[Welcome stub] Send welcome for student ${payload.studentId}`);
    this.log.log(`[App stub] Unlock app access for ${payload.studentId}`);
    this.log.log(`[Audit stub] Contract signed ${payload.contractId}`);
  }
}
