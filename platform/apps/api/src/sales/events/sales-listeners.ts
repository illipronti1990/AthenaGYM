import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SupabaseService } from '../../supabase/supabase.service';
import {
  CONTRACT_SIGNED,
  LEAD_CONVERTED,
  LEAD_CREATED,
  ContractSignedEvent,
  LeadConvertedEvent,
  LeadCreatedEvent,
} from './sales.events';

@Injectable()
export class SalesEventListeners {
  private readonly log = new Logger(SalesEventListeners.name);

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

  @OnEvent(CONTRACT_SIGNED)
  async onContractSigned(payload: ContractSignedEvent) {
    this.log.log(`[Welcome stub] Send welcome for student ${payload.studentId}`);
    this.log.log(`[App stub] Unlock app access for ${payload.studentId}`);
    this.log.log(`[Audit stub] Contract signed ${payload.contractId}`);
    await this.outbox(payload.companyId, CONTRACT_SIGNED, { ...payload });
  }

  @OnEvent(LEAD_CREATED)
  async onLeadCreated(payload: LeadCreatedEvent) {
    this.log.log(`[CRM] Lead criado: ${payload.leadId}`);
    await this.outbox(payload.companyId, LEAD_CREATED, { ...payload });
  }

  @OnEvent(LEAD_CONVERTED)
  async onLeadConverted(payload: LeadConvertedEvent) {
    this.log.log(`[CRM] Lead convertido: ${payload.leadId} → aluno ${payload.studentId}`);
    await this.outbox(payload.companyId, LEAD_CONVERTED, { ...payload });
  }
}
